# Déploie la config Nginx reverse proxy (ex. node12.lan → raspberry-10.lan)
# Usage :
#   $env:DEPLOY_APP_SERVER = "raspberry-10.lan"
#   $env:DEPLOY_NGINX_SERVER = "node12.lan"
#   $env:DEPLOY_SSH_USER = "pi"
#   $env:DEPLOY_DOMAIN = "danielcraft.fr"
#   .\scripts\windows\deploy-nginx-config.ps1

param(
    [string]$AppServer = $(if ($env:DEPLOY_APP_SERVER) { $env:DEPLOY_APP_SERVER } else { "raspberry-10.lan" }),
    [string]$NginxServer = $(if ($env:DEPLOY_NGINX_SERVER) { $env:DEPLOY_NGINX_SERVER } else { "node12.lan" }),
    [string]$SshUser = $(if ($env:DEPLOY_SSH_USER) { $env:DEPLOY_SSH_USER } else { "pi" }),
    [string]$Domain = $(if ($env:DEPLOY_DOMAIN) { $env:DEPLOY_DOMAIN } else { "danielcraft.fr" }),
    [string]$Email = $(if ($env:DEPLOY_EMAIL) { $env:DEPLOY_EMAIL } else { "contact@danielcraft.fr" })
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$templatePath = Join-Path $repoRoot "scripts\deploy\nginx\facturio-reverse-proxy.conf.template"

if (-not (Test-Path $templatePath)) {
    Write-Host "ERREUR: template introuvable: $templatePath" -ForegroundColor Red
    exit 1
}

$serverNames = "facturio.$Domain devis.$Domain facture.$Domain"
$siteConfigName = "facturio.$Domain"

Write-Host "=== Déploiement Nginx Facturio ===" -ForegroundColor Cyan
Write-Host "  App (Pi)    : $AppServer"
Write-Host "  Nginx       : $NginxServer"
Write-Host "  Domaines    : $serverNames"
Write-Host ""

$raw = Get-Content -Raw -Path $templatePath
$nginxConfig = $raw `
    -replace '__APP_SERVER__', $AppServer `
    -replace '__NGINX_SERVER__', $NginxServer `
    -replace '__DOMAIN__', $Domain `
    -replace '__SERVER_NAMES__', $serverNames

$tempConfig = Join-Path $env:TEMP "facturio_nginx_config.conf"
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($tempConfig, $nginxConfig, $utf8NoBom)

Write-Host "Copie vers ${SshUser}@${NginxServer}..." -ForegroundColor Yellow
scp $tempConfig "${SshUser}@${NginxServer}:/tmp/facturio_nginx_config.conf"
if ($LASTEXITCODE -ne 0) { exit 1 }

$remote = @"
set -e
sudo sed -i '1s/^\xEF\xBB\xBF//' /tmp/facturio_nginx_config.conf 2>/dev/null || true
if [ -f /etc/nginx/sites-available/$siteConfigName ]; then
  sudo cp /etc/nginx/sites-available/$siteConfigName /etc/nginx/sites-available/${siteConfigName}.bak.`$(date +%Y%m%d%H%M%S)
fi
sudo mv /tmp/facturio_nginx_config.conf /etc/nginx/sites-available/$siteConfigName
if ! grep -q 'server_names_hash_bucket_size 128' /etc/nginx/nginx.conf; then
  sudo sed -i '/^http {/a\    server_names_hash_bucket_size 128;' /etc/nginx/nginx.conf
fi
sudo ln -sf /etc/nginx/sites-available/$siteConfigName /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
echo OK
"@

ssh "${SshUser}@${NginxServer}" $remote
if ($LASTEXITCODE -ne 0) { exit 1 }

Remove-Item $tempConfig -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "=== Terminé ===" -ForegroundColor Green
Write-Host "Test depuis node12 : curl http://${AppServer}:3000/api/auth/login ..."
Write-Host "Si HTTPS à refaire : sudo certbot --nginx -d facturio.$Domain ..."
