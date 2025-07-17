-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('CANDIDATO', 'EMPRESA');

-- CreateEnum
CREATE TYPE "ModalidadeVaga" AS ENUM ('PRESENCIAL', 'HIBRIDO', 'REMOTO');

-- CreateEnum
CREATE TYPE "StatusCandidatura" AS ENUM ('RECEBIDA', 'EM_ANALISE', 'APROVADO_ENTREVISTA', 'REPROVADO', 'CONTRATADO');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "tipoUsuario" "UserType" NOT NULL,
    "passwordResetToken" TEXT,
    "passwordResetExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vaga" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "requisitos" TEXT NOT NULL,
    "salario" TEXT,
    "modalidade" "ModalidadeVaga" NOT NULL,
    "localizacao" TEXT NOT NULL,
    "isDestaque" BOOLEAN NOT NULL DEFAULT false,
    "destaqueExpiresAt" TIMESTAMP(3),
    "empresaId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vaga_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Perfil" (
    "id" SERIAL NOT NULL,
    "resumo" TEXT,
    "telefone" TEXT,
    "linkedin" TEXT,
    "habilidades" TEXT,
    "curriculoUrl" TEXT,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Perfil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Experiencia" (
    "id" SERIAL NOT NULL,
    "cargo" TEXT NOT NULL,
    "empresa" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "descricao" TEXT,
    "candidatoId" INTEGER NOT NULL,

    CONSTRAINT "Experiencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormacaoAcademica" (
    "id" SERIAL NOT NULL,
    "instituicao" TEXT NOT NULL,
    "grau" TEXT NOT NULL,
    "curso" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "candidatoId" INTEGER NOT NULL,

    CONSTRAINT "FormacaoAcademica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidatura" (
    "id" SERIAL NOT NULL,
    "status" "StatusCandidatura" NOT NULL DEFAULT 'RECEBIDA',
    "anotacoes" TEXT,
    "vagaId" INTEGER NOT NULL,
    "candidatoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Candidatura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerfilEmpresa" (
    "id" SERIAL NOT NULL,
    "cnpj" TEXT NOT NULL,
    "descricao" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "PerfilEmpresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notificacao" (
    "id" SERIAL NOT NULL,
    "mensagem" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "destinatarioId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plano" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "preco" DOUBLE PRECISION NOT NULL,
    "limiteVagas" INTEGER NOT NULL,
    "stripePriceId" TEXT NOT NULL,

    CONSTRAINT "Plano_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assinatura" (
    "id" SERIAL NOT NULL,
    "status" TEXT NOT NULL,
    "dataFim" TIMESTAMP(3),
    "empresaId" INTEGER NOT NULL,
    "planoId" TEXT NOT NULL,
    "gatewaySubscriptionId" TEXT NOT NULL,
    "gatewayCustomerId" TEXT NOT NULL,

    CONSTRAINT "Assinatura_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_passwordResetToken_key" ON "User"("passwordResetToken");

-- CreateIndex
CREATE UNIQUE INDEX "Perfil_userId_key" ON "Perfil"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Candidatura_vagaId_candidatoId_key" ON "Candidatura"("vagaId", "candidatoId");

-- CreateIndex
CREATE UNIQUE INDEX "PerfilEmpresa_cnpj_key" ON "PerfilEmpresa"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "PerfilEmpresa_userId_key" ON "PerfilEmpresa"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Plano_stripePriceId_key" ON "Plano"("stripePriceId");

-- CreateIndex
CREATE UNIQUE INDEX "Assinatura_empresaId_key" ON "Assinatura"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "Assinatura_gatewaySubscriptionId_key" ON "Assinatura"("gatewaySubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "Assinatura_gatewayCustomerId_key" ON "Assinatura"("gatewayCustomerId");

-- AddForeignKey
ALTER TABLE "Vaga" ADD CONSTRAINT "Vaga_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Perfil" ADD CONSTRAINT "Perfil_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Experiencia" ADD CONSTRAINT "Experiencia_candidatoId_fkey" FOREIGN KEY ("candidatoId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormacaoAcademica" ADD CONSTRAINT "FormacaoAcademica_candidatoId_fkey" FOREIGN KEY ("candidatoId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidatura" ADD CONSTRAINT "Candidatura_vagaId_fkey" FOREIGN KEY ("vagaId") REFERENCES "Vaga"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidatura" ADD CONSTRAINT "Candidatura_candidatoId_fkey" FOREIGN KEY ("candidatoId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerfilEmpresa" ADD CONSTRAINT "PerfilEmpresa_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_destinatarioId_fkey" FOREIGN KEY ("destinatarioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assinatura" ADD CONSTRAINT "Assinatura_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assinatura" ADD CONSTRAINT "Assinatura_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "Plano"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
