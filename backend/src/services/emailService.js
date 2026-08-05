const nodemailer = require('nodemailer');

// Configuración básica, reemplaza con tus credenciales reales
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'usuario@example.com',
    pass: process.env.SMTP_PASS || 'password',
  },
});

async function enviarTokenActivacion(email, nombreEmpresa, token) {
  const activationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/activar-cuenta?token=${token}`;
  const mailOptions = {
    from: process.env.SMTP_FROM || 'no-reply@dynamicrestobar.com',
    to: email,
    subject: 'Activa tu cuenta de DynamicRestoBar',
    html: `<p>Hola,<br>Tu empresa <b>${nombreEmpresa}</b> ha sido registrada.<br>
    Haz clic en el siguiente enlace para activar tu cuenta y establecer tu contraseña:<br>
    <a href="${activationUrl}">${activationUrl}</a></p>`
  };
  await transporter.sendMail(mailOptions);
}

module.exports = { enviarTokenActivacion };
