# Finance client — avoirs, remboursements et soldes

Guide fonctionnel et technique (v1.3.4+) pour les flux **avoir**, **remboursement**, **acompte/solde** et la **fiche client enrichie**.

## Vue d’ensemble

| Concept | Description |
|--------|-------------|
| **Solde facture** | `balance` = TTC − encaissements nets − avoirs imputés (`syncInvoiceFinancials`) |
| **Avoir** | Document de crédit (lignes HT/TVA/TTC), imputable sur factures du même client |
| **Crédit client** | Avoir **sans** `invoiceId`, statut `SENT`, solde disponible = `total − appliedAmount` |
| **Imputation** | `AvoirApplication` : lie un avoir à une facture, plafonnée au solde facture |
| **Remboursement** | `Refund` sur paiement (Stripe ou manuel), recalcule le solde facture |
| **Opération diverse** | Avoir marqué `OP_DIVERSE:…` dans `legalMention` (traçabilité compta) |

## Fiche client (`/clients/:id`)

- Ouverture dans un **nouvel onglet** (`openClientView`).
- Onglet **Synthèse finance** : KPI, TVA, actions, timeline filtrable.
- Onglets **Factures** / **Devis** filtrés par `clientId` (API corrigée).
- Actions : imputer un avoir, créer un crédit client, opération diverse.

### API

```http
GET  /api/clients/:id/finance
POST /api/clients/:id/credits          # crédit client (avoir libre)
POST /api/clients/:id/misc-operations  # opération diverse → avoir
POST /api/avoirs/:id/apply             # { invoiceId, amount }
```

Réponse `GET …/finance` : `balances`, `taxes`, `movements[]`, `avoirs[]`, `openInvoices[]`, `invoiceCount`, `quoteCount`.

## Factures

- Création : option `applyClientCredits` (défaut `true`) → imputation auto des crédits client disponibles.
- Affichage détail : **Total TTC**, avoir imputé, encaissé, **reste à payer** (via `balance` API).
- Statuts : `Soldée (avoir)` / `Soldée (mixte)` / `Payée` selon `settlement`.
- PDF : totaux bruts + ligne **Avoir imputé** + **Net à payer** (plus de ligne négative dans le tableau articles).

## Remboursements

- Module `server/src/refunds/` : création, Stripe, compta.
- **App (JWT)** : détail facture → Rembourser (case « via Stripe ») ; `POST /api/invoices/:id/refunds` ou `POST /api/refunds/payments/:paymentId`.
- **API publique (Bearer)** : `GET|POST /api/public/factures/:id/refunds` (scope `factures.refund` pour POST).
  - Paiement Stripe (`notes` = `stripe:pi_…`) : l'API liste d'abord les refunds Stripe ; si déjà fait → `alreadyRefundedOnStripe: true` (pas de double mouvement).
- **Annulation acompte** : `POST /api/invoices/:id/cancel-deposit` — si solde déjà payé → 2 avoirs (ACO + SOL).
- Recalcul solde : `TTC − (paiements − remboursements) − avoirs imputés`.

## Paiement Stripe différé (API publique)

Créer une facture puis encaisser plus tard :

1. `POST /api/public/factures` (sans `paidExternally`)
2. `POST /api/public/factures/:id/payment-intent` → `clientSecret` + `stripePublishableKey`
3. Stripe.js / Payment Element côté intégrateur
4. `POST /api/public/factures/:id/confirm-payment` `{ "paymentIntentId": "pi_…" }` (ou webhook)

Doc interactive : Paramètres → API → Documentation (`/api-docs`).

## Avoirs

- CRUD `/api/avoirs`, filtre `?clientId=`.
- Création depuis facture (lignes) ou crédit client libre.
- Email client à la création d’un avoir (si email connu).

## Comptabilité

- Mouvements org : `GET /api/accounting/movements` (`sale`, `payment`, `refund`, `credit_note`).
- TVA fiche client : collectée sur factures soldées ; créditée sur avoirs `SENT` / `APPLIED`.

## Frontend (fichiers clés)

| Zone | Fichiers |
|------|----------|
| Fiche client | `frontend/src/modules/clients/ClientDetailPage.tsx`, `components/ClientFinancePanel.tsx` |
| Services | `frontend/src/services/clientFinance.ts`, `avoirs.ts`, `refunds.ts` |
| Facture | `InvoiceDetailPage.tsx`, `CreateCreditNoteDialog.tsx`, `RefundPaymentDialog.tsx` |
| Compta | `AccountingPage.tsx`, `AvoirsPanel.tsx`, `RefundsPanel.tsx` |
| Navigation | `frontend/src/utils/openDocumentView.ts` |

## Tests e2e

- `server/src/refunds/refunds-deposit.e2e-spec.ts`
- `server/src/avoirs/avoirs.e2e-spec.ts`
- `server/src/invoices/invoices.e2e-spec.ts` (crédits / soldes)
