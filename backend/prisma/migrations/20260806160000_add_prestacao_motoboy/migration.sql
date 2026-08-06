-- CreateEnum
CREATE TYPE "StatusPrestacaoMotoboy" AS ENUM ('ENVIADA', 'APROVADA', 'REJEITADA');

-- CreateTable
CREATE TABLE "prestacoes_motoboy" (
    "id" TEXT NOT NULL,
    "motoboy_id" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "total_entregas" INTEGER NOT NULL,
    "valor_total" DECIMAL(10,2) NOT NULL,
    "valor_pendencias" DECIMAL(10,2) NOT NULL,
    "valor_final" DECIMAL(10,2) NOT NULL,
    "observacoes" TEXT,
    "status" "StatusPrestacaoMotoboy" NOT NULL DEFAULT 'ENVIADA',
    "motivo_rejeicao" TEXT,
    "aprovada_em" TIMESTAMP(3),
    "rejeitada_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prestacoes_motoboy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "prestacoes_motoboy_status_idx" ON "prestacoes_motoboy"("status");

-- CreateIndex
CREATE INDEX "prestacoes_motoboy_data_idx" ON "prestacoes_motoboy"("data");

-- CreateIndex
CREATE UNIQUE INDEX "prestacoes_motoboy_motoboy_id_data_key" ON "prestacoes_motoboy"("motoboy_id", "data");

-- AddForeignKey
ALTER TABLE "prestacoes_motoboy" ADD CONSTRAINT "prestacoes_motoboy_motoboy_id_fkey" FOREIGN KEY ("motoboy_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
