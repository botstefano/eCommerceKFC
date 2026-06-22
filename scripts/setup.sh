#!/usr/bin/env bash
set -e

echo "🍗 Configurando KFC E-commerce..."

if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ Archivo .env creado a partir de .env.example"
else
  echo "ℹ️  Ya existe un archivo .env, no se sobrescribe"
fi

if ! command -v docker &> /dev/null; then
  echo "❌ Docker no está instalado. Instálalo desde https://docs.docker.com/get-docker/"
  exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
  echo "❌ docker-compose no está disponible."
  exit 1
fi

echo "🚀 Construyendo e iniciando los contenedores (esto puede tardar unos minutos la primera vez)..."
docker-compose up --build -d

echo ""
echo "✅ ¡Listo! La aplicación está iniciando."
echo "   Frontend:  http://localhost:5173"
echo "   Backend:   http://localhost:5000/api"
echo ""
echo "   Accesos demo:"
echo "   Admin:    admin@kfc.com / admin123"
echo "   Cliente:  cliente@kfc.com / cliente123"
echo ""
echo "Usa 'make logs' para ver los logs o 'make down' para detener los contenedores."
