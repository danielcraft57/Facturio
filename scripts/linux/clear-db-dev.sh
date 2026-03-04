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

echo ""
echo "Clear DB (DEV - SQLite)"
echo "Repo: $REPO_ROOT"
echo "Server: $SERVER_DIR"
echo ""
echo "Ce script va supprimer:"
echo "- server/prisma/prisma/dev.db (+ journal)"
echo "- server/prisma/prisma/test.db (+ journal)"
echo ""

cd "$SERVER_DIR"

rm -f "prisma/dev.db"
rm -f "prisma/dev.db-journal"
rm -f "prisma/test.db"
rm -f "prisma/test.db-journal"
rm -f "prisma/prisma/dev.db"
rm -f "prisma/prisma/dev.db-journal"
rm -f "prisma/prisma/test.db"
rm -f "prisma/prisma/test.db-journal"

export NODE_ENV="dev"
export DATABASE_URL="file:./prisma/prisma/dev.db"

echo ""
echo "Recreation du schema Prisma (db push)..."
npx prisma db push --schema=prisma/schema.prisma

if [ "$SEED" = "1" ]; then
  echo ""
  echo "Seed..."
  export SEED_PURGE="true"
  npm run seed
fi

echo ""
echo "OK."

