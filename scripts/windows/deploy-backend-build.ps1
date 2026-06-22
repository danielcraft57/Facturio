# Build du backend en local puis deploiement du dossier dist uniquement sur le serveur.
# Utile quand le serveur a peu de RAM (ex. Raspberry Pi) ou une version Node differente.
#
# Usage:
#   $env:DEPLOY_APP_SERVER = "votre-app.lan"; $env:DEPLOY_SSH_USER = "votre_user"; .\scripts\windows\deploy-backend-build.ps1

param(
    [string]$AppServer = $env:DEPLOY_APP_SERVER,
    [string]$AppUser = $env:DEPLOY_SSH_USER,
    [string]$AppDir = "/opt/facturio"
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$facturioRoot = Resolve-Path (Join-Path $scriptDir "..\..")
$serverDir = Join-Path $facturioRoot "server"

if ([string]::IsNullOrWhiteSpace($AppServer)) {
    Write-Host "ERREUR: Serveur non configure." -ForegroundColor Red
    Write-Host "  Exemple: `$env:DEPLOY_APP_SERVER = 'votre-app.lan'; `$env:DEPLOY_SSH_USER = 'votre_user'; .\scripts\windows\deploy-backend-build.ps1" -ForegroundColor Yellow
    exit 1
}

if ([string]::IsNullOrWhiteSpace($AppUser)) {
    Write-Host "ERREUR: Utilisateur SSH non configure." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path (Join-Path $serverDir "package.json"))) {
    Write-Host "ERREUR: Dossier server introuvable (racine du projet/server)." -ForegroundColor Red
    exit 1
}

Write-Host "=== Build backend local + deploiement dist ===" -ForegroundColor Cyan
Write-Host "Serveur: $AppServer - Cible: ${AppDir}/server/dist"
Write-Host ""

# 1. Build en local
Write-Host "Build du backend en local..." -ForegroundColor Yellow
Push-Location $serverDir
try {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERREUR: Le build a echoue." -ForegroundColor Red
        exit 1
    }
} finally {
    Pop-Location
}

$distPath = Join-Path $serverDir "dist"
if (-not (Test-Path (Join-Path $distPath "main.js"))) {
    Write-Host "ERREUR: dist/main.js introuvable apres le build." -ForegroundColor Red
    exit 1
}

# 2. Copie dist vers le serveur (repertoire temporaire)
Write-Host "Copie de dist vers le serveur..." -ForegroundColor Yellow
ssh ${AppUser}@${AppServer} "rm -rf /tmp/facturio-server-dist; mkdir -p /tmp/facturio-server-dist"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR: Connexion SSH ou mkdir." -ForegroundColor Red
    exit 1
}

scp -r "$distPath\*" ${AppUser}@${AppServer}:/tmp/facturio-server-dist/
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR: scp a echoue." -ForegroundColor Red
    exit 1
}

# 3. Sur le serveur: remplacer dist, redemarrer le service
Write-Host "Installation du dist et redemarrage du service facturio..." -ForegroundColor Yellow
ssh ${AppUser}@${AppServer} "sudo systemctl stop facturio; sudo rm -rf ${AppDir}/server/dist.old; if [ -d ${AppDir}/server/dist ]; then sudo mv ${AppDir}/server/dist ${AppDir}/server/dist.old; fi; sudo mv /tmp/facturio-server-dist ${AppDir}/server/dist; sudo chown -R ${AppUser}:${AppUser} ${AppDir}/server/dist; sudo systemctl start facturio; sleep 2; sudo systemctl status facturio --no-pager"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR: Echec de l installation ou du redemarrage." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Termine ===" -ForegroundColor Green
Write-Host "Backend (dist) deploye sur ${AppServer}:${AppDir}/server/dist - service facturio redemarre."

