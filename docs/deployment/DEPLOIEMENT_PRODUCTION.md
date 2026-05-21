# Déploiement en production - Facturio

Ce document décrit le déploiement complet de Facturio en production sur un serveur applicatif avec reverse proxy HTTPS sur un serveur Nginx. Remplacer les placeholders (`votre-app.lan`, `votre-nginx.lan`, `votre_user`, `votre-domaine.fr`) par vos valeurs.

## Architecture de production

```
Internet (HTTPS)
    ↓
votre-nginx.lan (Nginx + SSL Let's Encrypt)
    ↓ (proxy HTTP interne)
votre-app.lan:3000 (Facturio Backend NestJS)
    ↓
votre-app.lan:5173 (Facturio Frontend React - build statique servi par Nginx)
    ↓
SQLite ou PostgreSQL (base de données)
```

### Composants

- **Serveur Nginx** : Reverse proxy avec certificats SSL Let's Encrypt
- **Serveur applicatif** : Facturio (NestJS backend + React frontend)
- **Base de données** : PostgreSQL en production
- **Services systemd** : Gestion automatique des services

### Domaines

- `facturio.votre-domaine.fr` : Application principale
- `devis.votre-domaine.fr` : Alias (liens publics devis)
- `facture.votre-domaine.fr` : Alias (liens publics factures)

## Étape 1 : Choix du serveur applicatif

Utiliser les scripts de déploiement avec variables d'environnement :

```powershell
# Windows (PowerShell)
$env:DEPLOY_SERVERS = "server1.lan,server2.lan"
$env:DEPLOY_SSH_USER = "votre_user"
.\scripts\windows\examine-servers.ps1
```

```bash
# Linux/Mac
export DEPLOY_SERVERS="server1.lan,server2.lan"
export DEPLOY_SSH_USER="votre_user"
./scripts/linux/examine-servers.sh
```

**Critères de choix** :
- Espace disque disponible (minimum 5GB recommandé)
- RAM disponible (minimum 2GB recommandé)
- Pas de conflit de ports (3000, 5173)
- PostgreSQL déjà installé (optionnel mais recommandé)
- **Raspberry Pi** : utiliser obligatoirement l’OS **64-bit** (arm64), car Prisma ne fournit pas les engines pour 32-bit (armv7l). Vérifier avec `uname -m` (aarch64 = OK).

**Note** : Dans la suite du guide, `votre-app.lan` désigne le serveur applicatif choisi.

## Étape 2 : Préparation du serveur applicatif (votre-app.lan)

### 2.1. Installation des dépendances système

```bash
ssh votre_user@votre-app.lan

sudo apt update
sudo apt install -y nodejs npm build-essential git

# Vérifier Node.js (besoin de Node 20+)
node --version  # Doit être >= 20
npm --version   # Doit être >= 9

# Si Node.js < 20, installer Node 20 via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2.2. Installation PostgreSQL (recommandé en prod)

Guide détaillé (tuning, pool Prisma, maintenance) : **[POSTGRESQL_PRODUCTION.md](./POSTGRESQL_PRODUCTION.md)**.

```bash
sudo apt install -y postgresql postgresql-contrib

# Créer l'utilisateur et la base (éditer le mot de passe dans le script)
sudo -u postgres psql -f /opt/facturio/scripts/deploy/postgresql/init-facturio.sql

# Tuning VPS 2 Go (adapter le chemin version PostgreSQL)
sudo cp /opt/facturio/scripts/deploy/postgresql/facturio-tuning.conf \
  /etc/postgresql/16/main/conf.d/99-facturio.conf

