-- CreateEnum
CREATE TYPE "OrigemCadastroEntrega" AS ENUM ('MOTOBOY', 'CLIENTE');

-- AlterTable
ALTER TABLE "entregas"
ADD COLUMN "origem_cadastro" "OrigemCadastroEntrega" NOT NULL DEFAULT 'MOTOBOY',
ADD COLUMN "telefone_cliente" TEXT,
ADD COLUMN "entrega_motoboy_id" TEXT;

-- CreateIndex
CREATE INDEX "entregas_origem_cadastro_idx" ON "entregas"("origem_cadastro");

-- AddForeignKey
ALTER TABLE "entregas"
ADD CONSTRAINT "entregas_entrega_motoboy_id_fkey"
FOREIGN KEY ("entrega_motoboy_id") REFERENCES "entregas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
