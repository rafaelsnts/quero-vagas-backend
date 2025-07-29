import { prisma } from "../database/client.js";

export const getMeuPerfilEmpresa = async (req, res) => {
  console.log("=== BUSCAR PERFIL EMPRESA ===");
  console.log("User ID:", req.user.id);

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

    console.log("✅ Dados encontrados:", JSON.stringify(empresa, null, 2));
    console.log("Logo URL no banco:", empresa?.perfilEmpresa?.logoUrl);
    console.log("=== FIM BUSCAR PERFIL ===");

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
  console.log("=== INICIO UPLOAD LOGO ===");
  console.log("User ID:", req.user.id);
  console.log("Arquivo recebido:", req.file);

  const userId = req.user.id;

  if (!req.file) {
    console.log("❌ Nenhum arquivo enviado");
    return res.status(400).json({ message: "Nenhum ficheiro enviado." });
  }

  const logoUrl = `/uploads/logos/${req.file.filename}`;
  console.log("Logo URL gerada:", logoUrl);

  try {
    const perfilExistente = await prisma.perfilEmpresa.findUnique({
      where: { userId },
    });

    console.log("Perfil existente:", perfilExistente);

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

    console.log("✅ Perfil após upsert:", perfilAtualizado);

    const verificacao = await prisma.perfilEmpresa.findUnique({
      where: { userId },
    });

    console.log("🔍 Verificação no banco:", verificacao);
    console.log("=== FIM UPLOAD LOGO ===");

    res.status(200).json({
      message: "Logo atualizada com sucesso!",
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
