#!/bin/sh
set -e

echo "Aplicando migrations..."
npx prisma migrate deploy

echo "Garantindo usuário admin..."
node dist/src/bootstrap/ensure-admin.js

echo "Iniciando API..."
exec node dist/src/index.js
