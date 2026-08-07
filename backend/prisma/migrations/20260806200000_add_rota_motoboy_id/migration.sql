-- AlterTable
ALTER TABLE "rotas_planejadas" ADD COLUMN "motoboy_id" TEXT;

-- CreateIndex
CREATE INDEX "rotas_planejadas_motoboy_id_idx" ON "rotas_planejadas"("motoboy_id");

-- AddForeignKey
ALTER TABLE "rotas_planejadas" ADD CONSTRAINT "rotas_planejadas_motoboy_id_fkey" FOREIGN KEY ("motoboy_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill motoboy from linked entregas (single motoboy per route)
UPDATE "rotas_planejadas" r
SET "motoboy_id" = sub.motoboy_id
FROM (
  SELECT rp."rotaId", MIN(e.motoboy_id) AS motoboy_id
  FROM "rota_paradas" rp
  INNER JOIN "entregas" e ON e.id = rp."entregaId"
  WHERE e.motoboy_id IS NOT NULL
  GROUP BY rp."rotaId"
  HAVING COUNT(DISTINCT e.motoboy_id) = 1
) sub
WHERE r.id = sub."rotaId" AND r.motoboy_id IS NULL;
