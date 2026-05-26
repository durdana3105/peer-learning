import nodemailer from "nodemailer";

export const sendEmail = async (email, url) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "your_email@gmail.com",
      pass: "your_app_password",
    },
  });

  await transporter.sendMail({
    to: email,
    subject: "Password Reset",
    html: `<p>Click below to reset password:</p>
           <a href="${url}">${url}</a>`,
  });
};