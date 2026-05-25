#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/facturio"
STATE_DIR="/var/lib/facturio"
LAST_OK_FILE="$STATE_DIR/last_success_sha"
LOCK_HASH_FILE="$STATE_DIR/server-package-lock.sha256"
FRONT_LOCK_HASH_FILE="$STATE_DIR/frontend-package-lock.sha256"
PG_MAINTENANCE_FILE="$STATE_DIR/last-pg-maintenance.date"
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

sha256_file() {
	sha256sum "$1" | awk '{print $1}'
}

needs_npm_install() {
	local lock="${1:?package-lock path}"
	local hash_file="${2:?hash state file}"
	local modules_dir="${3:?node_modules dir}"
	[ -d "$modules_dir" ] || return 0
	[ -f "$lock" ] || return 0
	local current prev
	current="$(sha256_file "$lock")"
	prev=""
	[ -f "$hash_file" ] && prev="$(cat "$hash_file")"
	[ "$current" != "$prev" ]
}

uses_postgres_db() {
	[ -f "$APP_DIR/server/.env" ] && grep -qE '^DATABASE_URL=.*postgresql' "$APP_DIR/server/.env"
}

# P3009 : migration marquée failed dans _prisma_migrations (ex. entity_cuid_ids corrigée dans le dépôt).
recover_failed_prisma_migrations() {
	local name finished rolled_back
	while IFS='|' read -r name finished rolled_back; do
		[ -z "$name" ] && continue
		[ -n "$finished" ] && continue
		[ -n "$rolled_back" ] && continue
		echo "[facturio-update] migration en échec détectée: $name → resolve --rolled-back"
		npx prisma migrate resolve --rolled-back "$name" --schema=prisma/postgresql/schema.prisma
	done < <(
		sudo -u postgres psql -d facturio -tA -F'|' -c \
			"SELECT migration_name, COALESCE(finished_at::text,''), COALESCE(rolled_back_at::text,'')
			 FROM \"_prisma_migrations\"
			 WHERE finished_at IS NULL AND rolled_back_at IS NULL AND logs IS NOT NULL;"
	)
}

run_prisma_migrate_prod() {
	if ! uses_postgres_db; then
		echo "[facturio-update] prisma migrate ignoré (DATABASE_URL non Postgres)"
		return 0
	fi
	cd "$APP_DIR/server"
	if [ ! -d node_modules/@prisma/client ]; then
		echo "[facturio-update] npm ci (requis pour prisma migrate)..."
		npm ci --omit=dev --no-audit --prefer-offline
		sha256_file package-lock.json > "$LOCK_HASH_FILE" 2>/dev/null || true
	fi
	recover_failed_prisma_migrations
	echo "[facturio-update] prisma migrate deploy (prisma/postgresql/migrations)..."
	npm run migrate:prod
	run_pg_grant_facturio_role
}

run_pg_grant_facturio_role() {
	local grants="$APP_DIR/scripts/deploy/postgresql/grant-facturio-role.sql"
	[ -f "$grants" ] || return 0
	echo "[facturio-update] droits PostgreSQL (role facturio)..."
	sudo -u postgres psql -d facturio -v ON_ERROR_STOP=1 -q -f "$grants"
}

run_pg_maintenance() {
	local today
	today="$(date +%Y-%m-%d)"
	if [ -f "$PG_MAINTENANCE_FILE" ] && [ "$(cat "$PG_MAINTENANCE_FILE")" = "$today" ]; then
		echo "[facturio-update] maintenance Postgres déjà faite aujourd'hui (skip)"
		return 0
	fi
	echo "[facturio-update] maintenance Postgres (ANALYZE/VACUUM)..."
	if [ -f "$APP_DIR/scripts/deploy/postgresql/maintenance.sql" ]; then
		sudo -u postgres psql -d facturio -v ON_ERROR_STOP=1 -q -f "$APP_DIR/scripts/deploy/postgresql/maintenance.sql" \
			2>/dev/null || sudo -u postgres psql -d facturio -q -c 'ANALYZE;'
	else
		sudo -u postgres psql -d facturio -q -c 'ANALYZE;'
	fi
	echo "$today" > "$PG_MAINTENANCE_FILE"
}

cd "$APP_DIR"

echo "[facturio-update] $(date -Is) start"

git fetch origin main --prune
DESIRED_SHA="$(git rev-parse origin/main)"
CURRENT_SHA="$(git rev-parse HEAD)"
LAST_OK_SHA=""

if [ -f "$LAST_OK_FILE" ]; then
	LAST_OK_SHA="$(tr -d '\r\n' < "$LAST_OK_FILE")"
fi

if [ "$CURRENT_SHA" != "$DESIRED_SHA" ]; then
	echo "[facturio-update] updating $CURRENT_SHA -> $DESIRED_SHA"
	git reset --hard origin/main
else
	echo "[facturio-update] repo at $CURRENT_SHA"
fi

