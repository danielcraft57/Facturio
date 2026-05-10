#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/facturio"
STATE_DIR="/var/lib/facturio"
LAST_OK_FILE="$STATE_DIR/last_success_sha"
SERVICE="facturio"

cd "$APP_DIR"

echo "[facturio-update] $(date -Is) start"

git fetch --all --prune
DESIRED_SHA="$(git rev-parse origin/main)"
CURRENT_SHA="$(git rev-parse HEAD)"
LAST_OK_SHA=""

if [ -f "$LAST_OK_FILE" ]; then
  LAST_OK_SHA="$(cat "$LAST_OK_FILE" 2>/dev/null || true)"
fi

if [ "$CURRENT_SHA" != "$DESIRED_SHA" ]; then
  echo "[facturio-update] updating $CURRENT_SHA -> $DESIRED_SHA"
  git reset --hard origin/main
else
  echo "[facturio-update] repo at $CURRENT_SHA"
fi

if [ "$LAST_OK_SHA" = "$DESIRED_SHA" ]; then
  echo "[facturio-update] already deployed ($DESIRED_SHA)"
  exit 0
fi

echo "[facturio-update] deploying $DESIRED_SHA"

cd "$APP_DIR/server"

npm install --omit=dev
npm run prisma:prod

# The migration history in this repo is for SQLite, and `prisma migrate deploy`
# will fail on Postgres with P3019 (provider mismatch). For prod, sync schema.
npx prisma db push --accept-data-loss --schema=prisma/schema.postgresql.prisma


npm run build:prod

sudo systemctl restart "$SERVICE"

echo "$DESIRED_SHA" > "$LAST_OK_FILE"

echo "[facturio-update] done"

