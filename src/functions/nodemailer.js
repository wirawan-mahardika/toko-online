import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export default function sendMessageByEmail({ subject, html, to }) {
  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    auth: {
      user: "jacey97@ethereal.email",
      pass: "VtRXWFSMmxvn9925TV",
    },
  });

  transporter.sendMail({
    from: process.env.SERVER_EMAIL,
    to,
    subject,
    html,
  });
}
