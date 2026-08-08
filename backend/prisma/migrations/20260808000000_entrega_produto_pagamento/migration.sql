-- CreateEnum
CREATE TYPE "FormaPagamentoEntrega" AS ENUM ('DINHEIRO', 'PIX', 'CARTAO');

-- AlterTable
ALTER TABLE "entregas" ADD COLUMN "valor_produto" DECIMAL(10,2),
ADD COLUMN "forma_pagamento" "FormaPagamentoEntrega";
