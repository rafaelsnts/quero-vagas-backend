import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendPasswordResetEmail(userEmail, resetToken) {
  const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

  const mailOptions = {
    from: `"Quero Vagas" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: "Redefinição de Senha - Quero Vagas",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px;">
        <h2 style="color: #2A2F8C; text-align: center;">Redefinição de Senha</h2>
        <p>Olá,</p>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta no Quero Vagas.</p>
        <p>Clique no botão abaixo para criar uma nova senha. Este link é válido por 10 minutos.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a 
            href="${resetUrl}" 
            style="background-color: #5D3FD3; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-size: 16px;"
          >
            Redefinir Minha Senha
          </a>
        </div>
        <p>Se você não solicitou esta alteração, pode ignorar este email com segurança.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">Enviado por Quero Vagas</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email de redefinição enviado com sucesso para: ${userEmail}`);
  } catch (error) {
    console.error("Erro ao enviar email com Nodemailer:", error);
    throw new Error("Falha ao enviar o email de redefinição.");
  }
}
