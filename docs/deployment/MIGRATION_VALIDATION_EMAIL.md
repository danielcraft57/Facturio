# Guide de migration - Validation email et sécurité renforcée

## Date : 21 février 2026

Ce guide décrit les étapes pour migrer vers la version avec validation email obligatoire et sécurité renforcée.

## ⚠️ Points importants avant migration

1. **Validation email obligatoire** : Les utilisateurs existants avec `emailVerified: false` ne pourront plus se connecter après la migration
2. **Nouvelle dépendance** : `@nestjs/schedule` pour le cron job de nettoyage
3. **Variables SMTP requises** : Configuration SMTP obligatoire pour l'envoi d'emails de vérification
4. **Migration Prisma** : Deux migrations à appliquer (`password_reset` et `email_verification`)

## 📋 Prérequis

- Accès SSH au serveur de production
- Accès à la base de données PostgreSQL
- Configuration SMTP fonctionnelle (ou Mailpit pour tests)
- Backup de la base de données (recommandé)

## 🔄 Étape 1 : Backup de la base de données

**⚠️ CRITIQUE : Toujours faire un backup avant migration**

```bash
# Sur le serveur applicatif
cd /opt/facturio/server

# Backup PostgreSQL
sudo -u postgres pg_dump facturio > /opt/facturio/backup_pre_validation_email_$(date +%Y%m%d_%H%M%S).sql

# Vérifier que le backup existe
ls -lh /opt/facturio/backup_pre_validation_email_*.sql
```

## 🔄 Étape 2 : Mettre à jour le code

```bash
cd /opt/facturio

# Si utilisation de git
git pull origin main

# Ou copier les nouveaux fichiers depuis votre machine locale
# (utiliser les scripts deploy-app.sh ou deploy-app.ps1)
```

## 🔄 Étape 3 : Installer les nouvelles dépendances

```bash
cd /opt/facturio/server

# Installer les dépendances (inclut @nestjs/schedule)
npm install

# Vérifier que @nestjs/schedule est installé
npm list @nestjs/schedule
```

## 🔄 Étape 4 : Mettre à jour les variables d'environnement

Éditer `/opt/facturio/server/.env` et ajouter/modifier :

```bash
# SMTP (OBLIGATOIRE pour validation email)
SMTP_HOST=votre-serveur-smtp.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-utilisateur-smtp
SMTP_PASS=votre-mot-de-passe-smtp
MAIL_FROM=noreply@votre-domaine.fr
MAIL_FROM_NAME=PrestaFacture

# URLs publiques (pour les liens dans les emails)
FRONTEND_URL=https://facturio.votre-domaine.fr
PUBLIC_APP_URL=https://facturio.votre-domaine.fr
API_URL=https://facturio.votre-domaine.fr/api

# Mentions légales (pour les emails)
COMPANY_NAME=Votre Entreprise
COMPANY_ADDRESS=Votre adresse
COMPANY_SIRET=Votre SIRET
COMPANY_VAT=Votre numéro TVA
COMPANY_PHONE=Votre téléphone
COMPANY_EMAIL=contact@votre-domaine.fr
```

**Note** : Pour les tests en local avec Mailpit, utiliser :
```bash
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
# Pas besoin de SMTP_USER/SMTP_PASS
```

## 🔄 Étape 5 : Appliquer les migrations Prisma

### 5.1. Générer le client Prisma pour PostgreSQL

```bash
cd /opt/facturio/server
npm run prisma:prod
```

### 5.2. Appliquer les migrations

**Option A : Utiliser `prisma migrate deploy` (recommandé en production)**

```bash
cd /opt/facturio/server
npx prisma migrate deploy --schema=prisma/schema.postgresql.prisma
```

Cette commande applique uniquement les migrations qui n'ont pas encore été exécutées.

**Option B : Utiliser `prisma db push` (si migrations déjà appliquées)**

```bash
cd /opt/facturio/server
npm run db:push:prod
```

### 5.3. Vérifier les migrations appliquées

```bash
# Vérifier dans la base de données
sudo -u postgres psql facturio -c "\d \"User\""

# Vérifier que les colonnes existent
sudo -u postgres psql facturio -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'User' AND column_name IN ('emailVerificationToken', 'emailVerificationExpires', 'passwordResetToken', 'passwordResetExpires');"
```

