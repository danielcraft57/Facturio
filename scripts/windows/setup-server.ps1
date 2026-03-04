# Script pour installer et configurer automatiquement les dépendances sur le serveur
# Usage: .\scripts\windows\setup-server.ps1 -Server votre_user@votre-app.lan

param(
    [Parameter(Mandatory=$true)]
    [string]$Server,
    
    [string]$PostgresPassword = $null
)

$ErrorActionPreference = "Stop"

Write-Host "=== Installation et configuration du serveur Facturio ===" -ForegroundColor Cyan
Write-Host "Serveur: $Server"
Write-Host ""

# Extraire l'utilisateur et l'hôte
if ($Server -match "^(.+)@(.+)$") {
    $SshUser = $matches[1]
    $SshHost = $matches[2]
} else {
    Write-Host "ERREUR: Format du serveur invalide. Utiliser: utilisateur@hote" -ForegroundColor Red
    exit 1
}

# Vérifier la connexion SSH
Write-Host "Vérification de la connexion SSH..." -ForegroundColor Yellow
ssh ${Server} "echo 'Connexion OK'" 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR: Impossible de se connecter à $Server" -ForegroundColor Red
    exit 1
}

# Script d'installation à exécuter sur le serveur
$installScript = @"
set -e

echo "=== Vérification de l'architecture ==="
ARCH=`$(uname -m)
echo "Architecture: `$ARCH"
if [ "`$ARCH" != "aarch64" ] && [ "`$ARCH" != "x86_64" ]; then
    echo "ATTENTION: Architecture `$ARCH détectée. Pour Raspberry Pi, utiliser obligatoirement OS 64-bit (arm64/aarch64) pour Prisma."
    echo "Vérifier avec: uname -m (doit afficher aarch64)"
fi

echo ""
echo "=== Mise à jour des paquets ==="
sudo apt update

echo ""
echo "=== Installation des dépendances système ==="
sudo apt install -y build-essential git curl

echo ""
echo "=== Vérification/Installation Node.js ==="
NODE_VERSION=`$(node --version 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1 || echo "0")
if [ "`$NODE_VERSION" -lt 20 ]; then
    echo "Node.js version insuffisante (`$NODE_VERSION) ou non installé. Installation de Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo "Node.js `$(node --version) déjà installé"
fi

NPM_VERSION=`$(npm --version 2>/dev/null || echo "0")
echo "npm version: `$NPM_VERSION"

echo ""
echo "=== Vérification/Installation PostgreSQL ==="
if ! command -v psql &> /dev/null; then
    echo "Installation de PostgreSQL..."
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl enable postgresql
    sudo systemctl start postgresql
else
    echo "PostgreSQL déjà installé"
fi

# Vérifier si la base de données et l'utilisateur existent déjà
DB_EXISTS=`$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='facturio'" 2>/dev/null || echo "0")
USER_EXISTS=`$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='facturio'" 2>/dev/null || echo "0")

if [ "`$DB_EXISTS" != "1" ] || [ "`$USER_EXISTS" != "1" ]; then
    echo "Création de l'utilisateur et de la base de données PostgreSQL..."
    if [ -z "${POSTGRES_PASSWORD:-}" ]; then
        echo "ATTENTION: Mot de passe PostgreSQL non fourni. Utilisation d'un mot de passe par défaut."
        echo "Pense à le changer dans le fichier .env après le déploiement !"
        PG_PASSWORD="facturio_prod_`$(openssl rand -hex 8)"
    else
        PG_PASSWORD="${POSTGRES_PASSWORD}"
    fi
    
    sudo -u postgres psql << EOF
