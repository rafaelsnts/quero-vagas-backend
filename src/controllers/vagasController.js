import { prisma } from "../database/client.js";

export const getVagas = async (req, res) => {
  try {
    const { page = 1, limit = 9, termoBusca, modalidade } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = {};

    if (termoBusca) {
      whereClause.titulo = {
        contains: termoBusca,
        mode: "insensitive",
      };
    }

    if (modalidade) {
      whereClause.modalidade = modalidade;
    }

    const [vagas, total] = await prisma.$transaction([
      prisma.vaga.findMany({
        take: parseInt(limit),
        skip: skip,
        where: whereClause,
        include: { empresa: { select: { nome: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.vaga.count({ where: whereClause }),
    ]);

    const totalPaginas = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      vagas,
      total,
      totalPaginas,
      paginaAtual: parseInt(page),
    });
  } catch (error) {
    console.error("Erro ao buscar vagas:", error);
    res.status(500).json({ message: "Erro ao buscar vagas." });
  }
};
export const getVagaById = async (req, res) => {
  const vagaId = parseInt(req.params.id);
  if (isNaN(vagaId)) {
    return res.status(400).json({ message: "ID da vaga inválido." });
  }
  try {
    const vaga = await prisma.vaga.findUnique({
      where: { id: vagaId },
      include: { empresa: { select: { nome: true } } },
    });
    if (!vaga) {
      return res.status(404).json({ message: "Vaga não encontrada." });
    }
    res.status(200).json(vaga);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar vaga." });
  }
};

export const createVaga = async (req, res) => {
  const { titulo, descricao, requisitos, salario, modalidade, localizacao } =
    req.body;
  const empresaId = req.user.id;
  try {
    const novaVaga = await prisma.vaga.create({
      data: {
        titulo,
        descricao,
        requisitos,
        salario,
        modalidade,
        localizacao,
        empresaId,
      },
    });
    res.status(201).json(novaVaga);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Ocorreu um erro no servidor ao criar vaga." });
  }
};

export const getMinhasVagas = async (req, res) => {
  const empresaId = req.user.id;
  try {
    const vagas = await prisma.vaga.findMany({
      where: { empresaId: empresaId },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(vagas);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar vagas da empresa." });
  }
};

export const candidatarAVaga = async (req, res) => {
  const candidatoId = req.user.id;
  const vagaId = parseInt(req.params.id);

  try {
    const perfilCandidato = await prisma.user.findUnique({
      where: { id: candidatoId },
      include: {
        perfil: true,
        experiencias: true,
        formacoesAcademicas: true,
      },
    });

    const perfil = perfilCandidato.perfil;

    const isProfileComplete =
      perfil &&
      perfil.resumo &&
      perfil.curriculoUrl &&
      perfilCandidato.experiencias.length > 0 &&
      perfilCandidato.formacoesAcademicas.length > 0;

    if (!isProfileComplete) {
      return res.status(400).json({
        message:
          "Seu perfil está incompleto. Por favor, preencha seu resumo, adicione ao menos uma experiência, uma formação e anexe seu currículo antes de se candidatar.",
      });
    }

    const candidaturaExistente = await prisma.candidatura.findUnique({
      where: { vagaId_candidatoId: { vagaId, candidatoId } },
    });
    if (candidaturaExistente) {
      return res
        .status(409)
        .json({ message: "Você já se candidatou a esta vaga." });
    }
    const novaCandidatura = await prisma.candidatura.create({
      data: { vagaId, candidatoId },
    });
    res.status(201).json(novaCandidatura);
  } catch (error) {
    console.error("Erro ao processar candidatura:", error);
    res.status(500).json({ message: "Erro ao processar sua candidatura." });
  }
};

export const getVagaCandidatos = async (req, res) => {
  const vagaId = parseInt(req.params.id);
  const empresaId = req.user.id;
  try {
    const vaga = await prisma.vaga.findFirst({
      where: { id: vagaId, empresaId: empresaId },
    });
    if (!vaga) {
      return res.status(403).json({
        message: "Você não tem permissão para ver os candidatos desta vaga.",
      });
    }
    const candidaturas = await prisma.candidatura.findMany({
      where: { vagaId: vagaId },
      include: {
        candidato: {
          select: { id: true, nome: true, email: true, perfil: true },
        },
      },
    });
    res.status(200).json(candidaturas);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar candidatos." });
  }
};
export const updateVaga = async (req, res) => {
  const vagaId = parseInt(req.params.id);
  const empresaId = req.user.id;
  const { titulo, descricao, requisitos, salario, modalidade, localizacao } =
    req.body;

  try {
    const vagaExistente = await prisma.vaga.findUnique({
      where: { id: vagaId },
    });

    if (!vagaExistente) {
      return res.status(404).json({ message: "Vaga não encontrada." });
    }

    if (vagaExistente.empresaId !== empresaId) {
      return res
        .status(403)
        .json({ message: "Você não tem permissão para editar esta vaga." });
    }

    const vagaAtualizada = await prisma.vaga.update({
      where: { id: vagaId },
      data: {
        titulo,
        descricao,
        requisitos,
        salario,
        modalidade,
        localizacao,
      },
    });

    res.status(200).json(vagaAtualizada);
  } catch (error) {
    console.error("Erro ao atualizar vaga:", error);
    res.status(500).json({ message: "Erro ao atualizar vaga." });
  }
};
export const deleteVaga = async (req, res) => {
  const vagaId = parseInt(req.params.id);
  const empresaId = req.user.id;

  try {
    const vagaExistente = await prisma.vaga.findFirst({
      where: {
        id: vagaId,
        empresaId: empresaId,
      },
    });

    if (!vagaExistente) {
      return res.status(403).json({
        message:
          "Você não tem permissão para excluir esta vaga ou ela não existe.",
      });
    }
    await prisma.vaga.delete({
      where: { id: vagaId },
    });

    res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar vaga:", error);
    res.status(500).json({ message: "Erro ao deletar vaga." });
  }
};
