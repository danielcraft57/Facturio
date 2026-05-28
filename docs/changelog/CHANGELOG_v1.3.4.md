# Changelog v1.3.4 — Avoirs, remboursements, soldes et fiche client (mai 2026)

## Synthèse

Cette version unifie la **comptabilité affichée** (facture, PDF, page publique, fiche client) autour d’une formule unique :

**Solde = max(0, TTC − encaissements nets − avoirs imputés)**

## Backend

- **Remboursements** : module `refunds`, annulation acompte, recalcul solde avec avoirs imputés.
- **Avoirs** : imputation plafonnée, emails, annulation facture si avoir couvre 100 %, filtre `clientId` sur la liste.
- **Factures** : `syncInvoiceFinancials`, `applyClientCredits` à la création, paiements et remboursements recalculent le solde avec les crédits.
- **Fiche client** : `GET /clients/:id/finance`, `POST …/credits`, `POST …/misc-operations`.
- **Listes** : filtre `clientId` sur factures et devis.
- **PDF** : bloc totaux avec avoir imputé et net à payer.

## Frontend

- **Fiche client** : synthèse finance (KPI, TVA, timeline, actions), UX pleine largeur, ouverture en nouvel onglet.
- **Facture détail** : décomposition Total / Avoir / Encaissé / Reste ; libellés de règlement (`Soldée par avoir`, etc.).
- **Page publique facture** : net à payer, message si soldée par avoir.
- **Compta** : panneaux Remboursements, Avoirs, Acomptes.
- **Création facture** : case « Imputer automatiquement les avoirs client ».
- **Navigation** : `openClientView`, `openCreateInvoiceForClient`, `openCreateQuoteForClient`.

## Correctifs

- Routage client : IDs publics 10 caractères (plus seulement numériques).
- Listes factures/devis client : parsing API et filtre `clientId` côté serveur.
- Paiements Stripe : `organizationId` pour le temps réel après encaissement.
- Checkout public : message si montant &lt; 0,50 € (Stripe).

## Documentation

- [FINANCE_REMBOURSEMENTS_AVOIRS.md](../modules/FINANCE_REMBOURSEMENTS_AVOIRS.md)
- Mise à jour [API.md](../api/API.md) (endpoints client finance)

## Tests

- e2e remboursements acompte (`refunds-deposit.e2e-spec.ts`)
- e2e avoirs / factures (existants, étendus)
- **e2e fiche client finance** (`clients-finance.e2e-spec.ts`) : synthèse `GET …/finance`, crédits, opérations diverses, imputation, filtres `clientId` factures/devis, imputation auto à la création — exécuté par `npm run test:e2e` en CI
