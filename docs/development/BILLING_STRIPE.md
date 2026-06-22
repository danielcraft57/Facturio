# Abonnements PrestaFacture (Stripe plateforme)

## Flux

1. **Checkout** — `POST /api/billing/checkout` avec corps JSON :
   - `plan` : `"PRO"` | `"PRO_EFACTURE"`
   - `billingSchedule` (optionnel, défaut `MONTHLY`) :
     - `MONTHLY` — abonnement Stripe, facturation **chaque mois** (prélèvements automatiques).
     - `QUARTERLY` — facturation **tous les 3 mois** (`recurring.interval_count = 3`), montant = 3 × tarif mensuel.
     - `BIANNUAL` — facturation **tous les 6 mois** (`interval_count = 6`), montant = 6 × tarif mensuel.
     - `YEARLY_UPFRONT` — **paiement unique** pour 12 mois d’accès (`mode: payment`), sans abonnement récurrent Stripe ; fin d’accès = +1 an en base (`saasPlanExpiresAt`).
2. **Retour** — `/parametres/abonnement?billing=success&plan=PRO` (configurable via `BILLING_CHECKOUT_*`). Le front appelle **`POST /api/billing/sync-after-checkout`** pour mettre à jour le plan sans attendre le webhook (utile en dev sans `stripe listen`).
3. **Webhook unifié** — `POST /api/webhooks/stripe` (alias `/webhooks/stripe/platform`). Signature `STRIPE_WEBHOOK_SECRET` (.env) pour l’abonnement ; le même endpoint enregistre aussi les **factures clients payées** (`payment_intent.succeeded` avec `metadata.invoiceId`), y compris si le prestataire pointe la même URL depuis son compte Stripe (secret `whsec_` en BDD).
4. **Portail** — `POST /api/billing/portal` → Customer Portal Stripe (gérer CB, **annuler** l’abonnement récurrent, télécharger les factures).
5. **Sync** — `POST /api/billing/sync-subscription` à l’ouverture de la page abonnement : lit Stripe (`cancel_at_period_end`, fin de période, etc.).

### Résiliation « en fin de période » (Stripe)

Quand l’utilisateur annule dans le portail, Stripe garde l’abonnement **actif** jusqu’à la fin de la période déjà payée (`cancel_at_period_end: true`). PrestaFacture enregistre le statut `cancel_at_period_end` : l’UI affiche **Résiliation programmée** et la date de fin d’accès ; **aucun email « abonnement terminé »** tant que le mois payé n’est pas écoulé. À la fin de période, webhook `customer.subscription.deleted` → repasse en plan Free.

## Moyens de paiement Checkout

- Par défaut : **carte + PayPal** (`STRIPE_CHECKOUT_PAYMENT_METHODS=card,paypal`) — **pas de Klarna**.
- Activer **PayPal** dans le [Dashboard Stripe](https://dashboard.stripe.com/settings/payment_methods) (environnement test et live).
- **Link** masqué côté API ; les boutons Amazon Pay / Link en test viennent souvent du Dashboard tant que ces moyens ne sont pas désactivés.

## Client & formulaire Checkout

- Avant la session, le serveur met à jour le **Customer Stripe** (`cus_…`) : email, nom, téléphone, adresse org si renseignée — **données enregistrées chez Stripe** (préremplissage email sur Checkout).
- Après paiement, le **moyen de paiement** (carte ou PayPal) est attaché au client pour les prélèvements d’abonnement.
- La page est **hébergée par Stripe** (pas de HTML custom) ; personnalisation via `branding_settings`, Dashboard et fiche org PrestaFacture.
- `billing_address_collection: required` + `customer_update` pour compléter / corriger sur Checkout.
- **Style** : `branding_settings` (`display_name`, `border_style`, `font_family`, logo optionnel) et `custom_text.submit` ; variables `STRIPE_CHECKOUT_*` (voir `server/env.example`). Logo : uploader un fichier via l’[API Files Stripe](https://docs.stripe.com/api/files) puis renseigner `STRIPE_CHECKOUT_LOGO_FILE_ID=file_…`.
- Référence Stripe : [Customize Checkout](https://docs.stripe.com/payments/checkout/customize).

## Base de données

- `Organization.saasPlan`, `saasSubscriptionStatus`, `saasPlanExpiresAt`, `stripeCustomerId`, `stripeSubscriptionId`
- `StripePlatformEvent` — idempotence webhooks (`eventId` unique)

## Emails transactionnels

Expéditeur par défaut : `MAIL_FROM_SUBSCRIPTION` (sinon `MAIL_FROM_INVOICE`, ex. `facture@danielcraft.fr` ou `abonnement@danielcraft.fr`).

- Abonnement activé (`sendSubscriptionActivated`)
- **Facture abonnement + PDF** (`sendSubscriptionInvoice`) — webhook `invoice.paid` et premier paiement après checkout
- Paiement échoué (`sendSubscriptionPaymentFailed`)
- Abonnement terminé (`sendSubscriptionCanceled`)

## Tests locaux

```bash
# Terminal 1 — API
cd server && npm run start:dev

# Terminal 2 — Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Terminal 3 — tests unitaires
cd server && npm test -- platform-stripe.service.spec
cd frontend && npm test -- billing.test
```

## Variables `.env` (plateforme)

Voir `server/env.example` : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `BILLING_CHECKOUT_SUCCESS_URL`, `BILLING_CHECKOUT_CANCEL_URL`, `STRIPE_CHECKOUT_DISPLAY_NAME`, `STRIPE_CHECKOUT_BORDER_STYLE` (ou l’ancien `STRIPE_CHECKOUT_BORDER_RADIUS` — valeur envoyée à Stripe sous **`border_style`**), `STRIPE_CHECKOUT_FONT_FAMILY`, `STRIPE_CHECKOUT_LOGO_FILE_ID`.
