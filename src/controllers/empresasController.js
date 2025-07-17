import { prisma } from "../database/client.js";

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
    console.error("Erro ao buscar perfil da empresa:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};

export const updateMeuPerfilEmpresa = async (req, res) => {
  const empresaId = req.user.id;
  const { nome, cnpj, descricao, website } = req.body;
  try {
    const userAtualizado = await prisma.user.update({
      where: { id: empresaId },
      data: { nome },
    });
    const perfilAtualizado = await prisma.perfilEmpresa.upsert({
      where: { userId: empresaId },
      update: { cnpj, descricao, website },
      create: { userId: empresaId, cnpj, descricao, website },
    });
    delete userAtualizado.senhaHash;
    res
      .status(200)
      .json({ ...userAtualizado, perfilEmpresa: perfilAtualizado });
  } catch (error) {
    console.error("Erro ao atualizar perfil da empresa:", error);
    res.status(500).json({ message: "Erro ao atualizar perfil." });
  }
};

export const uploadLogoEmpresa = async (req, res) => {
  const userId = req.user.id;
  if (!req.file) {
    return res.status(400).json({ message: "Nenhum arquivo enviado." });
  }
  const logoUrl = `/uploads/logos/${req.file.filename}`;
  try {
    const perfilExistente = await prisma.perfilEmpresa.findUnique({
      where: { userId },
    });
    if (!perfilExistente) {
      return res.status(400).json({
        message:
          "Por favor, salve as informações do seu perfil (como nome e CNPJ) antes de enviar uma logo.",
      });
    }
    const perfilAtualizado = await prisma.perfilEmpresa.update({
      where: { userId },
      data: { logoUrl },
    });
    res.status(200).json({
      message: "Logo atualizada com sucesso!",
      perfil: perfilAtualizado,
    });
  } catch (error) {
    console.error("Erro ao fazer upload da logo:", error);
    res
      .status(500)
      .json({ message: "Erro interno ao processar o upload da logo." });
  }
};
