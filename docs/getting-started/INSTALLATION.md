# Guide d'installation - PrestaFacture

Guide complet pour installer et démarrer PrestaFacture en local.

## Prérequis

- **Node.js** : Version 20 ou supérieure
- **npm** : Inclus avec Node.js
- **Git** : Pour cloner le dépôt

### Vérification

```bash
node --version  # Doit afficher v20.x.x ou supérieur
npm --version
git --version
```

## Installation complète

### 1. Cloner le dépôt

```bash
git clone https://github.com/loupix/Facturio.git
cd PrestaFacture
```

### 2. Installer les dépendances backend

```bash
cd server
npm install
```

### 3. Configurer la base de données

#### Option A : SQLite (développement, par défaut)

Aucune configuration supplémentaire nécessaire. La base sera créée automatiquement.

```bash
# Appliquer les migrations
npx prisma migrate dev

# Ou synchroniser rapidement (dev uniquement)
npx prisma db push
```

#### Option B : Postgres (production)

1. Installer et démarrer Postgres
2. Créer un fichier `.env` dans `server/` :

```env
DATABASE_URL="postgresql://user:password@localhost:5432/facturio?schema=public"
```

3. Appliquer les migrations :

```bash
npx prisma migrate deploy
```

### 4. Seed la base de données (optionnel)

```bash
# Seed complet
npm run seed

# Seed de dev (sans purge)
npm run seed:dev
```

Le seed inclut :
- Taux de TVA français
- Plan comptable minimal
- Journaux comptables (VE, BQ, OD)
- Données de démonstration (clients, produits, etc.)

### 5. Démarrer le backend

```bash
npm run start:dev
```

Le serveur démarre sur `http://localhost:3000`.

### 6. Installer les dépendances frontend

Dans un nouveau terminal :

```bash
cd frontend
npm install
```

### 7. Configurer le frontend

Créer un fichier `.env` dans `frontend/` :

```env
# URL de l'API NestJS
VITE_API_URL=http://localhost:3000/api

# Utiliser les mocks (false par défaut)
VITE_USE_MOCK=false
```

### 8. Démarrer le frontend

```bash
npm run dev
```

L'application démarre sur `http://localhost:5173` (ou un autre port si 5173 est occupé).

## Installation avec Docker

### Démarrage rapide

```bash
# À la racine du projet
docker compose up --build
```

Le backend sera disponible sur `http://localhost:3000`.

### Configuration Docker

Le `docker-compose.yml` configure :
- Image Node 20
- Port 3000 exposé
- Volume pour la base SQLite
- Variables d'environnement

Pour utiliser Postgres avec Docker, modifier `docker-compose.yml` :

```yaml
services:
  server:
    environment:
      - DATABASE_URL=postgresql://user:password@postgres:5432/facturio
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: facturio
```

## Vérification de l'installation

### Backend

1. Vérifier que le serveur répond :

```bash
curl http://localhost:3000/clients
```

2. Vérifier la base de données :

```bash
cd server
npx prisma studio
```

Ouvre une interface web pour visualiser les données.

### Frontend

1. Ouvrir `http://localhost:5173` dans le navigateur
2. Vérifier que le dashboard se charge
3. Tester la création d'un client

## Dépannage

### Erreur de port déjà utilisé

Si le port 3000 est occupé :

```bash
# Backend : modifier PORT dans server/.env
PORT=3001

# Frontend : modifier VITE_API_URL dans frontend/.env
VITE_API_URL=http://localhost:3001/api
```

### Erreur Prisma

```bash
# Régénérer le client Prisma
cd server
npx prisma generate

# Réinitialiser la base (ATTENTION : supprime les données)
npx prisma migrate reset
```

### Erreur de dépendances

```bash
# Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install
```

### CORS en développement

Le CORS est activé par défaut pour toutes les origines en dev. Si tu rencontres des problèmes :

1. Vérifier que le backend tourne sur le bon port
2. Vérifier `VITE_API_URL` dans le frontend
3. Vérifier le proxy Vite dans `vite.config.ts`

## Prochaines étapes

Une fois l'installation terminée :

1. Consulter `docs/API.md` pour les endpoints disponibles
2. Consulter `docs/DEVELOPMENT.md` pour le guide de développement
3. Explorer les modules dans `server/src/` et `frontend/src/`

## Support

En cas de problème :
- Vérifier les logs du serveur
- Consulter la documentation dans `docs/`
- Vérifier les issues GitHub




