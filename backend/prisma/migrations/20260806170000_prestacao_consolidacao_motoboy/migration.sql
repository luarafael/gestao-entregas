-- AlterTable
ALTER TABLE "prestacoes_contas" ADD COLUMN "valor_repasse_motoboys" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN "valor_liquido" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Backfill valor_liquido for existing rows
UPDATE "prestacoes_contas" SET "valor_liquido" = "valor_final";

-- AlterTable
ALTER TABLE "prestacoes_motoboy" ADD COLUMN "prestacao_contas_id" TEXT;

-- CreateIndex
CREATE INDEX "prestacoes_motoboy_prestacao_contas_id_idx" ON "prestacoes_motoboy"("prestacao_contas_id");

-- AddForeignKey
ALTER TABLE "prestacoes_motoboy" ADD CONSTRAINT "prestacoes_motoboy_prestacao_contas_id_fkey" FOREIGN KEY ("prestacao_contas_id") REFERENCES "prestacoes_contas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
