import { prisma } from "../database/client.js";

export const getMinhasCandidaturas = async (req, res) => {
  const candidatoId = req.user.id;

  try {
    const candidaturasBasicas = await prisma.candidatura.findMany({
      where: { candidatoId: candidatoId },
      select: { id: true, status: true, createdAt: true, vagaId: true },
      orderBy: { createdAt: "desc" },
    });

    if (candidaturasBasicas.length === 0) {
      return res.status(200).json([]);
    }

    const vagaIds = candidaturasBasicas.map((c) => c.vagaId);

    const detalhesDasVagas = await prisma.vaga.findMany({
      where: {
        id: { in: vagaIds },
      },
      select: {
        id: true,
        titulo: true,
        localizacao: true,
        empresa: {
          select: { nome: true },
        },
      },
    });

    const mapaDeVagas = new Map(detalhesDasVagas.map((v) => [v.id, v]));

    const resultadoFinal = candidaturasBasicas.map((candidatura) => ({
      ...candidatura,
      vaga: mapaDeVagas.get(candidatura.vagaId) || null,
    }));

    res.status(200).json(resultadoFinal);
  } catch (error) {
    console.error("Erro ao buscar as candidaturas do usuário:", error);
    res.status(500).json({ message: "Erro ao buscar suas candidaturas." });
  }
};

export const updateStatusCandidatura = async (req, res) => {
  const empresaId = req.user.id;
  const candidaturaId = parseInt(req.params.id);
  const { status } = req.body;

  const statusValidos = [
    "RECEBIDA",
    "EM_ANALISE",
    "APROVADO_ENTREVISTA",
    "REPROVADO",
    "CONTRATADO",
  ];
  if (!status || !statusValidos.includes(status)) {
    return res.status(400).json({ message: "Status inválido." });
  }

  try {
    const candidatura = await prisma.candidatura.findUnique({
      where: { id: candidaturaId },
      select: { vaga: { select: { empresaId: true } } },
    });

    if (!candidatura || candidatura.vaga.empresaId !== empresaId) {
      return res.status(403).json({
        message: "Você não tem permissão para alterar esta candidatura.",
      });
    }

    const candidaturaAtualizada = await prisma.candidatura.update({
      where: { id: candidaturaId },
      data: { status: status },
    });

    res.status(200).json(candidaturaAtualizada);
  } catch (error) {
    console.error("Erro ao atualizar status da candidatura:", error);
    res.status(500).json({ message: "Erro ao atualizar status." });
  }
};
