# Configuration des environnements

Ce projet supporte trois environnements : **dev**, **test** et **prod**.

## 🚀 Environnements

### Développement (dev)
- **Base de données** : SQLite locale (`prisma/dev.db`)
- **Logging** : Debug (tous les logs)
- **CORS** : Permissif (toutes les origines)
- **Port** : 3000

### Test (test)
- **Base de données** : SQLite de test (`prisma/test.db`)
- **Logging** : Erreurs uniquement
- **CORS** : Restreint
- **Port** : 3001

### Production (prod)
- **Base de données** : PostgreSQL/MySQL (configuré via `DATABASE_URL`)
- **Logging** : Info et erreurs
- **CORS** : Origines spécifiques uniquement
- **Port** : 3000 (ou configuré)

## 📝 Configuration

### Backend

Les variables d'environnement sont définies directement dans les scripts npm ou via des fichiers `.env`.

#### Variables disponibles

```bash
NODE_ENV=dev|test|prod          # Environnement
PORT=3000                       # Port du serveur
DATABASE_URL=file:./prisma/dev.db  # URL de la base de données
CORS_ORIGIN=http://localhost:5173  # Origines CORS autorisées
LOG_LEVEL=debug|info|warn|error    # Niveau de logging
FRONTEND_URL=http://localhost:5173 # URL du frontend
```

#### Scripts disponibles

```bash
# Développement
npm run start:dev

# Production
npm run build
npm run start:prod

# Tests
npm run test
npm run test:e2e

# Seeds
npm run seed:dev
npm run seed:prod
```

### Frontend

Les variables d'environnement doivent être préfixées par `VITE_` pour être accessibles dans le code.

#### Variables disponibles

```bash
VITE_API_URL=http://localhost:3000/api  # URL de l'API backend
VITE_USE_MOCK=false                     # Activer les mocks
VITE_ENV=development|production         # Environnement
```

#### Scripts disponibles

```bash
# Développement
npm run dev

# Build production
npm run build

# Build développement (avec sourcemaps)
npm run build:dev

# Preview
npm run preview
```

## 🔧 Configuration par environnement

### Développement

**Backend** (`server/`):
```bash
NODE_ENV=dev
DATABASE_URL=file:./prisma/dev.db
PORT=3000
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

**Frontend** (`frontend/`):
```bash
VITE_API_URL=http://localhost:3000/api
VITE_USE_MOCK=false
VITE_ENV=development
```

### Test

**Backend**:
```bash
NODE_ENV=test
DATABASE_URL=file:./prisma/test.db
PORT=3001
LOG_LEVEL=error
CORS_ORIGIN=http://localhost:5173
```

### Production

**Backend**:
```bash
NODE_ENV=prod
DATABASE_URL=postgresql://user:password@host:5432/dbname
PORT=3000
LOG_LEVEL=info
CORS_ORIGIN=https://votredomaine.com
FRONTEND_URL=https://votredomaine.com
```

**Frontend**:
```bash
VITE_API_URL=https://api.votredomaine.com/api
VITE_USE_MOCK=false
VITE_ENV=production
```

## 🗄️ Base de données

### Développement
- SQLite locale : `prisma/dev.db`
- Peut être réinitialisée facilement
- Seeds automatiques

### Test
- SQLite de test : `prisma/test.db`
- Réinitialisée avant chaque suite de tests
- Données isolées

### Production
- PostgreSQL ou MySQL recommandé
- Configuration via `DATABASE_URL`
- Migrations manuelles

## 🔒 Sécurité

### Développement
- CORS permissif
- Logs détaillés
- Pas de compression
- Sourcemaps activés

### Production
- CORS restrictif
- Logs minimaux
- Compression activée
- Pas de sourcemaps
- Validation stricte

## 📊 Monitoring

En production, surveiller :
- Temps de réponse API
- Utilisation mémoire
- Erreurs dans les logs
- Taux de requêtes

## 🚨 Dépannage

### Le serveur ne démarre pas
1. Vérifier que le port n'est pas déjà utilisé
2. Vérifier que `DATABASE_URL` est correct
3. Vérifier les permissions sur les fichiers de base de données

### Les tests échouent
1. Vérifier que `NODE_ENV=test`
2. Vérifier que la base de test est accessible
3. Nettoyer la base de test : `rm prisma/test.db`

### CORS bloque les requêtes
1. Vérifier `CORS_ORIGIN` dans les variables d'environnement
2. Vérifier que l'URL du frontend est dans la liste autorisée

