const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || "krishna.j23@iiits.in",
    pass: process.env.EMAIL_PASS || "ixcj ppjr iupe awxy",
  },
});

module.exports = { transporter };
