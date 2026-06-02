# Scripts serveur

## manage-user.js

Script de gestion des utilisateurs en production (ajout, suppression, liste). A deployer avec l'application ; a executer sur le serveur dans `/opt/facturio/server` avec le `.env` et `DATABASE_URL` configurés.

- **add** : cree une organisation et un utilisateur (status ACTIVE, role ADMIN par defaut).
- **remove** : supprime l'utilisateur par email ; si l'organisation n'a plus d'utilisateur, elle est supprimee.
- **list** : affiche la liste des utilisateurs.

Voir `docs/deployment/DEPLOIEMENT_PRODUCTION.md` (section "Gestion des utilisateurs en production") pour les exemples de commandes.

## set-organization-plan.js

Changement manuel du plan SaaS (`FREE`, `PRO`, `PRO_EFACTURE`, `AGENCY`) d'une organisation, par email utilisateur ou `org:ID`.

- **show** : affiche plan, expiration, Stripe, utilisateurs de l'org.
- **set** : applique le plan (`--months`, `--expires`, `--clear-subscription`, `--dry-run`).
- **list** : liste les organisations (`--plan=PRO` pour filtrer).

```bash
node scripts/set-organization-plan.js show user@example.com
node scripts/set-organization-plan.js set user@example.com pro
node scripts/set-organization-plan.js set user@example.com free --clear-subscription
npm run plan:set -- user@example.com pro-efacture --months=12
```

Voir `docs/deployment/DEPLOIEMENT_PRODUCTION.md` (section « Plans SaaS en production »).