CREATE USER facturio WITH PASSWORD '`$PG_PASSWORD';
CREATE DATABASE facturio OWNER facturio;
EOF
    
    # Configurer l'authentification PostgreSQL
    PG_VERSION=`$(sudo -u postgres psql -tAc "SHOW server_version_num;" 2>/dev/null | head -1 | sed 's/^\([0-9]\{1,\}\).*/\1/' || echo "")
    if [ -z "`$PG_VERSION" ]; then
        # Fallback: chercher dans le répertoire
        PG_VERSION=`$(ls /etc/postgresql/ 2>/dev/null | head -1 || echo "")
    fi
    if [ -n "`$PG_VERSION" ]; then
        PG_HBA="/etc/postgresql/`$PG_VERSION/main/pg_hba.conf"
    
        if [ -f "`$PG_HBA" ]; then
            if ! grep -q "host    facturio    facturio    127.0.0.1/32    md5" "`$PG_HBA"; then
                echo "Configuration de l'authentification PostgreSQL..."
                sudo sed -i '1i host    facturio    facturio    127.0.0.1/32    md5' "`$PG_HBA"
                sudo systemctl restart postgresql
            fi
        fi
    fi
    
    echo "Mot de passe PostgreSQL créé: `$PG_PASSWORD"
    echo "CONSERVE CE MOT DE PASSE pour le fichier .env !"
else
    echo "Base de données et utilisateur PostgreSQL existent déjà"
fi

echo ""
echo "=== Installation de Nginx ==="
if ! command -v nginx &> /dev/null; then
    echo "Installation de Nginx..."
    sudo apt install -y nginx
    sudo systemctl enable nginx
    sudo systemctl start nginx
else
    echo "Nginx déjà installé"
fi

echo ""
echo "=== Vérification des ports ==="
echo "Port 3000:"
sudo lsof -i :3000 2>/dev/null | head -3 || echo "  Libre"
echo "Port 5173:"
sudo lsof -i :5173 2>/dev/null | head -3 || echo "  Libre"

echo ""
echo "=== Vérification de l'espace disque ==="
df -h / | tail -1

echo ""
echo "=== Vérification de la RAM ==="
free -h | grep Mem

echo ""
echo "=== Résumé ==="
echo "Node.js: `$(node --version)"
echo "npm: `$(npm --version)"
echo "PostgreSQL: `$(sudo systemctl is-active postgresql)"
echo "Nginx: `$(sudo systemctl is-active nginx)"
echo "Architecture: `$(uname -m)"

echo ""
echo "=== Installation terminée ==="
echo "Prochaines étapes:"
echo "1. Déployer l'application avec: ./scripts/windows/deploy-app.ps1 -AppServer ${SshHost}"
echo "2. Configurer le fichier .env dans /opt/facturio/server/.env"
echo "3. Initialiser la base de données"
echo "4. Configurer les services systemd et Nginx"
"@

Write-Host "Exécution du script d'installation sur le serveur..." -ForegroundColor Yellow
Write-Host "(Cela peut prendre plusieurs minutes)" -ForegroundColor Yellow
Write-Host ""

# Créer un fichier temporaire sur le serveur et l'exécuter (pour éviter les problèmes de fins de ligne)
$tempScript = "/tmp/facturio-setup-$(Get-Random).sh"
$installScriptUnix = $installScript -replace "`r`n", "`n" -replace "`r", "`n"

# Préparer la variable d'environnement pour le mot de passe PostgreSQL si fourni
$envPrefix = ""
if ($PostgresPassword) {
    $envPrefix = "export POSTGRES_PASSWORD='$PostgresPassword'; "
}

# Copier le script sur le serveur avec la variable d'environnement si nécessaire
$installScriptUnix | ssh ${Server} "$envPrefix cat > $tempScript && chmod +x $tempScript"

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR: Impossible de copier le script sur le serveur" -ForegroundColor Red
    exit 1
}

# Exécuter le script sur le serveur (avec la variable d'environnement si nécessaire)
ssh ${Server} "$envPrefix bash $tempScript; EXIT_CODE=`$?; rm -f $tempScript; exit `$EXIT_CODE"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERREUR: L'installation a échoué" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Installation terminée avec succès ===" -ForegroundColor Green
Write-Host ""
Write-Host "Prochaines étapes:" -ForegroundColor Cyan
Write-Host "1. Déployer l'application: .\scripts\windows\deploy-app.ps1 -AppServer ${SshHost} -AppUser ${SshUser}"
Write-Host "2. Configurer le fichier .env dans /opt/facturio/server/.env"
Write-Host "3. Initialiser la base de données"
Write-Host "4. Configurer les services systemd et Nginx (voir docs/deployment/DEPLOIEMENT_PRODUCTION.md)"