if [ "$LAST_OK_SHA" = "$DESIRED_SHA" ]; then
	echo "[facturio-update] already deployed ($DESIRED_SHA)"
	if uses_postgres_db; then
		run_prisma_migrate_prod
		sudo systemctl restart "$SERVICE"
	fi
	exit 0
fi

echo "[facturio-update] deploying $DESIRED_SHA"

ensure_deploy_permissions

RUN_BACKEND=true
RUN_FRONTEND=true
if [ -n "$LAST_OK_SHA" ] && git cat-file -e "${LAST_OK_SHA}^{commit}" 2>/dev/null; then
	if git diff --quiet "$LAST_OK_SHA" "$DESIRED_SHA" -- server/ package.json; then
		RUN_BACKEND=false
		echo "[facturio-update] pas de changement server/ depuis $LAST_OK_SHA"
	fi
	if git diff --quiet "$LAST_OK_SHA" "$DESIRED_SHA" -- frontend/; then
		RUN_FRONTEND=false
		echo "[facturio-update] pas de changement frontend/ depuis $LAST_OK_SHA"
	fi
fi

NEED_RESTART=false

RUN_MIGRATE=true
if [ -n "$LAST_OK_SHA" ] && git cat-file -e "${LAST_OK_SHA}^{commit}" 2>/dev/null; then
	if git diff --quiet "$LAST_OK_SHA" "$DESIRED_SHA" -- server/prisma/postgresql server/package.json; then
		RUN_MIGRATE=false
		echo "[facturio-update] pas de changement migrations Postgres depuis $LAST_OK_SHA"
	fi
fi

if [ "$RUN_MIGRATE" = true ] && uses_postgres_db; then
	run_prisma_migrate_prod
	run_pg_maintenance
	NEED_RESTART=true
fi

if [ "$RUN_BACKEND" = true ]; then
	cd "$APP_DIR/server"

	if needs_npm_install "$APP_DIR/server/package-lock.json" "$LOCK_HASH_FILE" "$APP_DIR/server/node_modules"; then
		echo "[facturio-update] npm ci (package-lock modifié)..."
		npm ci --omit=dev --no-audit --prefer-offline
		sha256_file package-lock.json > "$LOCK_HASH_FILE"
	else
		echo "[facturio-update] npm install ignoré (lock inchangé)"
	fi

	if [ "$RUN_MIGRATE" != true ] && uses_postgres_db; then
		run_pg_maintenance
	fi

	echo "[facturio-update] build backend..."
	npm run build:prod
	NEED_RESTART=true
else
	echo "[facturio-update] build backend ignoré"
fi

FRONTEND_MODE="${FRONTEND_MODE:-github}"
if [ "${SKIP_FRONTEND_BUILD:-0}" = "1" ]; then
	FRONTEND_MODE="skip"
fi

if [ "$RUN_FRONTEND" = true ]; then
	case "$FRONTEND_MODE" in
	github)
		echo "[facturio-update] frontend depuis GitHub Actions (artefact $DESIRED_SHA)..."
		bash "$APP_DIR/scripts/deploy/fetch-frontend-dist.sh" "$DESIRED_SHA"
		NEED_RESTART=true
		;;
	local)
		echo "[facturio-update] build frontend local..."
		cd "$APP_DIR/frontend"
		if [ ! -f .env.production ] && [ -f env.prod.example ]; then
			cp env.prod.example .env.production
		fi
		if needs_npm_install "$APP_DIR/frontend/package-lock.json" "$FRONT_LOCK_HASH_FILE" "$APP_DIR/frontend/node_modules"; then
			npm ci --no-audit --prefer-offline
			sha256_file package-lock.json > "$FRONT_LOCK_HASH_FILE"
		fi
		export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=768}"
		npm run build
		test -f dist/index.html
		sudo chown -R "${DEPLOY_USER}:${DEPLOY_USER}" dist 2>/dev/null || chown -R "${DEPLOY_USER}:${DEPLOY_USER}" dist
		chmod -R a+rX dist 2>/dev/null || sudo chmod -R a+rX dist
		NEED_RESTART=true
		;;
	skip)
		echo "[facturio-update] frontend ignoré (SKIP_FRONTEND_BUILD=1)"
		;;
	*)
		echo "[facturio-update] FRONTEND_MODE invalide: $FRONTEND_MODE" >&2
		exit 1
		;;
	esac
else
	echo "[facturio-update] fetch/build frontend ignoré"
fi

if [ "$FRONTEND_MODE" != "skip" ] && [ "$RUN_FRONTEND" = true ] && systemctl is-active nginx >/dev/null 2>&1; then
	sudo systemctl reload nginx
fi

if [ "$NEED_RESTART" = true ]; then
	sudo systemctl restart "$SERVICE"
else
	echo "[facturio-update] restart $SERVICE ignoré (rien à redémarrer)"
fi

echo "$DESIRED_SHA" > "$LAST_OK_FILE"

echo "[facturio-update] done"
