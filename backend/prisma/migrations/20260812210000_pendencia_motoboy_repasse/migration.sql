-- Pendências cadastradas pelo admin para um motoboy passam a ser
-- REPASSE_MOTOBOY, para entrar na prestação daquele motoboy.
UPDATE "pendencias"
SET "tipo" = 'REPASSE_MOTOBOY'
WHERE "motoboy_id" IS NOT NULL
  AND "tipo" = 'CLIENTE';
