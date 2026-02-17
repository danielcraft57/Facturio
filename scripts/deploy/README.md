# Scripts de déploiement Facturio

Ces scripts facilitent le déploiement de Facturio en production.

## Prérequis

- Accès SSH aux serveurs (configurer via `DEPLOY_SERVERS` ou paramètres, ex. `server1.lan,server2.lan`)
- Clé SSH configurée pour l'utilisateur de déploiement (ex. `votre_user`)
- **Windows** : PowerShell 5.1+ ou PowerShell Core
- **Linux/Mac** : Bash

## Scripts disponibles

### 1. examine-servers

Examine les serveurs applicatifs pour choisir le meilleur candidat.

**Windows (PowerShell)** :
```powershell
.\examine-servers.ps1
```

**Linux/Mac (Bash)** :
```bash
./examine-servers.sh
```

Affiche pour chaque serveur :
- Espace disque disponible
- RAM disponible
- Ports utilisés (3000, 5173)
- Version Node.js
- Statut PostgreSQL

### 2. deploy-app

Déploie l'application Facturio sur un serveur applicatif.

**Windows (PowerShell)** :
```powershell
.\deploy-app.ps1 [-AppServer votre-server.lan]
```

**Linux/Mac (Bash)** :
```bash
./deploy-app.sh [serveur]
```

Exemple :
```powershell
.\deploy-app.ps1 -AppServer votre-server.lan
```

Ce script :
- Crée le répertoire `/opt/facturio` sur le serveur
- Copie les fichiers (exclut node_modules, .git, etc.)
- Installe les dépendances et build avec **sudo** sur le serveur (backend et frontend), puis `chown` à l'utilisateur de déploiement

**Note** : Sur Windows, le script PowerShell utilise robocopy + scp pour la copie (sans node_modules).

**Note** : Après le déploiement, tu dois :
1. Configurer le fichier `.env` dans `/opt/facturio/server/.env`
2. Initialiser la base de données (`npx prisma migrate deploy && npm run seed:prod`)
3. Configurer le service systemd (voir `docs/deployment/DEPLOIEMENT_PRODUCTION.md`)

### 3. deploy-backend-build (build local + deploiement dist backend)

Build le backend **en local** puis copie uniquement le dossier `dist` sur le serveur. Utile quand le serveur a peu de RAM ou une version Node différente (ex. Node 22 en prod, Node 25 en local).

**Windows (PowerShell)** :
```powershell
$env:DEPLOY_APP_SERVER = "votre-app.lan"; $env:DEPLOY_SSH_USER = "votre_user"
.\deploy-backend-build.ps1
```

Le script : build dans `Facturio/server`, copie `dist/*` vers le serveur, remplace `/opt/facturio/server/dist` et redémarre le service `facturio`.

**Important** : le script ne copie pas `node_modules`. Le serveur doit avoir exécuté `npm install` (au moins une fois) pour que toutes les dépendances **runtime** (celles dans `dependencies` de `package.json`) soient présentes. Si tu ajoutes une dépendance utilisée par le code compilé, la mettre en `dependencies` (pas seulement en devDependencies), puis sur le serveur : `cd /opt/facturio/server && npm install && sudo systemctl restart facturio`.

### 4. deploy-frontend-build (build local + deploiement dist)

Build le frontend **en local** puis copie uniquement le dossier `dist` sur le serveur. À utiliser sur les serveurs à faible RAM (ex. Raspberry Pi 1 Go), car `npm run build` (Vite + Terser) dépasse la limite heap Node et provoque "JavaScript heap out of memory".

**Windows (PowerShell)** :
```powershell
$env:DEPLOY_APP_SERVER = "votre-app.lan"; $env:DEPLOY_SSH_USER = "votre_user"
.\deploy-frontend-build.ps1
```

Le script : build dans `Facturio/frontend`, copie `dist/*` vers le serveur, remplace `/opt/facturio/frontend/dist` et applique les droits (www-data, chmod 755 sur dist et répertoires parents).

