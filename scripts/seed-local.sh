#!/usr/bin/env bash
set -e

echo "🌱 Ejecutando seed de la base de datos..."
docker-compose exec backend npx prisma db seed

echo "✅ Seed completado."
