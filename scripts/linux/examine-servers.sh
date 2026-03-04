#!/bin/bash
# Script pour examiner les serveurs disponibles et choisir le meilleur candidat
# Configurer : export DEPLOY_SERVERS="server1.lan,server2.lan" et export DEPLOY_SSH_USER="votre_user"

SERVERS_STR="${DEPLOY_SERVERS:-}"
SSH_USER="${DEPLOY_SSH_USER:-}"

if [ -z "$SERVERS_STR" ]; then
    echo "ERREUR: Liste de serveurs non configurée."
    echo "  Exemple: export DEPLOY_SERVERS='server1.lan,server2.lan'; ./scripts/linux/examine-servers.sh"
    echo "  Ou: DEPLOY_SERVERS='server1.lan' DEPLOY_SSH_USER=votre_user ./scripts/linux/examine-servers.sh"
    exit 1
fi

if [ -z "$SSH_USER" ]; then
    echo "ERREUR: Utilisateur SSH non configuré."
    echo "  Exemple: export DEPLOY_SSH_USER='votre_user'"
    exit 1
fi

IFS=',' read -ra SERVERS <<< "$SERVERS_STR"

echo "=== Examen des serveurs applicatifs ==="
echo "Utilisateur SSH: $SSH_USER"
echo ""

for server in "${SERVERS[@]}"; do
    server=$(echo "$server" | xargs)
    [ -z "$server" ] && continue
    echo "--- $server ---"
    ssh "$SSH_USER@$server" "echo 'Disque:' && df -h / | tail -1 && echo 'RAM:' && free -h | grep Mem && echo 'Ports utilisés:' && sudo lsof -i :3000 -i :5173 2>/dev/null | head -5 || echo 'Ports 3000 et 5173 libres' && echo 'Node.js:' && node --version 2>/dev/null || echo 'Node.js non installé' && echo 'PostgreSQL:' && sudo systemctl is-active postgresql 2>/dev/null || echo 'PostgreSQL non actif'"
    echo ""
done

echo "=== Recommandation ==="
echo "Choisir le serveur avec :"
echo "- Espace disque suffisant (minimum 5GB)"
echo "- RAM disponible (minimum 2GB)"
echo "- Ports 3000 et 5173 libres"
echo "- Node.js 20+ installé"
echo "- PostgreSQL installé (optionnel mais recommandé)"

