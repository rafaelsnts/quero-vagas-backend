import { prisma } from "../database/client.js";

export const getMeuPerfil = async (req, res) => {
  const userId = req.user.id;

  try {
    const userProfile = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nome: true,
        email: true,
        tipoUsuario: true,
        perfil: {
          select: {
            resumo: true,
            telefone: true,
            linkedin: true,
            habilidades: true,
            curriculoUrl: true,
          },
        },
        experiencias: {
          orderBy: { dataInicio: "desc" },
          select: {
            id: true,
            cargo: true,
            empresa: true,
            dataInicio: true,
            dataFim: true,
            descricao: true,
          },
        },
        formacoesAcademicas: {
          orderBy: { dataInicio: "desc" },
          select: {
            id: true,
            instituicao: true,
            grau: true,
            curso: true,
            dataInicio: true,
            dataFim: true,
          },
        },
      },
    });

    if (!userProfile) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    res.status(200).json(userProfile);
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    res.status(500).json({ message: "Erro ao buscar dados do perfil." });
  }
};

export const updateMeuPerfil = async (req, res) => {
  const userId = req.user.id;
  const { resumo, telefone, linkedin, habilidades } = req.body;

  try {
    const perfil = await prisma.perfil.upsert({
      where: { userId: userId },
      update: { resumo, telefone, linkedin, habilidades },
      create: { userId, resumo, telefone, linkedin, habilidades },
    });
    res.status(200).json(perfil);
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    res.status(500).json({ message: "Erro ao atualizar dados do perfil." });
  }
};

export const uploadCurriculo = async (req, res) => {
  const userId = req.user.id;

  if (!req.file) {
    return res.status(400).json({ message: "Nenhum arquivo enviado." });
  }

  const curriculoUrl = `/uploads/curriculos/${req.file.filename}`;

  try {
    const perfilAtualizado = await prisma.perfil.upsert({
      where: { userId },
      update: { curriculoUrl },
      create: {
        userId,
        curriculoUrl,
      },
    });
    res.status(200).json({
      message: "Currículo enviado com sucesso!",
      perfil: perfilAtualizado,
    });
  } catch (error) {
    console.error("Erro ao fazer upload do currículo:", error);
    res
      .status(500)
      .json({ message: "Erro interno ao processar o upload do currículo." });
  }
};

export const addExperiencia = async (req, res) => {
  const candidatoId = req.user.id;
  const { cargo, empresa, dataInicio, dataFim, descricao } = req.body;
  if (!cargo || !empresa || !dataInicio) {
    return res
      .status(400)
      .json({ message: "Cargo, empresa e data de início são obrigatórios." });
  }
  try {
    const novaExperiencia = await prisma.experiencia.create({
      data: {
        cargo,
        empresa,
        dataInicio: new Date(dataInicio),
        dataFim: dataFim ? new Date(dataFim) : null,
        descricao,
        candidatoId: candidatoId,
      },
    });
    res.status(201).json(novaExperiencia);
  } catch (error) {
    res.status(500).json({ message: "Erro ao adicionar experiência." });
  }
};

export const addFormacaoAcademica = async (req, res) => {
  const candidatoId = req.user.id;
  const { instituicao, grau, curso, dataInicio, dataFim } = req.body;
  if (!instituicao || !grau || !curso || !dataInicio) {
    return res
      .status(400)
      .json({ message: "Todos os campos obrigatórios devem ser preenchidos." });
  }
  const dataToSave = {
    instituicao,
    grau,
    curso,
    dataInicio: new Date(dataInicio),
    ...(dataFim && { dataFim: new Date(dataFim) }),
    candidatoId: candidatoId,
  };
  try {
    const novaFormacao = await prisma.formacaoAcademica.create({
      data: dataToSave,
    });
    res.status(201).json(novaFormacao);
  } catch (error) {
    res.status(500).json({ message: "Erro ao adicionar formação." });
  }
};

