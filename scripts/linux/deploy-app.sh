#!/bin/bash
# Script pour déployer PrestaFacture sur un serveur applicatif
# Usage : DEPLOY_APP_SERVER=votre-server.lan DEPLOY_SSH_USER=votre_user ./scripts/linux/deploy-app.sh
# Ou : ./scripts/linux/deploy-app.sh votre-server.lan votre_user

set -e

APP_SERVER="${1:-$DEPLOY_APP_SERVER}"
APP_USER="${2:-$DEPLOY_SSH_USER}"
APP_DIR="${DEPLOY_APP_DIR:-/opt/facturio}"
LOCAL_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

if [ -z "$APP_SERVER" ]; then
    echo "ERREUR: Serveur applicatif non configuré."
    echo "  Usage: ./scripts/linux/deploy-app.sh votre-server.lan votre_user"
    echo "  Ou: export DEPLOY_APP_SERVER=votre-server.lan DEPLOY_SSH_USER=votre_user; ./scripts/linux/deploy-app.sh"
    exit 1
fi

if [ -z "$APP_USER" ]; then
    echo "ERREUR: Utilisateur SSH non configuré."
    echo "  Usage: ./scripts/linux/deploy-app.sh $APP_SERVER votre_user"
    exit 1
fi

if [ ! -d "$LOCAL_DIR/server" ] || [ ! -d "$LOCAL_DIR/frontend" ]; then
    echo "ERREUR: Ce script doit être exécuté depuis le répertoire PrestaFacture"
    exit 1
fi

echo "=== Déploiement de PrestaFacture ==="
echo "Serveur: $APP_SERVER"
echo "Utilisateur: $APP_USER"
echo "Répertoire distant: $APP_DIR"
echo ""

echo "Vérification de la connexion SSH..."
ssh "${APP_USER}@${APP_SERVER}" "echo 'Connexion OK'"

echo "Création du répertoire sur le serveur..."
ssh "${APP_USER}@${APP_SERVER}" "sudo mkdir -p $APP_DIR && sudo chown ${APP_USER}:${APP_USER} $APP_DIR"

echo "Copie des fichiers..."
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' --exclude 'build' \
    --exclude '*.db' --exclude '*.log' --exclude '.env' \
    "$LOCAL_DIR/" "${APP_USER}@${APP_SERVER}:${APP_DIR}/"

echo "Installation des dépendances et build sur le serveur (sudo)..."
ssh "${APP_USER}@${APP_SERVER}" << ENDSSH
    set -e
    cd $APP_DIR
    echo "Installation backend..."
    cd server && sudo npm install --omit=dev && sudo env PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npm run prisma:prod && sudo env PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npm run build:prod
    cd $APP_DIR
    echo "Installation frontend..."
    cd frontend && sudo npm install && sudo npm run build
    cd $APP_DIR
    sudo mkdir -p logs
    sudo chown -R ${APP_USER}:${APP_USER} $APP_DIR
    echo "Build terminé !"
ENDSSH

echo ""
echo "=== Déploiement terminé ==="
echo "Prochaines étapes :"
echo "1. Installer PostgreSQL sur le serveur (si pas déjà fait) et créer user/base (voir doc)."
echo "2. Configurer .env : ssh ${APP_USER}@${APP_SERVER} 'cd $APP_DIR/server && cp env.prod.example .env && nano .env'"
echo "3. Créer les tables et seed : ssh ${APP_USER}@${APP_SERVER} 'cd $APP_DIR/server && npm run db:push:prod && npm run seed:prod'"
echo "4. Configurer le service systemd : voir docs/deployment/DEPLOIEMENT_PRODUCTION.md"
echo "5. Configurer Nginx local pour le frontend : voir docs/deployment/DEPLOIEMENT_PRODUCTION.md"

