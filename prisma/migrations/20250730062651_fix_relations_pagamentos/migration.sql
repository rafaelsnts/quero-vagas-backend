-- DropForeignKey
ALTER TABLE "Assinatura" DROP CONSTRAINT "Assinatura_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "Vaga" DROP CONSTRAINT "Vaga_empresaId_fkey";

-- DropIndex
DROP INDEX "Assinatura_gatewayCustomerId_key";

-- AlterTable
ALTER TABLE "Assinatura" ADD COLUMN     "dataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "gatewaySubscriptionId" DROP NOT NULL,
ALTER COLUMN "gatewayCustomerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Assinatura" ADD CONSTRAINT "Assinatura_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "PerfilEmpresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vaga" ADD CONSTRAINT "Vaga_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "PerfilEmpresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
