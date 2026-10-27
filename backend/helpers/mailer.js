import nodemailer from "nodemailer";
import logger from "../config/logger.js";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  family: 4, // ← BẮT BUỘC: chỉ dùng IPv4 deploy bên render
});

export const sendEmail = async (to, subject, htmlContent) => {
  const mailOptions = {
    from: `"Đặc Sản Ba Miền" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: subject,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.logInfo("Email sent successfully", {
      to: to,
      subject: subject,
      messageId: info.messageId,
    });
    return info;
  } catch (error) {
    logger.logError("Lỗi gửi email", error, {
      to: to,
      subject: subject,
    });
    throw error;
  }
};
