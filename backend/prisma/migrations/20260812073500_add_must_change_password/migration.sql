-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN "must_change_password" BOOLEAN NOT NULL DEFAULT true;

-- Usuários já existentes não precisam redefinir senha
UPDATE "usuarios" SET "must_change_password" = false;
