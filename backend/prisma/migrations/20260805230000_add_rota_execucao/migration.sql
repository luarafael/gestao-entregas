-- CreateEnum
CREATE TYPE "StatusExecucaoParada" AS ENUM (
  'PENDENTE',
  'EM_ROTA',
  'ENTREGUE',
  'CLIENTE_AUSENTE',
  'NAO_LOCALIZADO',
  'CANCELADA',
  'FALHA_ENTREGA'
);

-- AlterTable
ALTER TABLE "rota_paradas" ADD COLUMN "telefone" TEXT;

-- CreateTable
CREATE TABLE "rota_execucao" (
    "id" TEXT NOT NULL,
    "rotaId" TEXT NOT NULL,
    "paradaId" TEXT,
    "entregaId" TEXT,
    "ordem" INTEGER NOT NULL,
    "status" "StatusExecucaoParada" NOT NULL DEFAULT 'PENDENTE',
    "dataHoraStatus" TIMESTAMP(3),
    "observacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rota_execucao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rota_execucao_rotaId_idx" ON "rota_execucao"("rotaId");

-- CreateIndex
CREATE INDEX "rota_execucao_paradaId_idx" ON "rota_execucao"("paradaId");

-- CreateIndex
CREATE INDEX "rota_execucao_entregaId_idx" ON "rota_execucao"("entregaId");

-- AddForeignKey
ALTER TABLE "rota_execucao" ADD CONSTRAINT "rota_execucao_rotaId_fkey" FOREIGN KEY ("rotaId") REFERENCES "rotas_planejadas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rota_execucao" ADD CONSTRAINT "rota_execucao_paradaId_fkey" FOREIGN KEY ("paradaId") REFERENCES "rota_paradas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
