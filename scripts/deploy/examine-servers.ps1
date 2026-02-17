# Script pour examiner les serveurs disponibles et choisir le meilleur candidat
# Configurer : $env:DEPLOY_SERVERS = "server1.lan,server2.lan" et $env:DEPLOY_SSH_USER = "votre_user"

param(
    [string]$Servers = $env:DEPLOY_SERVERS,
    [string]$SshUser = $env:DEPLOY_SSH_USER
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($Servers)) {
    Write-Host "ERREUR: Liste de serveurs non configurée." -ForegroundColor Red
    Write-Host "  Exemple: `$env:DEPLOY_SERVERS = 'server1.lan,server2.lan'; .\examine-servers.ps1" -ForegroundColor Yellow
    Write-Host "  Ou: .\examine-servers.ps1 -Servers 'server1.lan,server2.lan' -SshUser votre_user" -ForegroundColor Yellow
    exit 1
}

if ([string]::IsNullOrWhiteSpace($SshUser)) {
    Write-Host "ERREUR: Utilisateur SSH non configuré." -ForegroundColor Red
    Write-Host "  Exemple: `$env:DEPLOY_SSH_USER = 'votre_user'" -ForegroundColor Yellow
    exit 1
}

$serverList = $Servers -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ }

Write-Host "=== Examen des serveurs applicatifs ===" -ForegroundColor Cyan
Write-Host "Utilisateur SSH: $SshUser"
Write-Host ""

foreach ($server in $serverList) {
    Write-Host "--- $server ---" -ForegroundColor Yellow

    $command = @"
echo 'Disque:' && df -h / | tail -1 && echo 'RAM:' && free -h | grep Mem && echo 'Ports utilisés:' && sudo lsof -i :3000 -i :5173 2>/dev/null | head -5 || echo 'Ports 3000 et 5173 libres' && echo 'Node.js:' && node --version 2>/dev/null || echo 'Node.js non installé' && echo 'PostgreSQL:' && sudo systemctl is-active postgresql 2>/dev/null || echo 'PostgreSQL non actif'
"@

    ssh ${SshUser}@${server} $command
    Write-Host ""
}

Write-Host "=== Recommandation ===" -ForegroundColor Green
Write-Host "Choisir le serveur avec :"
Write-Host "- Espace disque suffisant (minimum 5GB)"
Write-Host "- RAM disponible (minimum 2GB)"
Write-Host "- Ports 3000 et 5173 libres"
Write-Host "- Node.js 20+ installé"
Write-Host "- PostgreSQL installé (optionnel mais recommandé)"
