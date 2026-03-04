#!/bin/bash
# Script pour déployer la configuration Nginx (reverse proxy)
# Usage : DEPLOY_APP_SERVER=app.lan DEPLOY_NGINX_SERVER=nginx.lan DEPLOY_SSH_USER=user DEPLOY_DOMAIN=example.fr DEPLOY_EMAIL=admin@example.fr ./scripts/linux/deploy-nginx-config.sh
# Ou : ./scripts/linux/deploy-nginx-config.sh app.lan nginx.lan user example.fr admin@example.fr

set -e

APP_SERVER="${1:-$DEPLOY_APP_SERVER}"
NGINX_SERVER="${2:-$DEPLOY_NGINX_SERVER}"
SSH_USER="${3:-$DEPLOY_SSH_USER}"
DOMAIN="${4:-$DEPLOY_DOMAIN}"
EMAIL="${5:-$DEPLOY_EMAIL}"

if [ -z "$APP_SERVER" ]; then
    echo "ERREUR: Serveur applicatif non configuré."
    echo "  Usage: ./scripts/linux/deploy-nginx-config.sh app.lan nginx.lan votre_user votre-domaine.fr admin@votre-domaine.fr"
    exit 1
fi

if [ -z "$NGINX_SERVER" ]; then
    echo "ERREUR: Serveur Nginx non configuré."
    exit 1
fi

if [ -z "$SSH_USER" ]; then
    echo "ERREUR: Utilisateur SSH non configuré."
    exit 1
fi

DOMAIN="${DOMAIN:-votre-domaine.fr}"
EMAIL="${EMAIL:-admin@$DOMAIN}"

SERVER_NAMES="facturio.${DOMAIN} devis.${DOMAIN} facture.${DOMAIN}"
SITE_CONFIG_NAME="facturio.${DOMAIN}"

echo "=== Déploiement de la configuration Nginx ==="
echo "Serveur applicatif: $APP_SERVER"
echo "Serveur Nginx: $NGINX_SERVER"
echo "Domaines: $SERVER_NAMES"
echo ""

TMP_CONFIG=$(mktemp)
cat > "$TMP_CONFIG" << EOF
# Configuration : $SERVER_NAMES
server {
    listen 80;
    server_name $SERVER_NAMES;

    location / {
        proxy_pass http://${APP_SERVER}:5173;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /api {
        proxy_pass http://${APP_SERVER}:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    access_log /var/log/nginx/facturio_access.log;
    error_log /var/log/nginx/facturio_error.log;
}
EOF

echo "Copie de la configuration vers $NGINX_SERVER..."
scp "$TMP_CONFIG" "${SSH_USER}@${NGINX_SERVER}:/tmp/facturio_nginx_config.conf"

echo "Installation de la configuration..."
ssh "${SSH_USER}@${NGINX_SERVER}" << ENDSSH
    sudo mv /tmp/facturio_nginx_config.conf /etc/nginx/sites-available/${SITE_CONFIG_NAME}
    if ! grep -q "server_names_hash_bucket_size 128" /etc/nginx/nginx.conf; then
        sudo sed -i '/^http {/a\    server_names_hash_bucket_size 128;' /etc/nginx/nginx.conf
    fi
    sudo ln -sf /etc/nginx/sites-available/${SITE_CONFIG_NAME} /etc/nginx/sites-enabled/
    sudo nginx -t
    if [ \$? -eq 0 ]; then
        echo "Configuration Nginx valide. Rechargement..."
        sudo systemctl reload nginx
        echo "Configuration déployée avec succès !"
    else
        echo "ERREUR: Configuration Nginx invalide. Vérifiez les logs."
        exit 1
    fi
ENDSSH

rm "$TMP_CONFIG"

echo ""
echo "=== Configuration Nginx déployée ==="
echo "Prochaine étape : Configurer SSL avec Certbot"
echo "  ssh ${SSH_USER}@${NGINX_SERVER}"
echo "  sudo certbot --nginx -d facturio.${DOMAIN} -d devis.${DOMAIN} -d facture.${DOMAIN} --non-interactive --agree-tos --email ${EMAIL} --redirect"

