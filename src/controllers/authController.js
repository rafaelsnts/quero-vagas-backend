import { prisma } from "../database/client.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendPasswordResetEmail } from "../utils/mailer.js";
import crypto from "crypto";

export const registerCandidate = async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res
      .status(400)
      .json({ message: "Todos os campos são obrigatórios." });
  }

  const senhaRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!senhaRegex.test(senha)) {
    return res.status(400).json({
      message:
        "A senha deve ter no mínimo 8 caracteres, incluindo uma letra maiúscula, uma minúscula, um número e um caractere especial (@$!%*?&).",
    });
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
    res.status(201).json({
      id: newUser.id,
      nome: newUser.nome,
      email: newUser.email,
      tipoUsuario: newUser.tipoUsuario,
    });
  } catch (error) {
    console.error("Erro ao registrar candidato:", error);
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

  const senhaRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!senhaRegex.test(senha)) {
    return res.status(400).json({
      message:
        "A senha deve ter no mínimo 8 caracteres, incluindo uma letra maiúscula, uma minúscula, um número e um caractere especial (@$!%*?&).",
    });
  }

  try {
    const userExists = await prisma.user.findUnique({ where: { email } });
    const companyExists = await prisma.perfilEmpresa.findUnique({
      where: { cnpj },
    });
    if (userExists || companyExists) {
      return res.status(409).json({ message: "Email ou CNPJ já cadastrado." });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const newUser = await prisma.user.create({
      data: {
        nome: nomeEmpresa,
        email,
        senhaHash,
        tipoUsuario: "EMPRESA",
        perfilEmpresa: { create: { cnpj: cnpj } },
      },
      include: { perfilEmpresa: true },
    });

    const planoBasico = await prisma.plano.findFirst({
      where: {
        OR: [{ nome: "Plano Básico" }, { id: "basico" }, { preco: 0 }],
      },
    });

    if (planoBasico) {
      const hoje = new Date();
      const dataFim = new Date();
      dataFim.setDate(hoje.getDate() + 30);

      try {
        await prisma.assinatura.create({
          data: {
            empresaId: newUser.perfilEmpresa.id,
            planoId: planoBasico.id,
            dataInicio: hoje,
            dataFim: dataFim,
            status: "active",
            gatewaySubscriptionId: `free_${
              newUser.perfilEmpresa.id
            }_${Date.now()}`,
          },
        });
      } catch (assinaturaError) {
        console.error("Erro ao criar assinatura inicial:", assinaturaError);
      }
    } else {
      console.error(
        "Plano gratuito não encontrado. A empresa foi criada sem assinatura inicial."
      );
    }

    const token = jwt.sign(
      {
        userId: newUser.id,
        nome: newUser.nome,
        tipoUsuario: newUser.tipoUsuario,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    delete newUser.senhaHash;

    res.status(201).json({
      message:
        "Empresa registrada com sucesso! Assinatura do plano Básico ativada.",
      token,
      user: newUser,
    });
  } catch (error) {
    console.error("Erro ao registrar empresa:", error);
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
    res.status(200).json({
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
    console.error("Erro no login:", error);
    res.status(500).json({ message: "Ocorreu um erro no servidor." });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(200).json({
        message:
          "Se o email estiver cadastrado, um link de redefinição será enviado.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data: { passwordResetToken, passwordResetExpires },
    });

    await sendPasswordResetEmail(user.email, resetToken);

    res.status(200).json({
      message:
        "Se o email estiver cadastrado, um link de redefinição será enviado.",
    });
  } catch (error) {
    console.error("Erro no processo de 'esqueci a senha':", error);
    res.status(200).json({
      message:
        "Se o email estiver cadastrado, um link de redefinição será enviado.",
    });
  }
};

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
      where: {
        passwordResetToken,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({
        message:
          "Token inválido ou expirado. Por favor, solicite um novo link.",
      });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        senhaHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    res.status(200).json({ message: "Senha redefinida com sucesso!" });
  } catch (error) {
    console.error("Erro ao redefinir a senha:", error);
    res.status(500).json({ message: "Ocorreu um erro no servidor." });
  }
};

export const getMeuPerfilEmpresa = async (req, res) => {
  try {
    const empresa = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        nome: true,
        email: true,
        perfilEmpresa: {
          select: {
            id: true,
            cnpj: true,
            descricao: true,
            website: true,
            logoUrl: true,
          },
        },
      },
    });

    res.status(200).json(empresa);
  } catch (error) {
    console.error("❌ Erro ao buscar perfil da empresa:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};

export const updateMeuPerfilEmpresa = async (req, res) => {
  const empresaId = req.user.id;
  const { nome, cnpj, descricao, website } = req.body;

  try {
    const perfilAtual = await prisma.perfilEmpresa.findUnique({
      where: { userId: empresaId },
      select: { logoUrl: true },
    });

    const userAtualizado = await prisma.user.update({
      where: { id: empresaId },
      data: { nome },
    });

    const perfilAtualizado = await prisma.perfilEmpresa.upsert({
      where: { userId: empresaId },
      update: {
        cnpj,
        descricao,
        website,
        logoUrl: perfilAtual?.logoUrl,
      },
      create: {
        userId: empresaId,
        cnpj,
        descricao,
        website,
        logoUrl: perfilAtual?.logoUrl || null,
      },
    });

    delete userAtualizado.senhaHash;

    res.status(200).json({
      ...userAtualizado,
      perfilEmpresa: perfilAtualizado,
    });
  } catch (error) {
    console.error("Erro ao atualizar perfil da empresa:", error);
    res.status(500).json({ message: "Erro ao atualizar perfil." });
  }
};

export const uploadLogoEmpresa = async (req, res) => {
  const userId = req.user.id;

  if (!req.file) {
    return res.status(400).json({ message: "Nenhum ficheiro enviado." });
  }

  const logoUrl = `/uploads/logos/${req.file.filename}`;

  try {
    const perfilExistente = await prisma.perfilEmpresa.findUnique({
      where: { userId },
    });

    const perfilAtualizado = await prisma.perfilEmpresa.upsert({
      where: { userId },
      update: { logoUrl },
      create: {
        userId,
        logoUrl,
        cnpj: "",
        descricao: "",
        website: "",
      },
    });

    const empresaCompleta = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nome: true,
        email: true,
        perfilEmpresa: {
          select: {
            id: true,
            cnpj: true,
            descricao: true,
            website: true,
            logoUrl: true,
          },
        },
      },
    });

    const verificacao = await prisma.perfilEmpresa.findUnique({
      where: { userId },
    });

    res.status(200).json({
      message: "Logo atualizada com sucesso!",
      empresa: empresaCompleta,
      perfil: perfilAtualizado,
    });
  } catch (error) {
    console.error("❌ Erro ao fazer upload da logo:", error);
    res.status(500).json({
      message: "Erro interno ao processar o upload da logo.",
      error: error.message,
    });
  }
};
