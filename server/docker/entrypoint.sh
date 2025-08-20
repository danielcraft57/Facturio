#!/bin/sh
set -e

# Si une URL de base est fournie, pousse le schéma pour s'assurer que la base existe
if [ -n "$DATABASE_URL" ]; then
  echo "[entrypoint] Synchronisation du schéma Prisma vers la base..."
  npx prisma db push
fi

exec "$@"


