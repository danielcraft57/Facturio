# Script pour synchroniser uniquement les fichiers vers la prod (pas d'installation npm ni de build)
# Utilise quand tu as modifie du code en local et veux juste pousser les changements.
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
    Write-Host "  Exemple: .\scripts\windows\deploy-sync.ps1 -AppServer votre-server.lan -AppUser votre_user" -ForegroundColor Yellow
    exit 1
}

if ([string]::IsNullOrWhiteSpace($AppUser)) {
    Write-Host "ERREUR: Utilisateur SSH non configuré." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path (Join-Path $localDir "server")) -or -not (Test-Path (Join-Path $localDir "frontend"))) {
    Write-Host "ERREUR: Ce script doit être exécuté depuis le répertoire PrestaFacture" -ForegroundColor Red
    exit 1
}

Write-Host "=== Synchronisation des fichiers (sans npm/build) ===" -ForegroundColor Cyan
Write-Host "Serveur: $AppServer"
Write-Host "Répertoire distant: $AppDir"
Write-Host ""

ssh ${AppUser}@${AppServer} "echo 'Connexion OK'"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR: Impossible de se connecter à $AppServer" -ForegroundColor Red
    exit 1
}

Write-Host "Preparation de la copie (sans node_modules, .git, dist, build)..." -ForegroundColor Yellow
$tempDeploy = Join-Path $env:TEMP "facturio-sync-$(Get-Random)"
New-Item -ItemType Directory -Path $tempDeploy -Force | Out-Null
robocopy $localDir $tempDeploy /E /XD node_modules .git dist build /XF "*.db" ".env" "*.log" /NFL /NDL /NJH /NJS /NP
if ($LASTEXITCODE -ge 8) {
    Remove-Item $tempDeploy -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "ERREUR: robocopy a echoue (code $LASTEXITCODE)" -ForegroundColor Red
    exit 1
}

Write-Host "Copie vers le serveur (scp)..." -ForegroundColor Yellow
scp -r "$tempDeploy\*" ${AppUser}@${AppServer}:${AppDir}/
Remove-Item $tempDeploy -Recurse -Force -ErrorAction SilentlyContinue
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR: scp a echoue" -ForegroundColor Red
    exit 1
}

Write-Host "Ajustement des droits sur le serveur..." -ForegroundColor Yellow
ssh ${AppUser}@${AppServer} "sudo chown -R ${AppUser}:${AppUser} $AppDir"

Write-Host ""
Write-Host "=== Synchronisation terminée ===" -ForegroundColor Green
Write-Host "Fichiers à jour. Redémarrer les services si besoin :"
Write-Host "  ssh ${AppUser}@${AppServer} 'sudo systemctl restart facturio'"
Write-Host "  (et Nginx frontend si tu sers le build depuis le serveur applicatif)"

