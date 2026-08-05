-- CreateTable
CREATE TABLE "configuracao_planejador" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "enderecoPartidaPadrao" TEXT NOT NULL,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracao_planejador_pkey" PRIMARY KEY ("id")
);

-- Seed endereço padrão
INSERT INTO "configuracao_planejador" ("id", "enderecoPartidaPadrao", "atualizadoEm")
VALUES (
    'default',
    'Leite Gondim, 895 - Antônio Bezerra - Fortaleza/CE',
    CURRENT_TIMESTAMP
);
