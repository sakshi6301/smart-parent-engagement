const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      tls: { rejectUnauthorized: false },
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      pool: false,
      maxConnections: 1,
      rateDelta: 2000,
      rateLimit: 1,
    });
  }
  return transporter;
};

const sendEmail = async ({ to, subject, html }) => {
  await getTransporter().sendMail({
    from: `"SCOPE School" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to, subject, html,
  });
};

module.exports = sendEmail;
