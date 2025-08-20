## Facturio
[![CI](https://github.com/loupix/Facturio/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/loupix/Facturio/actions/workflows/ci.yml) [![Coverage](https://img.shields.io/codecov/c/github/loupix/Facturio?token=&branch=main)](https://app.codecov.io/gh/loupix/Facturio) [![Node](https://img.shields.io/badge/node-20.x-339933?logo=nodedotjs&logoColor=white)](https://github.com/loupix/Facturio/actions/workflows/ci.yml)

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


### Comptabilité (nouveau)
- Plan comptable minimal seedé (512, 411, 706, 44571, 44566, 606, 615, 622, 641, 645, 421, 431, 635, 447) et journaux `VE` (ventes), `BQ` (banque), `OD`.
- Écritures automatiques:
  - Vente: 411/706/44571 à la création de facture
  - Encaissement: 512/411 au paiement
  - Achats services: 622/44566/401 et paiement fournisseur: 401/512
  - Paie: 641/645 au débit, 421/431 au crédit; paiement URSSAF: 431/512
  - Contributions: micro-social (CA x taux) 645/431, C3S 635/447
- Endpoints clés:
  - Comptes, journaux, écritures: `GET/POST /accounting/*`
  - Rapports: Balance `GET /accounting/reports/balance`, Grand livre `GET /accounting/reports/general-ledger?account=706`
  - Export FEC: `GET /accounting/exports/fec?start=YYYY-MM-DD&end=YYYY-MM-DD`
  - Prestataires: `POST /accounting/purchases/service`, `POST /accounting/payments/service`
  - Paie/URSSAF: `POST /accounting/payroll`, `POST /accounting/payments/urssaf`
  - Contributions: `POST /accounting/contrib/micro-social`, `POST /accounting/contrib/c3s`

- Devis (hors-bilan): à l'envoi d'un devis, une écriture DRAFT est enregistrée dans `OD` (706/44571/411). En cas de rejet/expiration, une contre-passation est créée automatiquement.
