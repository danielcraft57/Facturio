#!/usr/bin/env bash
set -euo pipefail

SEED="0"
for arg in "$@"; do
  if [ "$arg" = "--seed" ]; then
    SEED="1"
  fi
done

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SERVER_DIR="$REPO_ROOT/server"
SQL_FILE="$REPO_ROOT/scripts/clear-db/sql/postgres-truncate-all.sql"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL manquant. Configure-le avant de lancer ce script."
  exit 1
fi

case "$DATABASE_URL" in
  file:*)
    echo "DATABASE_URL ressemble a du SQLite (file:...). Ce script est pour Postgres prod."
    exit 1
  ;;
esac

if [ ! -f "$SQL_FILE" ]; then
  echo "Fichier SQL introuvable: $SQL_FILE"
  exit 1
fi

DB_HOST="inconnu"
DB_NAME="inconnue"
if command -v node >/dev/null 2>&1; then
  DB_HOST="$(node -e "const u=new URL(process.env.DATABASE_URL); console.log(u.hostname)")"
  DB_NAME="$(node -e "const u=new URL(process.env.DATABASE_URL); console.log(u.pathname.replace(/^\\//,''))")"
fi

echo ""
echo "Clear DB (PROD - PostgreSQL)"
echo "ATTENTION: ca purge toutes les tables du schema public (sauf _prisma_migrations)."
echo "Cible: $DB_NAME sur $DB_HOST"
echo ""

PHRASE="OUI EFFACER $DB_NAME SUR $DB_HOST"
read -r -p "Tape exactement: $PHRASE: " CONFIRM
if [ "${CONFIRM:-}" != "$PHRASE" ]; then
  echo "Annule."
  exit 1
fi

cd "$SERVER_DIR"

export NODE_ENV="prod"

echo ""
echo "Purge Postgres (TRUNCATE)..."
npx prisma db execute --schema="prisma/schema.postgresql.prisma" --file="$SQL_FILE"

if [ "$SEED" = "1" ]; then
  echo ""
  echo "Seed prod..."
  npm run seed:prod
fi

echo ""
echo "OK."