### 5. Config Nginx frontend (serveur applicatif, port 5173)

Fichier de référence pour servir le build frontend sur le serveur applicatif : `facturio-frontend-nginx-app.conf`. À utiliser si la config Nginx locale provoque des 301 en boucle ou des "Permission denied".

Déployer sur le serveur applicatif (remplacer votre-app.lan et votre_user) :
```powershell
scp facturio-frontend-nginx-app.conf votre_user@votre-app.lan:/tmp/
ssh votre_user@votre-app.lan "sudo mv /tmp/facturio-frontend-nginx-app.conf /etc/nginx/sites-available/facturio-frontend && sudo nginx -t && sudo systemctl reload nginx"
```

### 6. deploy-sync (fichiers uniquement)

Synchronise uniquement les fichiers vers la prod, **sans** réinstaller les dépendances ni rebuilder. À utiliser quand tu as modifié du code en local et que tu veux juste pousser les changements (backend déjà buildé côté serveur, ou tu rebuilds à la main après).

**Windows (PowerShell)** :
```powershell
.\deploy-sync.ps1 -AppServer votre-server.lan -AppUser votre_user
```

**Linux/Mac (Bash)** :
```bash
./deploy-sync.sh votre-server.lan votre_user
```

Après la sync, redémarrer les services si besoin : `sudo systemctl restart facturio` (et Nginx frontend si applicable).

### 7. deploy-nginx-config

Déploie la configuration Nginx sur le serveur Nginx.

**Windows (PowerShell)** :
```powershell
.\deploy-nginx-config.ps1 [-AppServer votre-app.lan]
```

**Linux/Mac (Bash)** :
```bash
./deploy-nginx-config.sh [serveur-applicatif]
```

Exemple :
```powershell
.\deploy-nginx-config.ps1 -AppServer votre-app.lan
```

Ce script :
- Crée la configuration Nginx pour les domaines configurés (ex. app, devis, facture.votre-domaine.fr)
- Configure le proxy vers le serveur applicatif
- Active le site dans Nginx
- Teste la configuration avant de recharger

**Note** : Pour activer HTTPS, voir la section "Le site reste en HTTP" ci-dessous.

## Workflow de déploiement complet

### Sur Windows (PowerShell)

1. **Examiner les serveurs** :
   ```powershell
   cd scripts\deploy
   .\examine-servers.ps1
   ```

2. **Choisir un serveur** (ex: votre-app.lan)

3. **Déployer l'application** :
   ```powershell
   .\deploy-app.ps1 -AppServer votre-app.lan
   ```

4. **Configurer l'environnement** :
   ```powershell
   ssh votre_user@votre-app.lan
   cd /opt/facturio/server
   cp env.prod.example .env
   nano .env  # Configurer les variables (JWT, SMTP, etc.)
   ```
   Pour un accès public derrière reverse proxy, ajouter `ALLOW_PUBLIC_ACCESS=true` dans `.env`.

5. **Initialiser la base de données** :
   ```bash
   cd /opt/facturio/server
   npx prisma migrate deploy
   npm run seed:prod
   ```

6. **Configurer le service systemd** (voir `docs/deployment/DEPLOIEMENT_PRODUCTION.md`)

7. **Configurer Nginx local** (sur le serveur applicatif) pour servir le frontend : utiliser `facturio-frontend-nginx-app.conf` (voir section 5 ci-dessus) ou `docs/deployment/DEPLOIEMENT_PRODUCTION.md`

8. **Déployer la config Nginx sur le serveur Nginx** :
   ```powershell
   .\deploy-nginx-config.ps1 -AppServer votre-app.lan
   ```

9. **Configurer SSL** :
   ```bash
   ssh votre_user@votre-nginx.lan
   sudo certbot --nginx -d app.votre-domaine.fr -d devis.votre-domaine.fr --non-interactive --agree-tos --email admin@votre-domaine.fr --redirect
   ```

