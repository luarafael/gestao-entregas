-- CreateEnum
CREATE TYPE "StatusEntrega" AS ENUM ('ENTREGUE', 'CANCELADA');

-- CreateEnum
CREATE TYPE "StatusPendencia" AS ENUM ('PENDENTE', 'RECEBIDO');

-- CreateTable
CREATE TABLE "entregas" (
    "id" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "horario" TIMESTAMP(3) NOT NULL,
    "nomeCliente" TEXT,
    "endereco" TEXT NOT NULL,
    "bairro" TEXT NOT NULL,
    "cidade" TEXT,
    "observacao" TEXT,
    "valorEntrega" DECIMAL(10,2) NOT NULL,
    "status" "StatusEntrega" NOT NULL DEFAULT 'ENTREGUE',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entregas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pendencias" (
    "id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "referenteAoDia" DATE NOT NULL,
    "status" "StatusPendencia" NOT NULL DEFAULT 'PENDENTE',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pendencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prestacoes_contas" (
    "id" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "totalEntregas" INTEGER NOT NULL,
    "valorTotal" DECIMAL(10,2) NOT NULL,
    "valorPendencias" DECIMAL(10,2) NOT NULL,
    "valorFinal" DECIMAL(10,2) NOT NULL,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prestacoes_contas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "entregas_data_idx" ON "entregas"("data");

-- CreateIndex
CREATE INDEX "entregas_bairro_idx" ON "entregas"("bairro");

-- CreateIndex
CREATE INDEX "pendencias_referenteAoDia_idx" ON "pendencias"("referenteAoDia");

-- CreateIndex
CREATE INDEX "pendencias_status_idx" ON "pendencias"("status");

-- CreateIndex
CREATE UNIQUE INDEX "prestacoes_contas_data_key" ON "prestacoes_contas"("data");
