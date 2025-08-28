const jwt = require("jsonwebtoken");
const { PrismaClient } = require("../generated/prisma");

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

const createContext = async ({ req }) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  let user = null;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);

      user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });
    } catch (error) {
      console.log("Invalid token:", error.message);
    }
  }

  return {
    user,
    prisma,
  };
};

module.exports = createContext;