10. **Vérifier** :
    - `https://app.votre-domaine.fr` (ou les domaines configurés)

### Sur Linux/Mac (Bash)

Voir les instructions dans la section précédente, mais utiliser les scripts `.sh` au lieu de `.ps1`.

## Dépannage

### Erreur de connexion SSH

Vérifier que la clé SSH est bien configurée :
```powershell
ssh votre_user@votre-app.lan
```

### Erreur de permissions PowerShell

Sur Windows, si l'exécution de scripts est désactivée :
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Erreur lors du build

Vérifier que Node.js 20+ est installé sur le serveur :
```bash
ssh votre_user@votre-app.lan "node --version"
```

### Build frontend : "JavaScript heap out of memory" sur le serveur

Sur un serveur à faible RAM (ex. Raspberry Pi 1 Go), ne pas lancer `npm run build` sur le serveur. Utiliser le script **deploy-frontend-build** qui build en local puis déploie uniquement le dossier `dist` :
```powershell
.\deploy-frontend-build.ps1
```

### 502 Bad Gateway sur les appels API

Nginx ne reçoit pas de réponse valide du backend. Sur le serveur applicatif : `sudo systemctl status facturio`. Si le service est en échec, voir l'erreur réelle soit dans `/opt/facturio/logs/facturio_backend_error.log`, soit en lançant à la main : `cd /opt/facturio/server && node dist/main.js` (l'exception s'affiche dans le terminal).

Causes fréquentes :
- **Module introuvable (Cannot find module)** : les paquets utilisés par le code compilé doivent être dans `dependencies` (pas seulement devDependencies) dans `package.json`. Sur le serveur : `cd /opt/facturio/server && npm install` puis `sudo systemctl restart facturio`.
- Base de données inaccessible, port 3000 déjà utilisé, ou erreur au démarrage. Après correction : `sudo systemctl start facturio`. Tester depuis le serveur Nginx : `curl -I http://votre-app.lan:3000/api/auth/login`.

### Accès API refusé ("Accès réservé au réseau local")

Si l'API renvoie 403 avec ce message, le backend restreint l'accès au réseau local. Derrière un reverse proxy, ajouter dans `/opt/facturio/server/.env` : `ALLOW_PUBLIC_ACCESS=true`, puis redémarrer le service (`sudo systemctl restart facturio`). Si le code déployé est ancien, rebuilder et redéployer le backend avec `deploy-backend-build.ps1`.

### Le site reste en HTTP (pas de HTTPS)

La config déployée par `deploy-nginx-config` n'écoute que sur le port 80. Pour avoir HTTPS, il faut lancer Certbot **sur le serveur Nginx** (ex. votre-nginx.lan) après le déploiement :

```bash
ssh votre_user@votre-nginx.lan
sudo certbot --nginx -d facturio.votre-domaine.fr -d devis.votre-domaine.fr -d facture.votre-domaine.fr --non-interactive --agree-tos --email admin@votre-domaine.fr --redirect
```

Certbot ajoute alors le bloc `listen 443 ssl` et la redirection HTTP vers HTTPS. Vérifier ensuite : `https://facturio.votre-domaine.fr`. Si Certbot n'est pas installé : `sudo apt install -y certbot python3-certbot-nginx`.

## Notes importantes

- Les scripts excluent automatiquement `node_modules`, `.git`, `dist`, `build`, etc. lors de la copie
- Le fichier `.env` n'est pas copié (pour éviter d'écraser la config de prod)
- Les scripts testent la configuration avant de l'appliquer (surtout pour Nginx)
- Les logs sont disponibles dans `/opt/facturio/logs/` et `/var/log/nginx/`
- Sur Windows, les scripts PowerShell nécessitent PowerShell 5.1+ (inclus dans Windows 10/11)
