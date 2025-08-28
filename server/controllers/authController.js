const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("../generated/prisma");
const {
  sendVerificationEmail,
  sendWelcomeEmail,
  generateVerificationCode,
} = require("../utils/emailService");

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

class AuthController {
  static async register(req, res) {
    try {
      const { name, email, password } = req.body;

      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: "User already exists with this email",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const verificationCode = generateVerificationCode();

      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          verificationCode,
          isVerified: false,
        },
        select: {
          id: true,
          name: true,
          email: true,
          isVerified: true,
          createdAt: true,
        },
      });

      const emailSent = await sendVerificationEmail(email, verificationCode);

      if (!emailSent) {
        console.warn("Failed to send verification email, but user was created");
      }

      res.status(201).json({
        success: true,
        message:
          "User registered successfully. Please check your email for verification code.",
        user,
        emailSent,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  static async verifyEmail(req, res) {
    try {
      const { email, verificationCode } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (user.isVerified) {
        return res.status(400).json({
          success: false,
          message: "Email is already verified",
        });
      }

      if (user.verificationCode !== verificationCode) {
        return res.status(400).json({
          success: false,
          message: "Invalid verification code",
        });
      }

      await prisma.user.update({
        where: { email },
        data: {
          isVerified: true,
          verificationCode: null,
        },
      });

      await sendWelcomeEmail(email, user.name);

      res.status(200).json({
        success: true,
        message: "Email verified successfully",
      });
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  static async resendVerificationCode(req, res) {
    try {
      const { email } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (user.isVerified) {
        return res.status(400).json({
          success: false,
          message: "Email is already verified",
        });
      }

      const verificationCode = generateVerificationCode();

      await prisma.user.update({
        where: { email },
        data: { verificationCode },
      });

      const emailSent = await sendVerificationEmail(email, verificationCode);

      if (!emailSent) {
        return res.status(500).json({
          success: false,
          message: "Failed to send verification email",
        });
      }

      res.status(200).json({
        success: true,
        message: "Verification code resent successfully",
      });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: "Invalid credentials",
        });
      }

      if (!user.isVerified) {
        return res.status(403).json({
          success: false,
          error: "Please verify your email before logging in",
          needsVerification: true,
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: "Invalid credentials",
        });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        success: true,
        message: "Login successful",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
        },
        token,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  static async logout(req, res) {
    try {
      res.json({
        success: true,
        message:
          "Logout successful. Please remove the token from client storage.",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  static async refreshToken(req, res) {
    try {
      const userId = req.user.id;
      const email = req.user.email;

      const token = jwt.sign({ userId, email }, JWT_SECRET, {
        expiresIn: "7d",
      });

      res.json({
        success: true,
        message: "Token refreshed successfully",
        token,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }
}

module.exports = AuthController;
