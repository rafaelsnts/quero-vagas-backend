import { prisma } from "../database/client.js";

export const getMeuPerfilEmpresa = async (req, res) => {
  try {
    const userId = req.user.id;
    const userProfile = await prisma.user.findUnique({
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

    if (!userProfile) {
      return res
        .status(404)
        .json({ message: "Perfil de empresa não encontrado." });
    }

    res.status(200).json(userProfile);
  } catch (error) {
    console.error("❌ Erro ao buscar perfil da empresa:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};

export const updateMeuPerfilEmpresa = async (req, res) => {
  const userId = req.user.id;
  const { nome, cnpj, descricao, website } = req.body;
  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { nome },
      }),
      prisma.perfilEmpresa.update({
        where: { userId: userId },
        data: { cnpj, descricao, website },
      }),
    ]);

    const userProfileCompleto = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        perfilEmpresa: true,
      },
    });

    delete userProfileCompleto.senhaHash;

    res.status(200).json(userProfileCompleto);
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

    if (!perfilExistente) {
      return res
        .status(404)
        .json({ message: "Perfil da empresa não encontrado." });
    }

    const perfilAtualizado = await prisma.perfilEmpresa.update({
      where: { userId },
      data: { logoUrl },
    });

    res.status(200).json({
      message: "Logótipo atualizado com sucesso!",
      perfil: perfilAtualizado,
    });
  } catch (error) {
    console.error("❌ Erro ao fazer upload do logótipo:", error);
    res.status(500).json({
      message: "Erro interno ao processar o upload do logótipo.",
      error: error.message,
    });
  }
};
