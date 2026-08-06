-- CreateEnum
CREATE TYPE "TipoPendencia" AS ENUM ('CLIENTE', 'REPASSE_MOTOBOY');

-- AlterTable
ALTER TABLE "entregas" ADD COLUMN "motoboy_id" TEXT;

-- AlterTable
ALTER TABLE "pendencias" ADD COLUMN "motoboy_id" TEXT,
ADD COLUMN "tipo" "TipoPendencia" NOT NULL DEFAULT 'CLIENTE';

-- CreateIndex
CREATE INDEX "entregas_motoboy_id_idx" ON "entregas"("motoboy_id");

-- CreateIndex
CREATE INDEX "pendencias_motoboy_id_idx" ON "pendencias"("motoboy_id");

-- CreateIndex
CREATE INDEX "pendencias_tipo_idx" ON "pendencias"("tipo");

-- AddForeignKey
ALTER TABLE "entregas" ADD CONSTRAINT "entregas_motoboy_id_fkey" FOREIGN KEY ("motoboy_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pendencias" ADD CONSTRAINT "pendencias_motoboy_id_fkey" FOREIGN KEY ("motoboy_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
