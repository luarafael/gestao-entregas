#!/bin/sh
set -e

echo "Aplicando migrations..."
npx prisma migrate deploy

echo "Garantindo usuário admin..."
node dist/src/bootstrap/ensure-admin.js

echo "Garantindo usuário motoboy..."
node dist/src/bootstrap/ensure-motoboy.js

echo "Iniciando API..."
exec node dist/src/index.js
