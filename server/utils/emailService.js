const { transporter } = require("./emailConfig");
const {
  Verification_Email_Template,
  Welcome_Email_Template,
} = require("./emailTemplates");

const sendVerificationEmail = async (email, verificationCode) => {
  try {
    const response = await transporter.sendMail({
      from: '"Polling App" <krishna.j23@iiits.in>',
      to: email,
      subject: "Verify your Email - Polling App",
      text: `Your verification code is: ${verificationCode}`,
      html: Verification_Email_Template.replace(
        "{verificationCode}",
        verificationCode
      ),
    });
    console.log("Verification email sent successfully", response.messageId);
    return true;
  } catch (error) {
    console.log("Email error:", error);
    return false;
  }
};

const sendWelcomeEmail = async (email, name) => {
  try {
    const response = await transporter.sendMail({
      from: '"Polling App" <krishna.j23@iiits.in>',
      to: email,
      subject: "Welcome to Polling App!",
      text: `Welcome ${name}! Thank you for joining our polling community.`,
      html: Welcome_Email_Template.replace("{name}", name),
    });
    console.log("Welcome email sent successfully", response.messageId);
    return true;
  } catch (error) {
    console.log("Email error:", error);
    return false;
  }
};

const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = {
  sendVerificationEmail,
  sendWelcomeEmail,
  generateVerificationCode,
};
