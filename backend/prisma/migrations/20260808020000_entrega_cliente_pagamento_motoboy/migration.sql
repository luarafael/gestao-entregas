-- CreateEnum
CREATE TYPE "StatusPagamentoCliente" AS ENUM ('PAGO', 'NAO_PAGO');

-- AlterTable
ALTER TABLE "entregas"
ADD COLUMN "status_pagamento_cliente" "StatusPagamentoCliente",
ADD COLUMN "valor_entrega_motoboy" DECIMAL(10, 2);

-- Backfill existing cliente rows
UPDATE "entregas"
SET
  "status_pagamento_cliente" = 'NAO_PAGO',
  "valor_entrega_motoboy" = COALESCE("valor_entrega", 0)
WHERE "origem_cadastro" = 'CLIENTE';
