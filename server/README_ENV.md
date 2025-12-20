# Configuration des environnements

## 🚀 Utilisation rapide

### Développement
```bash
npm run start:dev
```
- Base de données : `prisma/dev.db`
- Port : 3000
- Logs : Debug
- CORS : Permissif

### Tests
```bash
npm run test:e2e
```
- Base de données : `prisma/test.db`
- Logs : Erreurs uniquement

### Production
```bash
npm run build
npm run start:prod
```
- Base de données : Configurée via `DATABASE_URL`
- Logs : Info
- CORS : Restreint
- Compression : Activée

## 📝 Variables d'environnement

Les variables sont définies directement dans les scripts npm. Pour personnaliser, modifiez les scripts dans `package.json` ou créez des fichiers `.env` et utilisez `dotenv-cli`.

### Variables principales

- `NODE_ENV` : dev | test | prod
- `DATABASE_URL` : URL de la base de données
- `PORT` : Port du serveur (défaut: 3000)
- `CORS_ORIGIN` : Origines autorisées (séparées par des virgules)
- `LOG_LEVEL` : debug | info | warn | error
- `FRONTEND_URL` : URL du frontend

## 🔧 Personnalisation

Pour utiliser des fichiers `.env`, installez `dotenv-cli` :
```bash
npm install --save-dev dotenv-cli
```

Puis modifiez les scripts pour utiliser :
```json
"start:dev": "dotenv -e .env.dev -- ts-node-dev ..."
```

Voir `docs/ENVIRONMENTS.md` pour plus de détails.

