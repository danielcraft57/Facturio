# Script pour déployer Facturio sur un serveur applicatif
# Configurer : $env:DEPLOY_SSH_USER = "votre_user" ou passer -AppUser

param(
    [string]$AppServer = $env:DEPLOY_APP_SERVER,
    [string]$AppUser = $env:DEPLOY_SSH_USER,
    [string]$AppDir = "/opt/facturio"
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$localDir = Resolve-Path (Join-Path $scriptDir "..\..")

if ([string]::IsNullOrWhiteSpace($AppServer)) {
    Write-Host "ERREUR: Serveur applicatif non configuré." -ForegroundColor Red
    Write-Host "  Exemple: .\deploy-app.ps1 -AppServer votre-server.lan -AppUser votre_user" -ForegroundColor Yellow
    Write-Host "  Ou: `$env:DEPLOY_APP_SERVER = 'votre-server.lan'; `$env:DEPLOY_SSH_USER = 'votre_user'; .\deploy-app.ps1" -ForegroundColor Yellow
    exit 1
}

if ([string]::IsNullOrWhiteSpace($AppUser)) {
    Write-Host "ERREUR: Utilisateur SSH non configuré." -ForegroundColor Red
    Write-Host "  Exemple: .\deploy-app.ps1 -AppServer $AppServer -AppUser votre_user" -ForegroundColor Yellow
    exit 1
}

# Vérifier que nous sommes dans le bon répertoire
if (-not (Test-Path (Join-Path $localDir "server")) -or -not (Test-Path (Join-Path $localDir "frontend"))) {
    Write-Host "ERREUR: Ce script doit être exécuté depuis le répertoire Facturio" -ForegroundColor Red
    exit 1
}

Write-Host "=== Déploiement de Facturio ===" -ForegroundColor Cyan
Write-Host "Serveur: $AppServer"
Write-Host "Utilisateur: $AppUser"
Write-Host "Répertoire distant: $AppDir"
Write-Host ""

# Vérifier la connexion SSH
Write-Host "Vérification de la connexion SSH..." -ForegroundColor Yellow
ssh ${AppUser}@${AppServer} "echo 'Connexion OK'"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR: Impossible de se connecter à $AppServer" -ForegroundColor Red
    exit 1
}

# Créer le répertoire sur le serveur
Write-Host "Création du répertoire sur le serveur..." -ForegroundColor Yellow
ssh ${AppUser}@${AppServer} "sudo mkdir -p $AppDir && sudo chown ${AppUser}:${AppUser} $AppDir"

# Copie locale sans node_modules, .git, dist, build (robocopy) puis scp
Write-Host "Preparation d'une copie sans node_modules, .git, dist, build..." -ForegroundColor Yellow
$tempDeploy = Join-Path $env:TEMP "facturio-deploy-$(Get-Random)"
New-Item -ItemType Directory -Path $tempDeploy -Force | Out-Null
$robocopyExit = 0
robocopy $localDir $tempDeploy /E /XD node_modules .git dist build /XF "*.db" ".env" "*.log" /NFL /NDL /NJH /NJS /NP
$robocopyExit = $LASTEXITCODE
# Robocopy: 0=nothing, 1=files, 2=extra, 3=files+extra, 4=mismatch; 8+=erreur
if ($robocopyExit -ge 8) {
    Remove-Item $tempDeploy -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "ERREUR: robocopy a echoue (code $robocopyExit)" -ForegroundColor Red
    exit 1
}
Write-Host "Copie vers le serveur avec scp (cela peut prendre quelques minutes)..." -ForegroundColor Yellow
scp -r "$tempDeploy\*" ${AppUser}@${AppServer}:${AppDir}/
$scpOk = $LASTEXITCODE -eq 0
Remove-Item $tempDeploy -Recurse -Force -ErrorAction SilentlyContinue
if (-not $scpOk) {
    Write-Host "ERREUR: scp a echoue" -ForegroundColor Red
    exit 1
}

# Installer les dépendances et builder sur le serveur (sudo pour npm, puis chown pour l'utilisateur)
Write-Host "Installation des dépendances et build sur le serveur (sudo)..." -ForegroundColor Yellow

$buildScript = @"
set -e
cd $AppDir
echo 'Installation backend...'
cd server && sudo npm install --omit=dev && sudo env PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npm run prisma:prod && sudo env PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npm run build:prod
cd $AppDir
echo 'Installation frontend...'
cd frontend && sudo npm install && sudo npm run build
cd $AppDir
sudo mkdir -p logs
sudo chown -R ${AppUser}:${AppUser} $AppDir
echo 'Build terminé !'
"@

ssh ${AppUser}@${AppServer} $buildScript

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR: Le build a échoué" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Déploiement terminé ===" -ForegroundColor Green
Write-Host "Prochaines étapes :"
Write-Host "1. Installer PostgreSQL sur le serveur (si pas déjà fait) et créer user/base (voir doc)."
Write-Host "2. Configurer .env : ssh ${AppUser}@${AppServer} 'cd $AppDir/server && cp env.prod.example .env && nano .env'"
Write-Host "3. Créer les tables et seed : ssh ${AppUser}@${AppServer} 'cd $AppDir/server && npm run db:push:prod && npm run seed:prod'"
Write-Host "4. Configurer le service systemd : voir docs/deployment/DEPLOIEMENT_PRODUCTION.md"
Write-Host "5. Configurer Nginx local pour le frontend : voir docs/deployment/DEPLOIEMENT_PRODUCTION.md"
