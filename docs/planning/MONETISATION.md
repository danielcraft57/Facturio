# Monétisation — Méthode économique (bootstrap)

Stratégie pour **rentabiliser Facturio** avec des coûts fixes bas, en s’appuyant sur le positionnement [prestations services numériques](./POSITIONNEMENT_PRESTATIONS_SERVICES.md) et l’écosystème DanielCraft.

**Principe** : ne pas concurrencer Pennylane / Sage sur la compta complète ; vendre un **outil vertical léger** que le prestataire dev/auto utilise tous les jours, avec des revenus récurrents modestes mais cumulables.

**Dernière mise à jour** : mai 2026.

---

## Objectif financier réaliste

| Horizon | Cible indicative | Hypothèse |
|---------|------------------|-----------|
| **6 mois** | Outil rentable pour **usage interne** (DanielCraft) | 0 € de logiciel facturation tiers |
| **12 mois** | **50–150 € MRR** | 10–30 utilisateurs payants à 5–15 €/mois ou 2–5 à 29 €/mois |
| **18–24 mois** | **500–1 500 € MRR** | Effet réforme sept. 2026 + niche dev/auto |

Ces ordres de grandeur supposent **pas d’embauche**, infra mutualisée et **pas d’immatriculation PA** (voir [FACTURATION_ELECTRONIQUE_2026.md](./FACTURATION_ELECTRONIQUE_2026.md)).

---

## Méthode recommandée : « Vertical + récurrence légère »

Modèle **hybride** à faible coût d’exploitation :

```
┌─────────────────────────────────────────────────────────────┐
│  Gratuit (acquisition)     │  Payant (marge)               │
│  · Dogfooding DanielCraft  │  · Abonnement SaaS Facturio    │
│  · Plan Free limité        │  · Module e-facture (2026)     │
│  · Contenu site / SEO      │  · Packs catalogue premium     │
│  · Self-host optionnel     │  · Commission PA (si partenaire)│
└─────────────────────────────────────────────────────────────┘
```

### 1. Dogfooding (coût marginal ≈ 0 €)

**Utiliser Facturio pour toutes les factures DanielCraft** (devis, acomptes, maintenance, packs IA).

