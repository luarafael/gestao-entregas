-- CreateEnum
CREATE TYPE "PrioridadeParada" AS ENUM ('NORMAL', 'URGENTE');

-- CreateTable
CREATE TABLE "rotas_planejadas" (
    "id" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "enderecoInicial" TEXT NOT NULL,
    "distanciaTotal" DECIMAL(12,2) NOT NULL,
    "tempoTotal" INTEGER NOT NULL,
    "aproximada" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rotas_planejadas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rota_paradas" (
    "id" TEXT NOT NULL,
    "rotaId" TEXT NOT NULL,
    "entregaId" TEXT,
    "cliente" TEXT,
    "endereco" TEXT NOT NULL,
    "bairro" TEXT,
    "observacao" TEXT,
    "ordem" INTEGER NOT NULL,
    "distancia" DECIMAL(12,2),
    "tempo" INTEGER,
    "prioridade" "PrioridadeParada" NOT NULL DEFAULT 'NORMAL',
    "valorEntrega" DECIMAL(10,2),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,

    CONSTRAINT "rota_paradas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rotas_planejadas_data_idx" ON "rotas_planejadas"("data");

-- CreateIndex
CREATE INDEX "rota_paradas_rotaId_idx" ON "rota_paradas"("rotaId");

-- CreateIndex
CREATE INDEX "rota_paradas_entregaId_idx" ON "rota_paradas"("entregaId");

-- AddForeignKey
ALTER TABLE "rota_paradas" ADD CONSTRAINT "rota_paradas_rotaId_fkey" FOREIGN KEY ("rotaId") REFERENCES "rotas_planejadas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
