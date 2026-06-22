#!/bin/bash
# Déploie la config Nginx reverse proxy (node12.lan → node10.lan)
#
# Usage :
#   DEPLOY_APP_SERVER=node10.lan DEPLOY_NGINX_SERVER=node12.lan \
#   DEPLOY_SSH_USER=pi DEPLOY_DOMAIN=danielcraft.fr \
#   ./scripts/linux/deploy-nginx-config.sh
#
# Ou :
#   ./scripts/linux/deploy-nginx-config.sh node10.lan node12.lan pi danielcraft.fr contact@danielcraft.fr

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TEMPLATE="$REPO_ROOT/scripts/deploy/nginx/facturio-reverse-proxy.conf.template"

APP_SERVER="${1:-${DEPLOY_APP_SERVER:-node10.lan}}"
NGINX_SERVER="${2:-${DEPLOY_NGINX_SERVER:-node12.lan}}"
SSH_USER="${3:-${DEPLOY_SSH_USER:-pi}}"
DOMAIN="${4:-${DEPLOY_DOMAIN:-danielcraft.fr}}"
EMAIL="${5:-${DEPLOY_EMAIL:-contact@${DOMAIN}}}"

if [ ! -f "$TEMPLATE" ]; then
	echo "ERREUR: template introuvable: $TEMPLATE" >&2
	exit 1
fi

SERVER_NAMES="facturio.${DOMAIN} devis.${DOMAIN} facture.${DOMAIN}"
SITE_CONFIG_NAME="facturio.${DOMAIN}"

echo "=== Déploiement Nginx PrestaFacture ==="
echo "  App (Pi)    : $APP_SERVER"
echo "  Nginx       : $NGINX_SERVER"
echo "  Domaines    : $SERVER_NAMES"
echo ""

TMP_CONFIG="$(mktemp)"
sed -e "s/__APP_SERVER__/${APP_SERVER}/g" \
	-e "s/__NGINX_SERVER__/${NGINX_SERVER}/g" \
	-e "s/__DOMAIN__/${DOMAIN}/g" \
	-e "s/__SERVER_NAMES__/${SERVER_NAMES}/g" \
	"$TEMPLATE" > "$TMP_CONFIG"

echo "Copie vers ${SSH_USER}@${NGINX_SERVER}..."
scp "$TMP_CONFIG" "${SSH_USER}@${NGINX_SERVER}:/tmp/facturio_nginx_config.conf"

echo "Installation..."
ssh "${SSH_USER}@${NGINX_SERVER}" << ENDSSH
	set -e
	sudo sed -i '1s/^\xEF\xBB\xBF//' /tmp/facturio_nginx_config.conf 2>/dev/null || true
	if [ -f "/etc/nginx/sites-available/${SITE_CONFIG_NAME}" ]; then
		sudo cp "/etc/nginx/sites-available/${SITE_CONFIG_NAME}" \
			"/etc/nginx/sites-available/${SITE_CONFIG_NAME}.bak.\$(date +%Y%m%d%H%M%S)"
	fi
	sudo mv /tmp/facturio_nginx_config.conf "/etc/nginx/sites-available/${SITE_CONFIG_NAME}"
	if ! grep -q 'server_names_hash_bucket_size 128' /etc/nginx/nginx.conf; then
		sudo sed -i '/^http {/a\    server_names_hash_bucket_size 128;' /etc/nginx/nginx.conf
	fi
	sudo ln -sf "/etc/nginx/sites-available/${SITE_CONFIG_NAME}" /etc/nginx/sites-enabled/
	sudo nginx -t
	sudo systemctl reload nginx
	echo "OK — Nginx rechargé"
ENDSSH

rm -f "$TMP_CONFIG"

echo ""
echo "=== Terminé ==="
echo "Tests depuis node12 :"
echo "  curl -sS -o /dev/null -w '%{http_code}\n' http://${APP_SERVER}:3000/api/auth/login -X POST -H 'Content-Type: application/json' -d '{\"email\":\"a@b.c\",\"password\":\"x\"}'"
echo ""
echo "Si HTTPS manquant ou cassé après remplacement du fichier :"
echo "  ssh ${SSH_USER}@${NGINX_SERVER}"
echo "  sudo certbot --nginx -d facturio.${DOMAIN} -d devis.${DOMAIN} -d facture.${DOMAIN} --non-interactive --agree-tos --email ${EMAIL} --redirect"
