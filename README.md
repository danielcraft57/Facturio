## Facturio

API de facturation pensée pour SaaS et apps. On gère clients, produits, abonnements, devis, factures, paiements, TVA (FR/UE) et déclarations.

### Démarrage rapide
Pré-requis: Node 20+ et npm.
```bash
cd server
npm i
npx prisma migrate dev
npm run seed # optionnel (taux de TVA FR)
npm run start:dev
```
Plus de détails: voir `server/README.md`.

### Docs utiles
- Backend: `server/README.md`
- Roadmap globale: `ROADMAP.md`
- Roadmap serveur: `server/ROADMAP.md`

### UI & thèmes
Une démo statique des thèmes est disponible dans `ui/`:
- Ouvrir `ui/index.html` dans le navigateur
- Thèmes: Minimal Pro, Moderne chaleureux, Énergique, Business sombre
- Fichiers: `ui/theme-*.css` et `ui/theme-base.css`

### Structure
```
Facturio/
  server/
    src/...
    prisma/...
  ui/
    index.html
    theme-*.css
```

Pour le détail des endpoints, exemples cURL, règles TVA et configuration (CORS, env, Postgres), référez-vous à `server/README.md`. 


