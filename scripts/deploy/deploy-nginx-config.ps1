# Script pour déployer la configuration Nginx (reverse proxy)
# Configurer : $env:DEPLOY_SSH_USER, $env:DEPLOY_NGINX_SERVER, $env:DEPLOY_DOMAIN, $env:DEPLOY_EMAIL

param(
    [string]$AppServer = $env:DEPLOY_APP_SERVER,
    [string]$NginxServer = $env:DEPLOY_NGINX_SERVER,
    [string]$SshUser = $env:DEPLOY_SSH_USER,
    [string]$Domain = $env:DEPLOY_DOMAIN,
    [string]$Email = $env:DEPLOY_EMAIL
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($AppServer)) {
    Write-Host "ERREUR: Serveur applicatif non configuré (ex. votre-app.lan)." -ForegroundColor Red
    Write-Host "  .\deploy-nginx-config.ps1 -AppServer votre-app.lan -NginxServer votre-nginx.lan -SshUser votre_user -Domain votre-domaine.fr -Email admin@votre-domaine.fr" -ForegroundColor Yellow
    exit 1
}

if ([string]::IsNullOrWhiteSpace($NginxServer)) {
    Write-Host "ERREUR: Serveur Nginx non configuré." -ForegroundColor Red
    exit 1
}

if ([string]::IsNullOrWhiteSpace($SshUser)) {
    Write-Host "ERREUR: Utilisateur SSH non configuré." -ForegroundColor Red
    exit 1
}

# Domaine par défaut pour server_name et Certbot (placeholder si non set)
if ([string]::IsNullOrWhiteSpace($Domain)) { $Domain = "votre-domaine.fr" }
if ([string]::IsNullOrWhiteSpace($Email)) { $Email = "admin@$Domain" }

# Noms de sous-domaines pour Facturio (modifiables si besoin)
$serverNames = "facturio.$Domain devis.$Domain facture.$Domain"
$siteConfigName = "facturio.$Domain"

Write-Host "=== Déploiement de la configuration Nginx ===" -ForegroundColor Cyan
Write-Host "Serveur applicatif: $AppServer"
Write-Host "Serveur Nginx: $NginxServer"
Write-Host "Domaines: $serverNames"
Write-Host ""

$tempConfig = Join-Path $env:TEMP "facturio_nginx_config.conf"

$nginxConfig = @"
# Configuration : $serverNames
server {
    listen 80;
    server_name $serverNames;

    location / {
        proxy_pass http://${AppServer}:5173;
        proxy_http_version 1.1;
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }

    location /api {
        proxy_pass http://${AppServer}:3000;
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    access_log /var/log/nginx/facturio_access.log;
    error_log /var/log/nginx/facturio_error.log;
}
"@

# Écrire sans BOM UTF-8
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($tempConfig, $nginxConfig, $utf8NoBom)

Write-Host "Copie de la configuration vers $NginxServer..." -ForegroundColor Yellow
scp $tempConfig ${SshUser}@${NginxServer}:/tmp/facturio_nginx_config.conf

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR: Impossible de copier la configuration" -ForegroundColor Red
    Remove-Item $tempConfig -ErrorAction SilentlyContinue
    exit 1
}

# Remplacer la variable PowerShell dans le script bash
$installScript = @"
#!/bin/bash
set -e
SITE_CONFIG_NAME="$siteConfigName"
# Supprimer le BOM UTF-8 si présent
sed -i '1s/^\xEF\xBB\xBF//' /tmp/facturio_nginx_config.conf
sudo mv /tmp/facturio_nginx_config.conf /etc/nginx/sites-available/`${SITE_CONFIG_NAME}
if ! grep -q "server_names_hash_bucket_size 128" /etc/nginx/nginx.conf; then
    sudo sed -i '/^http {/a\    server_names_hash_bucket_size 128;' /etc/nginx/nginx.conf
fi
sudo ln -sf /etc/nginx/sites-available/`${SITE_CONFIG_NAME} /etc/nginx/sites-enabled/
sudo nginx -t
NGINX_TEST=`$?
if [ `$NGINX_TEST -eq 0 ]; then
    echo "Configuration Nginx valide. Rechargement..."
    sudo systemctl reload nginx
    echo "Configuration déployée avec succès !"
else
    echo "ERREUR: Configuration Nginx invalide. Vérifiez les logs."
    exit 1
fi
"@

Write-Host "Installation de la configuration..." -ForegroundColor Yellow

# Exécuter les commandes directement sur le serveur (plus simple et plus fiable)
$commands = @(
    "sed -i '1s/^\xEF\xBB\xBF//' /tmp/facturio_nginx_config.conf",
    "sudo mv /tmp/facturio_nginx_config.conf /etc/nginx/sites-available/$siteConfigName",
    "if ! grep -q 'server_names_hash_bucket_size 128' /etc/nginx/nginx.conf; then sudo sed -i '/^http {/a\    server_names_hash_bucket_size 128;' /etc/nginx/nginx.conf; fi",
    "sudo ln -sf /etc/nginx/sites-available/$siteConfigName /etc/nginx/sites-enabled/",
    "sudo nginx -t"
)

foreach ($cmd in $commands) {
    ssh ${SshUser}@${NginxServer} $cmd
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERREUR: La commande a échoué: $cmd" -ForegroundColor Red
        Remove-Item $tempConfig -ErrorAction SilentlyContinue
        exit 1
    }
}

# Recharger Nginx si le test est OK
ssh ${SshUser}@${NginxServer} "sudo systemctl reload nginx"

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR: Impossible de recharger Nginx" -ForegroundColor Red
    Remove-Item $tempConfig -ErrorAction SilentlyContinue
    exit 1
}

Remove-Item $tempConfig -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "=== Configuration Nginx déployée ===" -ForegroundColor Green
Write-Host "Site en HTTP uniquement tant que SSL n'est pas configuré."
Write-Host "Pour activer HTTPS, sur le serveur Nginx exécuter :" -ForegroundColor Yellow
Write-Host "  ssh ${SshUser}@${NginxServer}"
Write-Host "  sudo certbot --nginx -d facturio.${Domain} -d devis.${Domain} -d facture.${Domain} --non-interactive --agree-tos --email ${Email} --redirect"
Write-Host "Puis tester : https://facturio.${Domain}"
