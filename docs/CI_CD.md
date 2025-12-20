# CI/CD - Facturio

Documentation sur l'intégration continue et le déploiement de Facturio.

## Vue d'ensemble

Facturio utilise GitHub Actions pour l'intégration continue et le déploiement automatique.

## Workflow CI

### Fichier de configuration

Le workflow est défini dans `.github/workflows/ci.yml`.

### Étapes du pipeline

1. **Checkout** : Récupération du code
2. **Setup Node** : Installation de Node.js 20
3. **Install dependencies** : Installation des dépendances
4. **Lint** : Vérification du code
5. **Build** : Compilation TypeScript
6. **Tests** : Exécution des tests
7. **Coverage** : Génération du rapport de couverture

### Configuration

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - run: npm test
      - run: npm run test:e2e
```

## Tests

### Tests unitaires

Exécutés sur chaque commit et PR :

```bash
npm test
```

### Tests E2E

Tests d'intégration avec base de données dédiée :

```bash
npm run test:e2e
```

### Coverage

Rapport de couverture envoyé à Codecov :

- Badge dans le README
- Seuil minimum : 80%
- Alertes si couverture baisse

## Docker

### Build de l'image

L'image Docker est construite avec un Dockerfile multi-stage :

```dockerfile
FROM node:20-bookworm-slim AS base
# ...
FROM base AS deps
# ...
FROM deps AS build
# ...
FROM base AS runner
# ...
```

### Docker Compose

Pour le développement local :

```bash
docker compose up --build
```

## Déploiement

### Environnements

- **Development** : Local avec SQLite
- **Staging** : Environnement de test
- **Production** : Environnement live

### Variables d'environnement

Variables nécessaires pour le déploiement :

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://...
```

### Déploiement manuel

```bash
# Build
npm run build

# Start
npm start
```

### Déploiement avec Docker

```bash
docker build -t facturio-server:latest .
docker run -p 3000:3000 facturio-server:latest
```

## Badges

Les badges dans le README affichent :

- **CI Status** : État du pipeline
- **Coverage** : Taux de couverture
- **Node Version** : Version Node.js utilisée

## Monitoring

### Logs

Les logs sont centralisés pour le monitoring :

- Erreurs
- Performances
- Requêtes API

### Alertes

Alertes configurées pour :

- Échecs de build
- Baisse de couverture
- Erreurs critiques

## Bonnes pratiques

1. **Tests avant merge** : Tous les tests doivent passer
2. **Coverage** : Maintenir un taux de couverture élevé
3. **Lint** : Code conforme aux règles
4. **Build** : Le build doit toujours réussir
5. **Documentation** : Mettre à jour la doc avec les changements

## Évolutions futures

- [ ] Déploiement automatique sur staging
- [ ] Déploiement automatique sur production
- [ ] Tests de performance
- [ ] Tests de sécurité
- [ ] Déploiement blue/green
- [ ] Rollback automatique




