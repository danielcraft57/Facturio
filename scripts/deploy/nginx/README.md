# Nginx reverse proxy (node12 → node10)

| Machine | Rôle |
|---------|------|
| **node12.lan** | Nginx public HTTPS (`facturio.danielcraft.fr`) |
| **node10.lan** | App Facturio : backend `:3000`, frontend Nginx `:5173` (dist) |

## Déployer la config sur node12

Depuis votre PC (Git Bash ou WSL) :

```bash
export DEPLOY_APP_SERVER=node10.lan
export DEPLOY_NGINX_SERVER=node12.lan
export DEPLOY_SSH_USER=pi
export DEPLOY_DOMAIN=danielcraft.fr
export DEPLOY_EMAIL=contact@danielcraft.fr

./scripts/linux/deploy-nginx-config.sh
```

PowerShell :

```powershell
$env:DEPLOY_APP_SERVER = "node10.lan"
$env:DEPLOY_NGINX_SERVER = "node12.lan"
$env:DEPLOY_SSH_USER = "pi"
$env:DEPLOY_DOMAIN = "danielcraft.fr"
.\scripts\windows\deploy-nginx-config.ps1
```

## Vérifications

Sur **node12** :

```bash
curl -sS -o /dev/null -w "%{http_code}\n" http://node10.lan:3000/api/auth/login -X POST \
  -H "Content-Type: application/json" -d '{"email":"a@b.c","password":"x"}'
```

Sur **node10** : service `facturio` actif, Nginx local sur 5173 (`systemctl status nginx`).

## 502 sur `/api`

1. Mauvais hôte dans `proxy_pass` → doit être `node10.lan`, pas `localhost`.
2. Backend n’écoute que sur `127.0.0.1` → redémarrer après mise à jour (écoute `0.0.0.0`).
3. Pare-feu sur node10 : autoriser node12 vers TCP 3000 et 5173.
