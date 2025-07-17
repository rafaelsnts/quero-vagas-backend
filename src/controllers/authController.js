import { prisma } from "../database/client.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendPasswordResetEmail } from "../utils/mailer.js";
import crypto from "crypto";

// --- Funções de Registro e Login (sem alterações) ---
export const registerCandidate = async (req, res) => {
  const { nome, email, senha } = req.body;
  if (!nome || !email || !senha) {
    return res
      .status(400)
      .json({ message: "Todos os campos são obrigatórios." });
  }
  try {
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(409).json({ message: "Este e-mail já está em uso." });
    }
    const senhaHash = await bcrypt.hash(senha, 10);
    const newUser = await prisma.user.create({
      data: { nome, email, senhaHash, tipoUsuario: "CANDIDATO" },
    });
    res
      .status(201)
      .json({
        id: newUser.id,
        nome: newUser.nome,
        email: newUser.email,
        tipoUsuario: newUser.tipoUsuario,
      });
  } catch (error) {
    res.status(500).json({ message: "Ocorreu um erro no servidor." });
  }
};

export const registerCompany = async (req, res) => {
  const { nomeEmpresa, cnpj, email, senha } = req.body;
  if (!nomeEmpresa || !cnpj || !email || !senha) {
    return res
      .status(400)
      .json({ message: "Todos os campos são obrigatórios." });
  }
  try {
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(409).json({ message: "Este e-mail já está em uso." });
    }
    const senhaHash = await bcrypt.hash(senha, 10);
    const newUser = await prisma.user.create({
      data: { nome: nomeEmpresa, email, senhaHash, tipoUsuario: "EMPRESA" },
    });
    res
      .status(201)
      .json({
        id: newUser.id,
        nome: newUser.nome,
        email: newUser.email,
        tipoUsuario: newUser.tipoUsuario,
      });
  } catch (error) {
    res.status(500).json({ message: "Ocorreu um erro no servidor." });
  }
};

export const login = async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ message: "Email e senha são obrigatórios." });
  }
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }
    const passwordMatch = await bcrypt.compare(senha, user.senhaHash);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }
    const token = jwt.sign(
      { userId: user.id, nome: user.nome, tipoUsuario: user.tipoUsuario },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    res
      .status(200)
      .json({
        message: "Login realizado com sucesso!",
        token,
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          tipoUsuario: user.tipoUsuario,
        },
      });
  } catch (error) {
    res.status(500).json({ message: "Ocorreu um erro no servidor." });
  }
};

// --- FUNÇÃO "ESQUECI MINHA SENHA" COM TEMPO DE EXPIRAÇÃO CORRIGIDO ---
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res
        .status(200)
        .json({
          message:
            "Se o email estiver cadastrado, um link de redefinição será enviado.",
        });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // --- AQUI ESTÁ A MUDANÇA ---
    // Aumentamos o tempo de expiração para 1 hora (60 minutos * 60 segundos * 1000 milissegundos)
    const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data: { passwordResetToken, passwordResetExpires },
    });

    await sendPasswordResetEmail(user.email, resetToken);

    res
      .status(200)
      .json({
        message:
          "Se o email estiver cadastrado, um link de redefinição será enviado.",
      });
  } catch (error) {
    console.error("Erro no processo de 'esqueci a senha':", error);
    res
      .status(200)
      .json({
        message:
          "Se o email estiver cadastrado, um link de redefinição será enviado.",
      });
  }
};

// --- FUNÇÃO DE REDEFINIR SENHA (sem alterações) ---
export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { senha } = req.body;
  if (!senha) {
    return res.status(400).json({ message: "A nova senha é obrigatória." });
  }
  const passwordResetToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  try {
    const user = await prisma.user.findFirst({
      where: { passwordResetToken, passwordResetExpires: { gt: new Date() } },
    });
    if (!user) {
      return res
        .status(400)
        .json({
          message:
            "Token inválido ou expirado. Por favor, solicite um novo link.",
        });
    }
    const senhaHash = await bcrypt.hash(senha, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { senhaHash, passwordResetToken: null, passwordResetExpires: null },
    });
    res.status(200).json({ message: "Senha redefinida com sucesso!" });
  } catch (error) {
    res.status(500).json({ message: "Ocorreu um erro no servidor." });
  }
};
