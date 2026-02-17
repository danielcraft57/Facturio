#!/bin/bash
# Synchronise uniquement les fichiers vers la prod (pas d'installation npm ni de build)
# Utilise quand tu as modifie du code en local et veux juste pousser les changements.
# Usage : DEPLOY_APP_SERVER=serveur.lan DEPLOY_SSH_USER=votre_user ./deploy-sync.sh
# Ou : ./deploy-sync.sh serveur.lan votre_user

set -e

APP_SERVER="${1:-$DEPLOY_APP_SERVER}"
APP_USER="${2:-$DEPLOY_SSH_USER}"
APP_DIR="${DEPLOY_APP_DIR:-/opt/facturio}"
LOCAL_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

if [ -z "$APP_SERVER" ]; then
    echo "ERREUR: Serveur applicatif non configuré."
    echo "  Usage: ./deploy-sync.sh votre-server.lan votre_user"
    exit 1
fi

if [ -z "$APP_USER" ]; then
    echo "ERREUR: Utilisateur SSH non configuré."
    exit 1
fi

if [ ! -d "$LOCAL_DIR/server" ] || [ ! -d "$LOCAL_DIR/frontend" ]; then
    echo "ERREUR: Ce script doit être exécuté depuis le répertoire Facturio"
    exit 1
fi

echo "=== Synchronisation des fichiers (sans npm/build) ==="
echo "Serveur: $APP_SERVER"
echo "Répertoire distant: $APP_DIR"
echo ""

echo "Vérification de la connexion SSH..."
ssh "${APP_USER}@${APP_SERVER}" "echo 'Connexion OK'"

echo "Copie des fichiers..."
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' --exclude 'build' \
    --exclude '*.db' --exclude '*.log' --exclude '.env' \
    "$LOCAL_DIR/" "${APP_USER}@${APP_SERVER}:${APP_DIR}/"

echo "Ajustement des droits sur le serveur..."
ssh "${APP_USER}@${APP_SERVER}" "sudo chown -R ${APP_USER}:${APP_USER} $APP_DIR"

echo ""
echo "=== Synchronisation terminée ==="
echo "Fichiers à jour. Redémarrer les services si besoin :"
echo "  ssh ${APP_USER}@${APP_SERVER} 'sudo systemctl restart facturio'"
echo "  (et Nginx frontend si tu sers le build depuis le serveur applicatif)"