# Authentification locale
sudo sed -i '1i host    facturio    facturio    127.0.0.1/32    scram-sha-256' /etc/postgresql/*/main/pg_hba.conf
sudo systemctl restart postgresql
```

### 2.3. Déploiement de l'application

```bash
# Créer le répertoire de l'application
sudo mkdir -p /opt/facturio
sudo chown pi:pi /opt/facturio
cd /opt/facturio

# Cloner le projet (ou copier via SCP depuis ta machine locale)
# Option 1 : Git
git clone https://github.com/loupix/Facturio.git .

# Option 2 : SCP depuis ta machine locale
# Depuis ta machine locale (ou utiliser le script deploy-app.ps1 / deploy-app.sh) :
# scp -r Facturio/* votre_user@votre-app.lan:/opt/facturio/
```

### 2.4. Installation des dépendances

```bash
cd /opt/facturio

# Installer les dépendances backend et frontend
npm run install:all

# Ou séparément :
cd server && npm install && cd ..
cd frontend && npm install && cd ..
```

### 2.5. Configuration de l'environnement (avant le build)

Créer le fichier `.env` de production à partir du modèle :

```bash
cd /opt/facturio/server
cp env.prod.example .env
nano .env  # Ajuster JWT_SECRET, SMTP, etc.
```

Le mot de passe PostgreSQL est défini dans `env.prod.example` (utilisateur `facturio`, base `facturio`). Pour le changer, modifier `.env` et recréer l'utilisateur PostgreSQL en conséquence.

**Variables SMTP obligatoires** (pour validation email) :
```bash
SMTP_HOST=votre-serveur-smtp.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-utilisateur
SMTP_PASS=votre-mot-de-passe
MAIL_FROM=noreply@votre-domaine.fr
MAIL_FROM_NAME=Facturio
FRONTEND_URL=https://facturio.votre-domaine.fr
```

**Accès public (derrière reverse proxy)** : ajouter dans `.env` pour autoriser les requêtes qui ne viennent pas de localhost (login/signup depuis le domaine public) :
```bash
ALLOW_PUBLIC_ACCESS=true
```

**Pour les tests** : Utiliser Mailpit (voir `docs/deployment/MIGRATION_VALIDATION_EMAIL.md`).

### 2.6. Build de l'application (PostgreSQL)

En production on utilise PostgreSQL : le schéma Prisma dédié est `prisma/schema.postgresql.prisma`.

```bash
cd /opt/facturio/server

# Générer le client Prisma pour PostgreSQL
npm run prisma:prod

# Appliquer les migrations (recommandé en production)
npx prisma migrate deploy --schema=prisma/schema.postgresql.prisma

# OU créer les tables en base (si migrations déjà appliquées)
# npm run db:push:prod

# Build backend (TypeScript → JavaScript, avec client PostgreSQL)
npm run build:prod
cd ..

# Build frontend (React → fichiers statiques)
cd frontend
npm run build
cd ..
```

**Note** : Pour les mises à jour avec nouvelles migrations, voir `docs/deployment/MIGRATION_VALIDATION_EMAIL.md`.

**Alternative : build en local (recommandé si le serveur a peu de RAM, ex. Raspberry Pi 1 Go)**  
Ne pas builder sur le serveur. Utiliser les scripts qui buildent en local puis copient uniquement le dossier `dist` :
```powershell
# Depuis ta machine (PowerShell)
$env:DEPLOY_APP_SERVER = "votre-app.lan"; $env:DEPLOY_SSH_USER = "votre_user"
.\scripts\windows\deploy-backend-build.ps1   # Backend : build local, copie dist, redémarre facturio
.\scripts\windows\deploy-frontend-build.ps1 # Frontend : build local, copie dist (évite OOM)
```
Voir `scripts/deploy/README.md` pour les détails. **Important** : le script backend ne copie que `dist`, pas `node_modules`. Toutes les dépendances utilisées au runtime doivent être dans `dependencies` (et non seulement en devDependencies) du `package.json` ; sur le serveur, exécuter `npm install` après toute modification de `package.json`, puis `sudo systemctl restart facturio`.

### 2.7. Initialisation de la base de données

```bash
cd /opt/facturio/server

# Les tables ont été créées avec db:push:prod à l'étape 2.6.
# Seed initial (taux de TVA, plan comptable, utilisateur par défaut)
npm run seed:prod
```

### 2.8. Création des répertoires de logs

```bash
sudo mkdir -p /opt/facturio/logs
sudo chown pi:pi /opt/facturio/logs
```

## Étape 3 : Configuration des services systemd

### 3.1. Service Facturio Backend

Créer `/etc/systemd/system/facturio.service` :

```ini
[Unit]
Description=Facturio Backend API
After=network.target postgresql.service

[Service]
Type=simple
User=pi
Group=pi
WorkingDirectory=/opt/facturio/server
Environment=NODE_ENV=prod
EnvironmentFile=/opt/facturio/server/.env
ExecStart=/usr/bin/node dist/main.js
Restart=always
RestartSec=10
StandardOutput=append:/opt/facturio/logs/facturio_backend.log
StandardError=append:/opt/facturio/logs/facturio_backend_error.log

[Install]
WantedBy=multi-user.target
```

### 3.2. Service Nginx pour le frontend (sur le serveur applicatif)

Le frontend React sera servi par Nginx localement sur le serveur applicatif, puis proxyfié par le serveur Nginx (votre-nginx.lan).

Installer Nginx sur le serveur applicatif :

```bash
sudo apt install -y nginx
```

Créer `/etc/nginx/sites-available/facturio-frontend`. Un fichier de référence est fourni dans le dépôt : `scripts/deploy/facturio-frontend-nginx-app.conf`. Contenu attendu (attention : utiliser `try_files $uri $uri/ /index.html;`, pas `try_files / /index.html;` qui provoque une boucle de redirections 301) :

```nginx
server {
    listen 5173;
    server_name localhost;
    root /opt/facturio/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public";
    }

    access_log /var/log/nginx/facturio_frontend_access.log;
    error_log /var/log/nginx/facturio_frontend_error.log;
}
```

Déployer depuis ta machine (optionnel) :
```powershell
scp Facturio/scripts/deploy/facturio-frontend-nginx-app.conf votre_user@votre-app.lan:/tmp/
ssh votre_user@votre-app.lan "sudo mv /tmp/facturio-frontend-nginx-app.conf /etc/nginx/sites-available/facturio-frontend && sudo nginx -t && sudo systemctl reload nginx"
```

Permissions : pour que Nginx (www-data) puisse lire le `dist`, s'assurer que les répertoires parents sont traversables et que le contenu de `dist` appartient à www-data :
```bash
sudo chmod 755 /opt/facturio /opt/facturio/frontend
sudo chown -R www-data:www-data /opt/facturio/frontend/dist
sudo chmod -R 755 /opt/facturio/frontend/dist
```

Activer le site :

```bash
sudo ln -sf /etc/nginx/sites-available/facturio-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3.3. Activation des services

```bash
sudo systemctl daemon-reload
sudo systemctl enable facturio
sudo systemctl start facturio
```

Vérifier le statut :

```bash
sudo systemctl status facturio
curl http://localhost:3000/api/health  # Si endpoint health existe
```

## Étape 4 : Configuration du reverse proxy sur le serveur Nginx

### 4.1. Vérifier Nginx

```bash
ssh votre_user@votre-nginx.lan

sudo systemctl status nginx
```

Si Nginx n'est pas installé :

```bash
sudo apt update
sudo apt install -y nginx
```

### 4.2. Configuration Nginx pour Facturio

Créer `/etc/nginx/sites-available/facturio.votre-domaine.fr` (ou utiliser le script `deploy-nginx-config.ps1` / `deploy-nginx-config.sh` avec DEPLOY_* configurés) :

```nginx
# Configuration pour les 3 domaines : facturio, devis, facture.votre-domaine.fr
server {
    listen 80;
    server_name facturio.votre-domaine.fr devis.votre-domaine.fr facture.votre-domaine.fr;

    # Frontend React (avec WebSocket pour HMR si mode dev)
    location / {
        proxy_pass http://votre-app.lan:5173;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }

    # Backend API
    location /api {
        proxy_pass http://votre-app.lan:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts pour les requêtes longues (génération PDF, etc.)
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    access_log /var/log/nginx/facturio_access.log;
    error_log /var/log/nginx/facturio_error.log;
}
```

**Important** : Remplacer `votre-app.lan` et `votre-domaine.fr` par vos valeurs.

Augmenter la taille du hash bucket pour les noms de serveurs :

```bash
sudo sed -i '/^http {/a\    server_names_hash_bucket_size 128;' /etc/nginx/nginx.conf
```

Activer le site :

```bash
sudo ln -sf /etc/nginx/sites-available/facturio.votre-domaine.fr /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4.3. Configuration SSL avec Let's Encrypt

Installer Certbot :

```bash
sudo apt install -y certbot python3-certbot-nginx
```

Obtenir les certificats SSL :

```bash
sudo certbot --nginx \
    -d facturio.votre-domaine.fr \
    -d devis.votre-domaine.fr \
    -d facture.votre-domaine.fr \
    --non-interactive \
    --agree-tos \
    --email admin@votre-domaine.fr \
    --redirect
```

Certbot configure automatiquement :
- Les certificats SSL
- La redirection HTTP → HTTPS
- Le renouvellement automatique

Vérifier le renouvellement automatique :

```bash
sudo certbot renew --dry-run
sudo systemctl status certbot.timer
```

## Étape 5 : Vérifications et tests

### 5.1. Vérification des services

Sur le serveur applicatif (votre-app.lan) :

```bash
# Vérifier le service backend
sudo systemctl status facturio

# Vérifier les processus
ps aux | grep node

# Tester l'API localement
curl http://localhost:3000/api/health

# Tester le frontend localement
curl http://localhost:5173
```

### 5.2. Vérification du reverse proxy

Sur le serveur Nginx (votre-nginx.lan) :

```bash
# Tester Nginx
sudo nginx -t
sudo systemctl status nginx

# Tester la connexion vers le serveur applicatif
curl http://votre-app.lan:3000/api/health
curl http://votre-app.lan:5173

# Tester HTTPS
curl -I https://facturio.votre-domaine.fr
curl -I https://devis.votre-domaine.fr
curl -I https://facture.votre-domaine.fr
```

### 5.3. Vérification des logs

```bash
# Logs Facturio Backend
tail -f /opt/facturio/logs/facturio_backend.log
tail -f /opt/facturio/logs/facturio_backend_error.log

# Logs Nginx (reverse proxy)
tail -f /var/log/nginx/facturio_access.log
tail -f /var/log/nginx/facturio_error.log

# Logs Nginx (frontend local)
tail -f /var/log/nginx/facturio_frontend_access.log

# Logs systemd
sudo journalctl -u facturio -f
```

## Étape 6 : Maintenance et monitoring

### 6.1. Commandes utiles

Redémarrer les services :

```bash
# Sur le serveur applicatif
sudo systemctl restart facturio
sudo systemctl restart nginx

# Sur le serveur Nginx
sudo systemctl restart nginx
```

Voir les logs en temps réel :

```bash
sudo journalctl -u facturio -f
```

### 6.2. Mise à jour de l'application

```bash
cd /opt/facturio

# Si utilisation de git
git pull

# Installer nouvelles dépendances
cd server
npm install

# Appliquer migrations Prisma (si nouvelles migrations)
npx prisma migrate deploy --schema=prisma/schema.postgresql.prisma

# Rebuild backend
npm run build:prod
cd ..

# Rebuild frontend
cd frontend
npm install
npm run build
cd ..

# Redémarrer les services
sudo systemctl restart facturio
sudo systemctl reload nginx
```

**⚠️ Important** : Pour les mises à jour majeures (ex: validation email), consulter le guide de migration spécifique : `docs/deployment/MIGRATION_VALIDATION_EMAIL.md`

### 6.3. Sauvegarde de la base de données

**SQLite** :

```bash
cp /opt/facturio/server/prisma/prod.db /opt/facturio/backup_$(date +%Y%m%d_%H%M%S).db
```

**PostgreSQL** :

```bash
sudo -u postgres pg_dump facturio > /opt/facturio/backup_$(date +%Y%m%d_%H%M%S).sql
```

## Gestion des utilisateurs en production

Script à exécuter sur le serveur applicatif (avec `.env` et `DATABASE_URL` configurés) : `server/scripts/manage-user.js`.

**Ajouter un utilisateur** (crée une organisation + utilisateur ACTIVE, rôle ADMIN par défaut) :

```bash
cd /opt/facturio/server
node scripts/manage-user.js add "email@example.com" "MotDePasseSecret" "Nom Organisation" "Prenom" "Nom" "ADMIN"
# ou avec npm (les arguments après --)
npm run user:add -- "email@example.com" "MotDePasseSecret" "Nom Organisation" "Prenom" "Nom" "ADMIN"
```

Rôles possibles : `SUPER_ADMIN`, `ADMIN`, `USER`, `VIEWER`. Si omis, défaut = `ADMIN`.

**Supprimer un utilisateur** (par email ; si l’organisation n’a plus d’utilisateur, elle est supprimée) :

```bash
cd /opt/facturio/server
node scripts/manage-user.js remove "email@example.com"
# ou
npm run user:remove -- "email@example.com"
```

**Lister les utilisateurs** :

```bash
node scripts/manage-user.js list
# ou
npm run user:list
```

## Dépannage

### Problème : EACCES sur node_modules (npm install)

Les scripts de déploiement (`deploy-app.ps1` / `deploy-app.sh`) lancent **sudo npm install** et **sudo npm run build** sur le serveur, puis font `sudo chown -R votre_user:votre_user /opt/facturio`. Si tu exécutes npm à la main sans sudo et que tu as EACCES, soit utilise le script, soit sur le serveur :

```bash
# Remplacer votre_user par l'utilisateur SSH (ex. pi)
cd /opt/facturio/server && sudo npm install --omit=dev && sudo npm run prisma:prod && sudo npm run build:prod
cd /opt/facturio/frontend && sudo npm install && sudo npm run build
sudo chown -R votre_user:votre_user /opt/facturio
```

Si le script s'arrête (sudo demande un mot de passe), configure NOPASSWD pour l'utilisateur sur le serveur : `sudo visudo` puis ajouter une ligne du type `votre_user ALL=(ALL) NOPASSWD: ALL` ou restreindre à `/usr/bin/npm`, `/bin/chown`, etc.

### Problème : Prisma sur Raspberry Pi 32-bit (armv7l) - 404 sur les engines

Prisma ne fournit des binaires que pour **amd64** et **arm64**. Sur un Pi en **32-bit (armv7l)**, le binaire des engines n'existe pas (404 sur `schema-engine.gz` et `libquery_engine.so.node`). Il n'y a pas de contournement côté Prisma.

**Solution recommandée** : Utiliser **Raspberry Pi OS 64-bit** (arm64). Les Pi 3, 4 et 5 supportent le 64-bit. Après installation de l’image 64-bit, `uname -m` affiche `aarch64` et Prisma télécharge les engines sans erreur.

- Télécharger l’image : [Raspberry Pi OS (64-bit)](https://www.raspberrypi.com/software/operating-systems/).
- Après migration, réinstaller Node.js (NodeSource ou nvm), PostgreSQL, puis redéployer Facturio.

### Problème : Service ne démarre pas

```bash
# Vérifier les logs
sudo journalctl -u facturio -n 50

# Voir l'erreur exacte (fichier de log ou exécution manuelle)
sudo tail -100 /opt/facturio/logs/facturio_backend_error.log
# ou
cd /opt/facturio/server && node dist/main.js
```

Vérifier aussi les permissions et le `.env` : `ls -la /opt/facturio`, `sudo chown -R pi:pi /opt/facturio`, `cat /opt/facturio/server/.env`.

### Problème : Cannot find module en production

Si le backend plante au démarrage avec `Error: Cannot find module '...'`, le module est utilisé par le code compilé mais absent des `node_modules` du serveur. En production, seules les **dependencies** (et non les devDependencies) sont installées avec `npm install --omit=dev`. Déplacer le paquet concerné en `dependencies` dans `package.json`, puis sur le serveur : `cd /opt/facturio/server && npm install && sudo systemctl restart facturio`.

### Problème : Port 3000 ou 5173 déjà utilisé

```bash
# Trouver le processus
sudo lsof -i :3000
sudo lsof -i :5173

# Tuer le processus
sudo pkill -f "node.*facturio"
```

### Problème : Erreurs Nginx

```bash
# Tester la configuration
sudo nginx -t

# Vérifier les logs
sudo tail -f /var/log/nginx/error.log

# Vérifier la résolution DNS
ping votre-app.lan
```

### Problème : Boucle de redirections 301 sur le frontend (port 5173)

Vérifier que la config Nginx du serveur applicatif utilise bien `try_files $uri $uri/ /index.html;` et non `try_files / /index.html;`. Remplacer le fichier par celui de référence : `scripts/deploy/facturio-frontend-nginx-app.conf`, puis `sudo nginx -t && sudo systemctl reload nginx`.

### Problème : Permission denied sur /opt/facturio/frontend/dist

Nginx (www-data) doit pouvoir traverser les répertoires et lire les fichiers :
```bash
sudo chmod 755 /opt/facturio /opt/facturio/frontend
sudo chown -R www-data:www-data /opt/facturio/frontend/dist
sudo chmod -R 755 /opt/facturio/frontend/dist
```

## Résumé de l'architecture finale

- **URLs publiques** :
  - `https://facturio.votre-domaine.fr` (application principale)
  - `https://devis.votre-domaine.fr` (alias pour devis publics)
  - `https://facture.votre-domaine.fr` (alias pour factures publiques)

- **Services actifs** :
  - Facturio Backend (NestJS) sur votre-app.lan:3000
  - Facturio Frontend (React build) servi par Nginx sur votre-app.lan:5173
  - Nginx (reverse proxy) sur votre-nginx.lan
  - PostgreSQL sur votre-app.lan

- **Sécurité** :
  - Certificats SSL Let's Encrypt
  - Redirection HTTP → HTTPS automatique
  - Renouvellement automatique des certificats

- **Monitoring** :
  - Logs centralisés dans `/opt/facturio/logs/`
  - Logs Nginx dans `/var/log/nginx/`
  - Logs systemd via `journalctl`
