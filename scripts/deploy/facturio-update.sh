#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/facturio"
STATE_DIR="/var/lib/facturio"
LAST_OK_FILE="$STATE_DIR/last_success_sha"
SERVICE="facturio"
DEPLOY_USER="${DEPLOY_USER:-pi}"

ensure_deploy_permissions() {
	if touch "$APP_DIR/server/package-lock.json" 2>/dev/null; then
		return 0
	fi
	echo "[facturio-update] correction des droits sur $APP_DIR (propriétaire $DEPLOY_USER)..."
	sudo chown -R "$DEPLOY_USER:$DEPLOY_USER" "$APP_DIR"
	sudo mkdir -p "$STATE_DIR"
	sudo chown -R "$DEPLOY_USER:$DEPLOY_USER" "$STATE_DIR"
}

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

ensure_deploy_permissions

cd "$APP_DIR/server"

npm install --omit=dev
npm run prisma:prod

# The migration history in this repo is for SQLite (P3019 with migrate deploy).
# Prisma `db push` can also be non-idempotent in some drift scenarios, so we apply
# the minimal Postgres DDL required by the current code in an idempotent way.
sudo -u postgres psql -d facturio -v ON_ERROR_STOP=1 <<'SQL'
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "passwordResetToken" TEXT,
  ADD COLUMN IF NOT EXISTS "passwordResetExpires" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "emailVerificationToken" TEXT,
  ADD COLUMN IF NOT EXISTS "emailVerificationExpires" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "User_passwordResetToken_key" ON "User"("passwordResetToken");
CREATE UNIQUE INDEX IF NOT EXISTS "User_emailVerificationToken_key" ON "User"("emailVerificationToken");
CREATE INDEX IF NOT EXISTS "User_passwordResetToken_idx" ON "User"("passwordResetToken");
CREATE INDEX IF NOT EXISTS "User_emailVerificationToken_idx" ON "User"("emailVerificationToken");
SQL

sudo -u postgres psql -d facturio -v ON_ERROR_STOP=1 -f "$APP_DIR/scripts/deploy/postgresql/maintenance.sql" 2>/dev/null || \
sudo -u postgres psql -d facturio -v ON_ERROR_STOP=1 -c 'ANALYZE;'

npm run build:prod

# Frontend : Nginx sert /opt/facturio/frontend/dist
# Par défaut : artefact GitHub Actions (CI sur main) — évite OOM sur Raspberry.
FRONTEND_MODE="${FRONTEND_MODE:-github}"
if [ "${SKIP_FRONTEND_BUILD:-0}" = "1" ]; then
  FRONTEND_MODE="skip"
fi

case "$FRONTEND_MODE" in
  github)
    echo "[facturio-update] frontend depuis GitHub Actions (artefact $DESIRED_SHA)..."
    bash "$APP_DIR/scripts/deploy/fetch-frontend-dist.sh" "$DESIRED_SHA"
    ;;
  local)
    echo "[facturio-update] build frontend local..."
    cd "$APP_DIR/frontend"
    if [ ! -f .env.production ] && [ -f env.prod.example ]; then
      cp env.prod.example .env.production
    fi
    npm install
    export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=768}"
    npm run build
    test -f dist/index.html
    sudo chown -R www-data:www-data dist 2>/dev/null || true
    sudo chmod -R 755 dist
    ;;
  skip)
    echo "[facturio-update] frontend ignoré (SKIP_FRONTEND_BUILD=1)"
    ;;
  *)
    echo "[facturio-update] FRONTEND_MODE invalide: $FRONTEND_MODE" >&2
    exit 1
    ;;
esac

if [ "$FRONTEND_MODE" != "skip" ] && systemctl is-active nginx >/dev/null 2>&1; then
  sudo systemctl reload nginx
fi

sudo systemctl restart "$SERVICE"

echo "$DESIRED_SHA" > "$LAST_OK_FILE"

echo "[facturio-update] done"