- Supprime un abonnement concurrent (often 15–40 €/mois + % paiement).
- Améliore le produit par l’usage réel.
- Le site [danielcraft.fr](https://danielcraft.fr) devient **vitrine** : « facturé avec Facturio » + lien démo.

→ Premier levier de rentabilité : **économie directe**, pas seulement revenus.

### 2. SaaS freemium par paliers (deux Stripe distincts)

| Usage | Où sont les clés | Webhook |
|-------|------------------|---------|
| **Abonnement Facturio** (Pro, Pro+e-facture) | `.env` `STRIPE_*` (compte DanielCraft) | `POST /api/webhooks/stripe/platform` |
| **Paiement des factures clients** | BDD `Organization.invoiceStripe*` (compte du prestataire) | `POST /api/webhooks/stripe/invoices/:organizationId` |

Séparation **RGPD** : le payeur d’une facture est en relation avec le prestataire via **son** Stripe ; Facturio ne centralise pas les paiements clients sur le compte plateforme.

Checkout Pro : `POST /api/billing/checkout` + UI **Paramètres → Abonnement Facturio**.

| Palier | Prix indicatif | Inclus | Rôle |
|--------|----------------|--------|------|
| **Free** | 0 € | 5–10 factures/mois, 1 org, PDF, catalogue seed | Acquisition, micro-prestataires |
| **Pro** | **9–15 €/mois** | Factures illimitées, devis, clients, exports | Cœur de marge |
| **Pro + e-facture** | **19–29 €/mois** | Connexion PA, Factur-X, statuts (post-2026) | Levier réglementaire |
| **Agence** | **49–79 €/mois** | Multi-utilisateurs, marque blanche légère, support prioritaire | ARPU plus élevé, peu de clients |

**Économique parce que** : pas de force commerciale ; onboarding self-service ; support asynchrone (doc + email).

### 3. Packs catalogue premium (revenu ponctuel, faible maintenance)

Vendre des **imports de catalogue** au-delà du seed DanielCraft :

- Pack « Agence web » (30 prestations typées)
- Pack « Automatisation n8n / Make »
- Pack « Maintenance & SLA »

**5–29 €** achat unique ou **+3 €/mois** sur le palier Pro.

Coût de production : une fois le format seed défini (`danielcraft-prestations.data.ts`), duplication = fichiers JSON + page boutique simple.

### 4. Partenariat Plateforme Agréée (éviter le coût PA)

Plutôt que s’immatriculer PA (~ISO 27001, audits) :

- Négocier avec une **PA partenaire** : **commission** ou **marge revendeur** sur chaque client Facturio routé (souvent 10–30 % du abonnement PA, selon contrat).
- Facturio facture le **logiciel métier** ; la PA facture le **canal réglementaire** (ou forfait bundle affiché au client).

→ Revenus sans lourd investissement conformité.

### 5. Entonnoir depuis DanielCraft (CAC ≈ 0)

| Étape | Action | Coût |
|-------|--------|------|
| Contenu | Articles « facturer une prestation dev », « réforme 2026 auto-entrepreneur » | Temps rédaction |
| Site | CTA « Essayer Facturio » depuis pages prestations | Lien existant |
| Preuve | Études de cas : devis site vitrine → facture en 2 clics | Screenshots |
| Email | Liste clients DanielCraft → bêta Facturio | Outil email déjà là |

Pas de pub payante au départ.

### 6. Self-host / open core (optionnel, long terme)

- **Core** open source ou source disponible → confiance, contributions.
- **Hébergé** payant (Pro) → marge sur l’infra (~5–10 €/mois de coût serveur par tranche d’utilisateurs actifs).

Réduit le support « installation » tout en gardant une porte d’entrée gratuite pour les développeurs (ambassadeurs).

---

## Ce qu’il faut éviter (anti-patterns coûteux)

| À éviter | Pourquoi |
|----------|----------|
| Devenir **PA** soi-même en premier | Coût et délai >> revenus early-stage |
| Concurrencer la **compta complète** | Support et scope explosent |
| Pub Google générique « facturation » | CPC élevé, CAC incompatible avec 15 €/mois |
| Support téléphonique 7j/7 | Temps non rentabilisé sur petits paniers |
| Trop de paliers / options | Complexité commerciale et technique |

---

## Structure de coûts cible (rester rentable)

| Poste | Cible bootstrap |
|-------|-----------------|
| Hébergement (API + DB + front) | **15–40 €/mois** (VPS / petit PaaS) |
| Stripe | ~1,5 % + 0,25 € par encaissement client final |
| PA partenaire | Refacturé ou incluse dans palier Pro+ |
| Domaine + email | **< 10 €/mois** |
| Temps dev | Propriétaire (DanielCraft) — pas de salaire imputé au début |

**Seuil de rentabilité logiciel** (hors temps) : ~**30–50 € MRR** couvrent infra + marge minimale.

---

## Calendrier aligné produit & réforme

| Période | Produit | Monétisation |
|---------|---------|--------------|
| **Maintenant** | Dogfooding DanielCraft, catalogue, devis/PDF | Économie outils tiers |
| **Q3 2026** | MVP e-facture + PA partenaire | Palier **Pro + e-facture** (argument urgence sept. 2026) |
| **Q4 2026** | Modèles devis par métier, missions | Packs catalogue premium |
| **2027** | PME, réception fournisseurs | Montée en charge palier Pro sans hausse prix initiale |

La **réforme 2026** est un **levier commercial** naturel pour le vertical dev/auto (clients B2B, ETI) sans publicité payante : contenu éducatif + peur de non-conformité + solution déjà dans leur outil métier.

---

## Indicateurs à suivre

| Métrique | Usage |
|----------|--------|
| **MRR / ARR** | Santé abonnements Facturio |
| **Coût infra / MRR** | Doit rester **< 30 %** |
| **Conversion Free → Pro** | Cible 5–15 % à 12 mois |
| **Churn mensuel** | Cible **< 5 %** sur niche |
| **Factures émises / org actif** | Engagement produit |
| **CAC** | Temps contenu + SEO ; viser **< 20 €** |
| **LTV** | Pro 15 € × 18 mois ≈ **270 €** (objectif) |

Module abonnements existant : `server/src/subscriptions/` — brancher métriques MRR déjà prévues en roadmap v1.1.

---

## Synthèse en une phrase

**Rentabiliser Facturio de façon économique** = l’utiliser soi-même pour DanielCraft, vendre un **SaaS Pro à 9–29 €/mois** aux prestataires dev/auto via le site et le SEO, ajouter des **packs catalogue** à faible coût, et **monétiser la conformité 2026** via un palier e-facture + partenariat PA — sans devenir plateforme agréée ni lancer une force de vente.

---

## Site public marketing (implémenté)

Pages Vite / React accessibles sans authentification :

| Route | Contenu |
|-------|---------|
| `/` | Accueil (positionnement, réforme 2026, tarifs, CTA) |
| `/prestations` | Vertical dev web, auto, maintenance |
| `/fonctionnalites` | Fonctionnalités produit |
| `/facturation-electronique` | Réforme B2B 2026–2027 |
| `/tarifs` | Paliers Free / Pro / Pro+e-facture / Agence |
| `/legal`, `/privacy`, `/terms` | Pages légales (placeholders) |

Code : `frontend/src/modules/marketing/`.

Visuels : `frontend/public/images/` (`facturio-hero.png`, `facturio-prestations.png`, `facturio-efacture.png`, `facturio-pricing.png`, `facturio-workflow.png`). Animations : `ScrollReveal`, `AnimatedCounter`, `HeroDashboardMock`, `FloatingOrbs`.

---

## Mise en œuvre avec l’existant (limiter l’accès)

**Oui, on limite l’accès** sur le plan Free — c’est le cœur du freemium. Voici comment le brancher **sans tout réécrire** :

### Ce qui existe déjà dans Facturio

| Outil | Rôle monétisation |
|-------|-------------------|
| **`Organization` + auth JWT** | Chaque compte = une org ; c’est le tenant à facturer |
| **`Subscription` / `Plan`** (module `subscriptions/`) | Abonnements **de vos clients** (maintenance chez un client) — **≠** abonnement Facturio SaaS |
| **Stripe** (`stripe/`) | Paiement des **factures que vous émettez** — réutilisable plus tard pour **Facturio Billing** (checkout Pro) |
| **Factures / devis / produits** | Volume à compter pour le quota Free |
| **Site public `/tarifs`** | Conversion → inscription |

### Ce qui a été ajouté (SaaS Facturio)

| Élément | Fichier |
|---------|---------|
| Plan org `saasPlan` | `Organization.saasPlan` : `FREE` \| `PRO` \| `PRO_EFACTURE` \| `AGENCY` |
| Limites par plan | `server/src/billing/saas-plan.limits.ts` |
| Quota factures / mois | `BillingService.assertCanCreateInvoice()` appelé dans `InvoicesService.create` |
| API usage | `GET /api/billing/usage` |
| Bannière app | `BillingUsageBanner` (plan Free uniquement) |

**Plan Free** : **10 factures / mois** → au-delà, erreur HTTP 403 et message « Passer Pro ».

**Plans payants** : `maxInvoicesPerMonth: null` (illimité). Checkout Stripe plateforme + webhook met à jour `saasPlan`, `stripeCustomerId`, `stripeSubscriptionId`.

### Passer une org en Pro (manuel, jusqu’à Stripe Billing)

```sql
UPDATE Organization SET saasPlan = 'PRO' WHERE id = 1;
```

Ou via Prisma Studio après migration `20260519120000_organization_saas_billing_plan`.

### Prochaines briques (sans nouveau gros module)

1. ~~**Stripe Checkout** plateforme~~ → fait (mai 2026) ; produits/prix Stripe récurrents optionnels plus tard
2. ~~**Chiffrement** des `invoiceStripeSecretKey` en BDD~~ → fait (`SECRETS_ENCRYPTION_KEY`)
3. ~~**Garde prospection** plan FREE~~ → fait (API + bannière app)
3. **Garde e-facture** : module PA uniquement si `PRO_EFACTURE` ou `AGENCY`
4. **Dogfooding** : org DanielCraft en `PRO` ou `PRO_EFACTURE` pour usage interne illimité

### Distinction importante

- **`subscriptions` (existant)** = vous facturez **vos clients** (maintenance, SaaS livré).
- **`saasPlan` (nouveau)** = **vous payez Facturio** pour utiliser l’application.

Les deux coexistent : DanielCraft peut être en plan Pro Facturio tout en gérant des abonnements clients dans le même outil.

## Tâches (à cocher)

- [x] Pages tarifs et accueil marketing sur le frontend
- [x] Quota Free (10 factures/mois) + API `GET /billing/usage` + bannière app
- [x] Checkout Stripe plateforme (Pro / Pro+e-facture) + clés Stripe factures par org
- [x] Chiffrement secrets Stripe org (`enc:v1:`) + garde prospection plan Free
- [ ] DPA sous-traitants documentés (Stripe, SMTP, ProspectLab)
- [ ] Lien CTA depuis danielcraft.fr vers `https://…/tarifs`
- [ ] Mention « Propulsé par Facturio » sur PDF / page publique facture (option branding)
- [ ] Négocier accord commission ou bundle avec une PA short-listée
- [ ] Rédiger 2 articles SEO (réforme 2026 + facturation prestation dev)
- [ ] Définir limites techniques du plan Free (middleware quotas)

---

## Liens

- [Positionnement prestations](./POSITIONNEMENT_PRESTATIONS_SERVICES.md)
- [Facturation électronique 2026](./FACTURATION_ELECTRONIQUE_2026.md)
- [Paiement en ligne](../paiement-en-ligne.md) (Stripe factures clients)
- [Roadmap](./ROADMAP.md)
- [TODO — monétisation](./TODO.md#-monétisation-bootstrap)