Les colonnes suivantes doivent exister :
- `emailVerificationToken` (TEXT, nullable, unique)
- `emailVerificationExpires` (TIMESTAMP, nullable)
- `passwordResetToken` (TEXT, nullable, unique)
- `passwordResetExpires` (TIMESTAMP, nullable)

## 🔄 Étape 6 : Gérer les utilisateurs existants

### 6.1. Vérifier les utilisateurs non vérifiés

```bash
cd /opt/facturio/server
sudo -u postgres psql facturio -c "SELECT id, email, \"emailVerified\", \"status\" FROM \"User\" WHERE \"emailVerified\" = false;"
```

### 6.2. Options pour les utilisateurs existants

**Option A : Marquer tous les utilisateurs existants comme vérifiés (recommandé)**

```bash
cd /opt/facturio/server
sudo -u postgres psql facturio << EOF
UPDATE "User" 
SET "emailVerified" = true, 
    "emailVerifiedAt" = NOW(),
    "status" = 'ACTIVE'
WHERE "emailVerified" = false 
  AND "status" = 'PENDING';
EOF
```

**Option B : Envoyer des emails de vérification aux utilisateurs existants**

Créer un script temporaire `verify-existing-users.js` :

```javascript
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { emailVerified: false }
  });
  
  for (const user of users) {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: token,
        emailVerificationExpires: expires
      }
    });
    
    // Envoyer l'email (utiliser votre service email)
    console.log(`Token pour ${user.email}: ${token}`);
  }
}

main();
```

**Option C : Laisser le cron job nettoyer après 24h**

Les utilisateurs non vérifiés seront automatiquement supprimés par le cron job après 24h. **Attention** : cette option supprime les comptes existants non vérifiés.

## 🔄 Étape 7 : Rebuild et redémarrage

### 7.1. Rebuild backend

```bash
cd /opt/facturio/server
npm run build:prod
```

### 7.2. Rebuild frontend

```bash
cd /opt/facturio/frontend
npm install
npm run build
```

### 7.3. Redémarrer les services

```bash
# Redémarrer le backend
sudo systemctl restart facturio

# Recharger Nginx (si config modifiée)
sudo systemctl reload nginx

# Vérifier le statut
sudo systemctl status facturio
```

## ✅ Étape 8 : Vérifications post-migration

### 8.1. Vérifier les logs

```bash
# Logs backend
sudo journalctl -u facturio -n 50 --no-pager

# Vérifier qu'il n'y a pas d'erreurs
sudo tail -50 /opt/facturio/logs/facturio_backend_error.log
```

### 8.2. Tester l'API

```bash
# Test health (si endpoint existe)
curl http://localhost:3000/api/health

# Test connexion (devrait fonctionner pour utilisateurs vérifiés)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"motdepasse"}'
```

### 8.3. Tester l'envoi d'email

Créer un compte de test et vérifier que l'email de vérification est bien envoyé :

```bash
# Via l'interface web ou API
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"test123456",
    "organizationName":"Test Org"
  }'
```

Vérifier dans les logs SMTP (Mailpit ou serveur SMTP) que l'email est bien envoyé.

### 8.4. Vérifier le cron job

Le cron job de nettoyage s'exécute toutes les heures. Vérifier dans les logs :

```bash
# Attendre quelques minutes puis vérifier les logs
sudo journalctl -u facturio -n 100 | grep -i "cleanup\|nettoyage"
```

## 🔧 Configuration SMTP recommandée

### Pour la production

**Gmail (via App Password)** :
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-app-password
```

**SendGrid** :
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=votre-api-key-sendgrid
```

**Mailgun** :
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@votre-domaine.mailgun.org
SMTP_PASS=votre-api-key-mailgun
```

**OVH / Autre hébergeur** :
```bash
SMTP_HOST=ssl0.ovh.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@votre-domaine.fr
SMTP_PASS=votre-mot-de-passe
```

### Pour les tests (Mailpit)

Installer Mailpit sur le serveur :

```bash
# Télécharger Mailpit
wget https://github.com/axllent/mailpit/releases/latest/download/mailpit-linux-amd64.tar.gz
tar -xzf mailpit-linux-amd64.tar.gz
sudo mv mailpit /usr/local/bin/

