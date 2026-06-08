# Scripts serveur — exploitation

Exécution : **`cd /opt/facturio/server`** (prod) avec `.env` et `DATABASE_URL`.

**Documentation complète** : [docs/deployment/SCRIPTS_EXPLOITATION_PRODUCTION.md](../../docs/deployment/SCRIPTS_EXPLOITATION_PRODUCTION.md)

**Raccourci shell** (depuis la racine du dépôt) : [scripts/deploy/ops-facturio.sh](../../scripts/deploy/ops-facturio.sh)

## Commandes npm

| Script npm | Équivalent node |
|------------|-----------------|
| `npm run plan:show -- <cible>` | `set-organization-plan.js show` |
| `npm run plan:set -- <cible> <plan> [opts]` | `set-organization-plan.js set` |
| `npm run plan:list` | `set-organization-plan.js list` |
| `npm run invoices:usage -- <cible>` | `purge-organization-invoices.js usage` |
| `npm run invoices:list -- <cible> [filtres]` | `purge-organization-invoices.js list` |
| `npm run invoices:purge -- <cible> [filtres] --confirm` | `purge-organization-invoices.js purge` |
| `npm run user:add -- …` | `manage-user.js add` |
| `npm run user:remove -- <email>` | `manage-user.js remove` |
| `npm run user:list` | `manage-user.js list` |
| `npm run seed:catalog:prod` | Modèles catalogue `/installation` (après `build:prod`) |
| `npm run seed:prod` | Alias de `seed:catalog:prod` — **ne pas** lancer le seed dev complet en prod |

**Plans** : `free`, `pro`, `pro-efacture`, `agency` (alias `agence`).

## Fichiers

### `set-organization-plan.js` — plans SaaS

- **show** : plan, expiration, Stripe, utilisateurs
- **set** : `free` | `pro` | `pro-efacture` | `agency` + `--months`, `--expires`, `--clear-subscription`, `--dry-run`
- **list** : toutes les orgs (`--plan=PRO` pour filtrer)

```bash
node scripts/set-organization-plan.js set user@example.com agency --months=12
node scripts/set-organization-plan.js set user@example.com free --clear-subscription
```

### `purge-organization-invoices.js` — factures et quota Free

Suppression **définitive** (paiements, compta, quota mensuel). Filtres : `--stripe`, `--this-month`, `--all`, `--paid`, `--status=…`, `--ids=…`. **`--confirm`** obligatoire pour exécuter.

```bash
node scripts/purge-organization-invoices.js usage user@example.com
node scripts/purge-organization-invoices.js purge user@example.com --stripe --confirm
```

### `manage-user.js` — comptes

- **add** / **remove** / **list** — voir [DEPLOIEMENT_PRODUCTION.md](../../docs/deployment/DEPLOIEMENT_PRODUCTION.md)

### Autres

| Script | Rôle |
|--------|------|
| `test-stripe-config.js` | Vérifier clés Stripe org |
| `preview-emails.ts` | Aperçu templates email |
| `prisma-migrate-setup.mjs` | Base test / migrate setup |
