# Build du frontend en local puis deploiement du dossier dist uniquement sur le serveur.
# Necessaire sur les serveurs a faible RAM (ex. Raspberry Pi 1 Go) car "npm run build" depasse la heap Node.
#
# Usage:
#   $env:DEPLOY_APP_SERVER = "votre-app.lan"; $env:DEPLOY_SSH_USER = "votre_user"; .\scripts\windows\deploy-frontend-build.ps1

param(
    [string]$AppServer = $env:DEPLOY_APP_SERVER,
    [string]$AppUser = $env:DEPLOY_SSH_USER,
    [string]$AppDir = "/opt/facturio"
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$facturioRoot = Resolve-Path (Join-Path $scriptDir "..\..")
$frontendDir = Join-Path $facturioRoot "frontend"

if ([string]::IsNullOrWhiteSpace($AppServer)) {
    Write-Host "ERREUR: Serveur non configure." -ForegroundColor Red
    Write-Host "  Exemple: `$env:DEPLOY_APP_SERVER = 'votre-app.lan'; `$env:DEPLOY_SSH_USER = 'votre_user'; .\scripts\windows\deploy-frontend-build.ps1" -ForegroundColor Yellow
    exit 1
}

if ([string]::IsNullOrWhiteSpace($AppUser)) {
    Write-Host "ERREUR: Utilisateur SSH non configure." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path (Join-Path $frontendDir "package.json"))) {
    Write-Host "ERREUR: Dossier frontend introuvable (Facturio/frontend)." -ForegroundColor Red
    exit 1
}

Write-Host "=== Build frontend local + deploiement dist ===" -ForegroundColor Cyan
Write-Host "Build en local (evite OOM sur Pi 1 Go). Serveur: $AppServer"
Write-Host ""

# 1. Build en local
Write-Host "Build du frontend en local..." -ForegroundColor Yellow
Push-Location $frontendDir
try {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERREUR: Le build a echoue." -ForegroundColor Red
        exit 1
    }
} finally {
    Pop-Location
}

$distPath = Join-Path $frontendDir "dist"
if (-not (Test-Path (Join-Path $distPath "index.html"))) {
    Write-Host "ERREUR: dist/index.html introuvable apres le build." -ForegroundColor Red
    exit 1
}

# 2. Preparer repertoire temporaire sur le serveur et copier le contenu de dist
Write-Host "Copie de dist vers le serveur..." -ForegroundColor Yellow
ssh ${AppUser}@${AppServer} "rm -rf /tmp/facturio-dist-deploy; mkdir -p /tmp/facturio-dist-deploy"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR: Connexion SSH ou mkdir." -ForegroundColor Red
    exit 1
}

scp -r "$distPath\*" ${AppUser}@${AppServer}:/tmp/facturio-dist-deploy/
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR: scp a echoue." -ForegroundColor Red
    exit 1
}

# 3. Sur le serveur: remplacer dist par le nouveau, appliquer droits
Write-Host "Installation du dist sur le serveur..." -ForegroundColor Yellow
ssh ${AppUser}@${AppServer} "sudo chmod 755 ${AppDir} ${AppDir}/frontend 2>/dev/null; sudo rm -rf ${AppDir}/frontend/dist.old; if [ -d ${AppDir}/frontend/dist ]; then sudo mv ${AppDir}/frontend/dist ${AppDir}/frontend/dist.old; fi; sudo mv /tmp/facturio-dist-deploy ${AppDir}/frontend/dist; sudo chown -R www-data:www-data ${AppDir}/frontend/dist 2>/dev/null || sudo chown -R ${AppUser}:${AppUser} ${AppDir}/frontend/dist; sudo chmod -R 755 ${AppDir}/frontend/dist; sudo rm -rf ${AppDir}/frontend/dist.old; echo OK"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR: Echec de l installation sur le serveur." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Termine ===" -ForegroundColor Green
Write-Host "Frontend (dist) deploye sur ${AppServer}:${AppDir}/frontend/dist"
Write-Host "Si tu utilises Nginx pour servir le frontend, recharger Nginx. Sinon tu peux lancer 'npm run dev -- --host 0.0.0.0' pour le mode dev."