# Créer un service systemd pour Mailpit
sudo tee /etc/systemd/system/mailpit.service > /dev/null << EOF
[Unit]
Description=Mailpit SMTP Server
After=network.target

[Service]
Type=simple
User=pi
ExecStart=/usr/local/bin/mailpit
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable mailpit
sudo systemctl start mailpit
```

Configurer `.env` :
```bash
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
```

Accéder à l'interface Mailpit : `http://votre-app.lan:8025`

## 🚨 Rollback en cas de problème

Si la migration pose problème :

### 1. Restaurer la base de données

```bash
# Arrêter le service
sudo systemctl stop facturio

# Restaurer le backup
sudo -u postgres psql facturio < /opt/facturio/backup_pre_validation_email_YYYYMMDD_HHMMSS.sql

# Revenir à l'ancien code (git checkout ou copier fichiers)
cd /opt/facturio
git checkout <commit-avant-migration>

# Rebuild et redémarrer
cd server && npm run build:prod && cd ..
sudo systemctl start facturio
```

### 2. Désactiver temporairement la vérification email

Si besoin urgent, modifier temporairement `server/src/auth/strategies/jwt.strategy.ts` :

```typescript
// Commenter temporairement la vérification
// if (!user.emailVerified) {
//   throw new UnauthorizedException('Veuillez vérifier votre adresse email...');
// }
```

Puis rebuild et redémarrer. **⚠️ Ne pas laisser cette modification en production.**

## 📝 Checklist de migration

- [ ] Backup de la base de données effectué
- [ ] Code mis à jour (git pull ou copie fichiers)
- [ ] Nouvelles dépendances installées (`npm install`)
- [ ] Variables SMTP configurées dans `.env`
- [ ] Migrations Prisma appliquées (`prisma migrate deploy`)
- [ ] Utilisateurs existants gérés (marqués vérifiés ou emails envoyés)
- [ ] Backend rebuild (`npm run build:prod`)
- [ ] Frontend rebuild (`npm run build`)
- [ ] Services redémarrés (`systemctl restart facturio`)
- [ ] Tests API effectués
- [ ] Test envoi email effectué
- [ ] Logs vérifiés (pas d'erreurs)
- [ ] Cron job vérifié (logs de nettoyage)

## 🔍 Dépannage

### Erreur : "Cannot find module '@nestjs/schedule'"

```bash
cd /opt/facturio/server
npm install @nestjs/schedule
npm run build:prod
sudo systemctl restart facturio
```

### Erreur : "Column emailVerificationToken does not exist"

Les migrations n'ont pas été appliquées :

```bash
cd /opt/facturio/server
npx prisma migrate deploy --schema=prisma/schema.postgresql.prisma
```

### Erreur SMTP : "Connection timeout"

Vérifier :
- Le serveur SMTP est accessible depuis le serveur
- Les ports ne sont pas bloqués par un firewall
- Les identifiants SMTP sont corrects

```bash
# Test de connexion SMTP
telnet smtp.gmail.com 587
# ou
nc -zv smtp.gmail.com 587
```

### Les emails ne sont pas envoyés

Vérifier les logs :

```bash
sudo journalctl -u facturio -n 100 | grep -i email
sudo tail -100 /opt/facturio/logs/facturio_backend.log | grep -i email
```

Vérifier la configuration SMTP dans `.env` et tester avec Mailpit en local.

### Utilisateurs bloqués après migration

Si des utilisateurs légitimes sont bloqués :

```bash
# Les marquer comme vérifiés
sudo -u postgres psql facturio << EOF
UPDATE "User" 
SET "emailVerified" = true, 
    "emailVerifiedAt" = NOW(),
    "status" = 'ACTIVE'
WHERE email = 'utilisateur@example.com';
EOF
```

## 📚 Ressources

- Documentation déploiement : `docs/deployment/DEPLOIEMENT_PRODUCTION.md`
- Changelog : `docs/changelog/CHANGELOG_VALIDATION_EMAIL.md`
- Configuration SMTP : `server/env.prod.example`