export const deleteExperiencia = async (req, res) => {
  const candidatoId = req.user.id;
  const experienciaId = parseInt(req.params.id);
  try {
    const experiencia = await prisma.experiencia.findUnique({
      where: { id: experienciaId },
    });
    if (!experiencia || experiencia.candidatoId !== candidatoId) {
      return res.status(403).json({
        message: "Você não tem permissão para excluir esta experiência.",
      });
    }
    await prisma.experiencia.delete({ where: { id: experienciaId } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Erro ao deletar experiência." });
  }
};

export const deleteFormacaoAcademica = async (req, res) => {
  const candidatoId = req.user.id;
  const formacaoId = parseInt(req.params.id);
  try {
    const formacao = await prisma.formacaoAcademica.findUnique({
      where: { id: formacaoId },
    });
    if (!formacao || formacao.candidatoId !== candidatoId) {
      return res.status(403).json({
        message: "Você não tem permissão para excluir esta formação.",
      });
    }
    await prisma.formacaoAcademica.delete({ where: { id: formacaoId } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Erro ao deletar formação." });
  }
};

export const updateExperiencia = async (req, res) => {
  const candidatoId = req.user.id;
  const experienciaId = parseInt(req.params.id);
  const { cargo, empresa, dataInicio, dataFim, descricao } = req.body;
  try {
    const experiencia = await prisma.experiencia.findUnique({
      where: { id: experienciaId },
    });
    if (!experiencia || experiencia.candidatoId !== candidatoId) {
      return res.status(403).json({
        message: "Você não tem permissão para editar esta experiência.",
      });
    }
    const updatedExperiencia = await prisma.experiencia.update({
      where: { id: experienciaId },
      data: {
        cargo,
        empresa,
        dataInicio: new Date(dataInicio),
        dataFim: dataFim ? new Date(dataFim) : null,
        descricao,
      },
    });
    res.status(200).json(updatedExperiencia);
  } catch (error) {
    res.status(500).json({ message: "Erro ao atualizar experiência." });
  }
};

export const updateFormacaoAcademica = async (req, res) => {
  const candidatoId = req.user.id;
  const formacaoId = parseInt(req.params.id);
  const { instituicao, grau, curso, dataInicio, dataFim } = req.body;
  try {
    const formacao = await prisma.formacaoAcademica.findUnique({
      where: { id: formacaoId },
    });
    if (!formacao || formacao.candidatoId !== candidatoId) {
      return res
        .status(403)
        .json({ message: "Você não tem permissão para editar esta formação." });
    }
    const updatedFormacao = await prisma.formacaoAcademica.update({
      where: { id: formacaoId },
      data: {
        instituicao,
        grau,
        curso,
        dataInicio: new Date(dataInicio),
        dataFim: dataFim ? new Date(dataFim) : null,
      },
    });
    res.status(200).json(updatedFormacao);
  } catch (error) {
    res.status(500).json({ message: "Erro ao atualizar formação acadêmica." });
  }
};

export const getPerfilById = async (req, res) => {
  const candidatoId = parseInt(req.params.id);
  if (isNaN(candidatoId)) {
    return res.status(400).json({ message: "ID de candidato inválido." });
  }
  try {
    const userProfile = await prisma.user.findUnique({
      where: { id: candidatoId, tipoUsuario: "CANDIDATO" },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: {
          select: {
            resumo: true,
            telefone: true,
            linkedin: true,
            habilidades: true,
            curriculoUrl: true,
          },
        },
        experiencias: {
          orderBy: { dataInicio: "desc" },
          select: {
            id: true,
            cargo: true,
            empresa: true,
            dataInicio: true,
            dataFim: true,
            descricao: true,
          },
        },
        formacoesAcademicas: {
          orderBy: { dataInicio: "desc" },
          select: {
            id: true,
            instituicao: true,
            grau: true,
            curso: true,
            dataInicio: true,
            dataFim: true,
          },
        },
      },
    });
    if (!userProfile) {
      return res
        .status(404)
        .json({ message: "Perfil de candidato não encontrado." });
    }
    res.status(200).json(userProfile);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar dados do perfil." });
  }
};
