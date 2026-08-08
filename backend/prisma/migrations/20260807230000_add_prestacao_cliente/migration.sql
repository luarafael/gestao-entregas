-- CreateTable
CREATE TABLE "prestacoes_cliente" (
    "id" TEXT NOT NULL,
    "nome_cliente" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "total_entregas" INTEGER NOT NULL,
    "valor_total" DECIMAL(10,2) NOT NULL,
    "valor_final" DECIMAL(10,2) NOT NULL,
    "observacoes" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prestacoes_cliente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "prestacoes_cliente_data_idx" ON "prestacoes_cliente"("data");

-- CreateIndex
CREATE UNIQUE INDEX "prestacoes_cliente_nome_cliente_data_key" ON "prestacoes_cliente"("nome_cliente", "data");
