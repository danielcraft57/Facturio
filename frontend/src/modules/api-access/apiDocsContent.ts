/** Documentation API publique PrestaFacture (contenu structuré). */

import { resolveApiBaseUrl } from '../../utils/resolveApiBaseUrl'

/** Corrige d’anciennes bases documentées en /v1 au lieu de /api. */
export function normalizeApiBaseUrl(base: string): string {
  const trimmed = base.replace(/\/$/, '')
  if (/\/v1$/i.test(trimmed)) return trimmed.replace(/\/v1$/i, '/api')
  return trimmed
}

/** URL de base affichée dans la doc (alignée sur resolveApiBaseUrl + origine du navigateur). */
export function getApiBaseUrl(): string {
  const resolved = normalizeApiBaseUrl(resolveApiBaseUrl())
  if (/^https?:\/\//i.test(resolved)) return resolved
  if (typeof window !== 'undefined' && window.location?.origin) {
    const path = resolved.startsWith('/') ? resolved : `/${resolved}`
    return `${window.location.origin}${path}`
  }
  return resolved || '/api'
}

export function formatDocUrl(base: string, path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${normalizeApiBaseUrl(base)}${p}`
}

export type ApiDocEndpoint = {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  path: string
  scope: string
  desc: string
  queryParams?: string
  requestBody?: string
  responseHint?: string
}

export type ApiDocSection = {
  id: string
  title: string
  body?: string
  scopes?: readonly string[]
  endpoints?: ApiDocEndpoint[]
  exampleBody?: string
  exampleCurl?: {
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
    path: string
    sendExample?: { path: string; body: string }
  }
  workflow?: { title: string; steps: readonly string[] }
}

export const API_SCOPES_REFERENCE = [
  { id: 'clients.read', label: 'Lire les clients', resource: 'Clients' },
  { id: 'clients.write', label: 'Créer / modifier / supprimer des clients', resource: 'Clients' },
  { id: 'produits.read', label: 'Lire le catalogue produits', resource: 'Produits' },
  { id: 'produits.write', label: 'Créer / modifier / supprimer des produits', resource: 'Produits' },
  { id: 'factures.read', label: 'Lister et consulter les factures', resource: 'Factures' },
  { id: 'factures.write', label: 'Créer et modifier des factures', resource: 'Factures' },
  { id: 'factures.send', label: 'Envoyer une facture par email (PDF)', resource: 'Factures' },
  { id: 'factures.refund', label: 'Rembourser une facture (Stripe ou manuel)', resource: 'Factures' },
  { id: 'devis.read', label: 'Lister et consulter les devis', resource: 'Devis' },
  { id: 'devis.write', label: 'Créer et modifier des devis', resource: 'Devis' },
  { id: 'devis.send', label: 'Envoyer un devis par email', resource: 'Devis' },
] as const

export const API_ERROR_CODES = [
  { status: 401, meaning: 'Jeton absent, invalide ou révoqué' },
  { status: 403, meaning: 'Jeton valide mais scope insuffisant (ex. factures.send manquant)' },
  { status: 400, meaning: 'Corps JSON invalide ou règle métier (email manquant, lignes vides…)' },
  { status: 404, meaning: 'Ressource introuvable ou hors de votre organisation' },
  { status: 409, meaning: 'Conflit (ex. paiement déjà remboursé côté Stripe)' },
  { status: 429, meaning: 'Trop de requêtes (rate limit routes publiques)' },
] as const

export const API_WORKFLOWS = [
  {
    id: 'paid-external',
    title: 'Commande déjà payée (autre site) + email justificatif',
    steps: [
      'Jeton avec factures.read, factures.write et factures.send.',
      'POST /api/public/factures — paidExternally: true, clientEmail, lines[] (taxRate : 0.2 ou 20 pour 20 %).',
      'Réponse : id, status PAID, balance 0.',
      'POST /api/public/factures/:id/send — { "email": "…", "updateClientEmail": true }.',
      'Réponse : emailSent true, alreadyPaid true (PDF sans lien de paiement).',
    ],
  },
  {
    id: 'classic',
    title: 'Facture à encaisser + email avec lien de paiement',
    steps: [
      'POST /api/public/factures — clientId ou clientEmail + lines[] (sans paidExternally).',
      'POST /api/public/factures/:id/send — le client reçoit le PDF ; lien Stripe si configuré.',
    ],
  },
  {
    id: 'stripe-pay-later',
    title: 'Créer une facture puis encaisser avec Stripe (API)',
    steps: [
      'Jeton avec factures.write (+ factures.read recommandé). Clés Stripe prestataire configurées dans Paramètres.',
      'POST /api/public/factures — clientEmail + lines[] (sans paidExternally) → facture DRAFT / solde dû.',
      'POST /api/public/factures/:id/payment-intent → clientSecret, stripePublishableKey, paymentIntentId.',
      'Côté client : Stripe.js / Payment Element avec le clientSecret.',
      'Après succès : POST /api/public/factures/:id/confirm-payment — { "paymentIntentId": "pi_…" } (ou laisser le webhook Stripe enregistrer le paiement).',
      'Alternative sans Stripe.js : POST …/send pour envoyer le lien de paiement au client.',
    ],
  },
  {
    id: 'invoice-refund',
    title: 'Rembourser une facture payée (Stripe)',
    steps: [
      'Jeton avec factures.refund (et factures.read pour lister).',
      'GET /api/public/factures/:id — repérer le paymentId (notes stripe:pi_…).',
      'POST /api/public/factures/:id/refunds — { "amount": 120, "paymentId": 42 } (refundViaStripe true par défaut si paiement Stripe).',
      'L’API vérifie d’abord sur Stripe si le remboursement existe déjà (pas de double refund).',
      'Réponse : id remboursement, stripeRefundId ; alreadyRefundedOnStripe true si déjà fait côté Stripe.',
    ],
  },
  {
    id: 'quote-send',
    title: 'Devis + envoi email (accepter / refuser)',
    steps: [
      'Jeton avec devis.read, devis.write, devis.send et clients.read ou clients.write.',
      'POST /api/public/clients (ou réutiliser un clientId string existant).',
      'POST /api/public/devis — clientId (string), lines[] (voir parcours ci-dessous).',
      'POST /api/public/devis/:id/send — le client reçoit le PDF avec liens accepter / refuser.',
    ],
  },
  {
    id: 'quote-product-id',
    title: 'Devis avec produit catalogue (productId)',
    steps: [
      'Jeton avec devis.write (+ clients.read ou clients.write pour le client).',
      'Lister ou créer un produit : GET /api/public/produits ou POST /api/public/produits.',
      'POST /api/public/devis — lines: [{ "productId": 42, "quantity": 1 }] (description et unitPrice optionnels, déduits du catalogue).',
      'Le productId doit exister dans votre organisation (jeton Paramètres → API).',
    ],
  },
  {
    id: 'quote-product-sku',
    title: 'Devis avec produit get-or-create (productSku) + envoi',
    steps: [
      'Jeton avec devis.write, devis.send (+ clients.read ou clients.write).',
      'POST /api/public/devis — lines: [{ "productSku": "AUDIT-WP", "description": "Audit WordPress", "quantity": 1, "unitPrice": 890, "taxRate": 0.2 }].',
      '1er appel : produit créé dans le catalogue (visuel aléatoire) + ligne de devis liée.',
      'POST /api/public/devis/:id/send — PDF par email ; le client reçoit les liens accepter / refuser (publicToken).',
      '2e devis avec le même productSku : réutilise le produit (prix catalogue si unitPrice omis).',
      'Script complet : scripts/windows/test-devis-produit.ps1 (-Action Full = envoi + acceptation).',
    ],
  },
  {
    id: 'catalog-import',
    title: 'Import catalogue (nombreux produits)',
    steps: [
      'Préférer POST /api/products en session (JWT) pour un import massif sans rate limit API publique.',
      'Via API publique : POST /api/public/produits — espacer les appels (60 req / IP / 15 min sur /api/public/*).',
      'Recherche avant création : GET /api/public/produits?search=MON-SKU pour éviter les doublons.',
      'Visuel omis → icône + dégradé ou image bibliothèque tirés au hasard.',
    ],
  },
  {
    id: 'deliverables-catalog',
    title: 'Catalogue livrables (tarif / durée réutilisables)',
    steps: [
      'Jeton avec produits.read (recherche) et produits.write (enregistrement via produit).',
      'GET /api/public/produits/livrables/catalog?q=wordpress — suggestions avec defaultAmount et defaultHours.',
      'POST ou PATCH /api/public/produits — details: [{ "label": "…", "amount": 1200, "hours": 16 }] indexe chaque livrable libellé.',
      'Prochain produit : même libellé retrouvé via GET livrables/catalog ; réutiliser amount/hours comme valeurs par défaut.',
    ],
  },
] as const

/** Couleurs du sommaire (une teinte par section de la référence). */
export const API_DOC_SECTION_COLORS: Record<string, string> = {
  overview: '#64748b',
  auth: '#6366f1',
  'paid-externe': '#059669',
  'stripe-pay': '#0d9488',
  refunds: '#e11d48',
  pagination: '#8b5cf6',
  clients: '#0ea5e9',
  produits: '#f59e0b',
  livrables: '#db2777',
  factures: '#2563eb',
  devis: '#14b8a6',
  'catalog-import': '#dc2626',
}

export function getApiDocSectionColor(sectionId: string): string {
  return API_DOC_SECTION_COLORS[sectionId] ?? '#64748b'
}

/** Sections affichées dans l’onglet Référence (sommaire + contenu). */
export const API_DOC_SECTIONS: ApiDocSection[] = [
  {
    id: 'overview',
    title: 'Vue d’ensemble',
    body: `L’API publique permet d’intégrer clients, produits, devis et factures (e-commerce, scripts, n8n…).

• Préfixe : /api/public/…
• Auth : Authorization: Bearer fact_… (jetons dans Paramètres → API — Jetons)
• Format : JSON UTF-8

Plan requis : Pro (ou supérieur). Les jetons sur un compte Free renvoient une erreur d’auth.

En local : http://localhost:3000/api (backend direct) ou http://localhost:5173/api (proxy Vite). Jeton de démo après seed : fact_seed_dev_demo_do_not_use_in_prod (organisation seed en Pro).

Rate limit : 60 requêtes / IP / 15 min sur les routes /api/public/* (import catalogue : espacer les appels ou utiliser POST /api/products en session).

Les pages client (/public/invoices/:token, etc.) sont distinctes et ne utilisent pas le jeton API.

L’application web (Factures, Devis, Catalogue produits) se met à jour en temps réel via SSE : GET /api/realtime/stream (session JWT, hors jeton API). Un produit créé ou modifié via l’API déclenche toast + notification + rafraîchissement du catalogue.`,
  },
  {
    id: 'auth',
    title: 'Authentification',
    body: `1. Créez un jeton avec les scopes minimaux nécessaires.
2. Copiez le jeton fact_… (affiché une seule fois).
3. En-tête obligatoire : Authorization: Bearer fact_VOTRE_JETON

Test : GET /api/public → résumé des ressources.`,
    exampleCurl: { method: 'GET', path: '/public' },
  },
  {
    id: 'paid-externe',
    title: 'Paiement externe + envoi email',
    scopes: ['factures.read', 'factures.write', 'factures.send'],
    body: `Cas typique : commande réglée sur WooCommerce, Shopify, etc. PrestaFacture enregistre la facture comme payée puis envoie le PDF par email.

Étape A — créer la facture (paidExternally: true).
Étape B — envoyer (remplacer :id par l’id renvoyé à l’étape A).

taxRate : décimal 0.2 = 20 %. Un entier 20 est aussi accepté (converti en 0.2).

Sous Windows, préférez un fichier JSON avec curl.exe -d @fichier.json ou PowerShell Invoke-RestMethod.`,
    endpoints: [
      {
        method: 'POST',
        path: '/public/factures',
        scope: 'factures.write',
        desc: 'Créer facture déjà payée',
        requestBody: 'paidExternally, clientEmail, lines[], externalPaymentMethod (optionnel)',
        responseHint: '201 — id, status PAID, balance 0',
      },
      {
        method: 'POST',
        path: '/public/factures/:id/send',
        scope: 'factures.send',
        desc: 'Envoyer le justificatif PDF',
        requestBody: '{ "email": "client@exemple.com", "updateClientEmail": true }',
        responseHint: 'emailSent, alreadyPaid: true',
      },
    ],
    exampleBody: `{
  "clientEmail": "client@boutique.fr",
  "clientName": "Client Boutique",
  "paidExternally": true,
  "externalPaymentMethod": "WooCommerce",
  "externalPaymentDate": "2026-05-22",
  "currency": "EUR",
  "lines": [
    {
      "description": "Commande #4521",
      "quantity": 1,
      "unitPrice": 149.99,
      "taxRate": 0.2
    }
  ]
}`,
    exampleCurl: {
      method: 'POST',
      path: '/public/factures',
      sendExample: {
        path: '/public/factures/:id/send',
        body: '{"email":"client@boutique.fr","updateClientEmail":true}',
      },
    },
    workflow: API_WORKFLOWS[0],
  },
  {
    id: 'stripe-pay',
    title: 'Paiement Stripe différé (API)',
    scopes: ['factures.read', 'factures.write'],
    body: `Créer une facture impayée puis encaisser plus tard avec Stripe.js (Payment Element), sans passer par l’email client.

Prérequis : clés Stripe prestataire dans Paramètres → Paiements.

Le webhook Stripe (ou confirm-payment) enregistre le paiement localement. Ne pas utiliser paidExternally si vous voulez encaisser via Stripe.`,
    endpoints: [
      {
        method: 'POST',
        path: '/public/factures',
        scope: 'factures.write',
        desc: 'Créer facture à encaisser',
        requestBody: 'clientEmail, lines[] (sans paidExternally)',
      },
      {
        method: 'POST',
        path: '/public/factures/:id/payment-intent',
        scope: 'factures.write',
        desc: 'Créer le PaymentIntent Stripe',
        responseHint: 'clientSecret, stripePublishableKey, paymentIntentId, amount',
      },
      {
        method: 'POST',
        path: '/public/factures/:id/confirm-payment',
        scope: 'factures.write',
        desc: 'Confirmer après succès Stripe.js',
        requestBody: '{ "paymentIntentId": "pi_…" }',
        responseHint: '{ ok: true, invoiceId }',
      },
    ],
    exampleBody: `{
  "clientEmail": "client@exemple.com",
  "clientName": "Client Exemple",
  "lines": [
    { "description": "Prestation", "quantity": 1, "unitPrice": 100, "taxRate": 0.2 }
  ]
}`,
    exampleCurl: {
      method: 'POST',
      path: '/public/factures',
      sendExample: {
        path: '/public/factures/:id/payment-intent',
        body: '{}',
      },
    },
    workflow: API_WORKFLOWS.find((w) => w.id === 'stripe-pay-later'),
  },
  {
    id: 'refunds',
    title: 'Remboursements',
    scopes: ['factures.read', 'factures.refund'],
    body: `Rembourse une facture déjà encaissée. Pour un paiement Stripe (notes stripe:pi_…), l’API interroge Stripe avant de créer un nouveau refund : si c’est déjà fait, réponse avec alreadyRefundedOnStripe: true (pas de double mouvement).

Dans l’app web : détail facture → Rembourser sur un paiement (case « via Stripe »).

Scope factures.refund obligatoire pour POST.`,
    endpoints: [
      {
        method: 'GET',
        path: '/public/factures/:id/refunds',
        scope: 'factures.read',
        desc: 'Lister les remboursements',
      },
      {
        method: 'POST',
        path: '/public/factures/:id/refunds',
        scope: 'factures.refund',
        desc: 'Créer un remboursement',
        requestBody:
          '{ "amount": 120, "paymentId": 42, "reason": "…", "refundViaStripe": true }',
        responseHint: 'id, stripeRefundId, alreadyRefundedOnStripe?',
      },
    ],
    exampleBody: `{
  "amount": 120,
  "paymentId": 42,
  "reason": "Annulation partielle",
  "refundViaStripe": true
}`,
    exampleCurl: {
      method: 'POST',
      path: '/public/factures/:id/refunds',
    },
    workflow: API_WORKFLOWS.find((w) => w.id === 'invoice-refund'),
  },
  {
    id: 'pagination',
    title: 'Pagination et recherche',
    body: `Query params des listes : page (défaut 1), pageSize ou limit (1–100), search, sortBy, order.

Exemple : GET /public/clients?page=1&pageSize=50&search=acme`,
  },
  {
    id: 'clients',
    title: 'Clients',
    scopes: ['clients.read', 'clients.write'],
    endpoints: [
      {
        method: 'GET',
        path: '/public/clients',
        scope: 'clients.read',
        desc: 'Liste paginée',
        queryParams: '?page=1&pageSize=20&search=…',
      },
      { method: 'GET', path: '/public/clients/:id', scope: 'clients.read', desc: 'Détail' },
      {
        method: 'POST',
        path: '/public/clients',
        scope: 'clients.write',
        desc: 'Créer (email existant dans votre org → client réutilisé, pas d’erreur)',
        requestBody: '{ "name", "email", "countryCode" }',
      },
      { method: 'PATCH', path: '/public/clients/:id', scope: 'clients.write', desc: 'Modifier' },
      { method: 'DELETE', path: '/public/clients/:id', scope: 'clients.write', desc: 'Supprimer' },
    ],
    exampleBody: `{
  "name": "Société Dupont",
  "email": "facturation@dupont.fr",
  "isCompany": true,
  "countryCode": "FR"
}`,
    exampleCurl: { method: 'POST', path: '/public/clients' },
  },
  {
    id: 'produits',
    title: 'Produits',
    scopes: ['produits.read', 'produits.write'],
    body: `Les produits créés via l’API sont rattachés à l’organisation du jeton (comme dans l’app web). Utilisez un jeton créé dans Paramètres → API sur le même compte que votre session.

Visuel (si visualType / iconName / imageData omis) : tirage aléatoire entre
• icône Font Awesome + dégradé de couleur (stocké en imageData: "icon-gradient:#…,#…")
• visuel bibliothèque (imageData: "library:web", "library:seo", etc.)

Forcer : visualType "icon" + iconName optionnel, ou visualType "library" + imageData "library:…".

Recherche produits : GET /public/produits?search=MON-SKU (contient, pas égalité stricte).

Livrables — champ details (ou alias livrables) : tableau de { label, amount?, hours? }.
Alias acceptés : livrable / name / title → label ; montant / montantHT / prix → amount ; heures / duree → hours.
Formats valides : chaîne simple ("Mesure Core Web Vitals") ou objet structuré. Objets sans libellé texte ignorés (évite [object Object]).
Chaque livrable libellé est indexé dans le catalogue organisation (POST/PATCH). Voir section « Catalogue livrables ».

Technos — préférer techStack par couche (languages, frontend, backend, cms, databases, devops, ai, mobile, security).
Alias : languages ou technos (liste plate) → techStack.languages si aucune couche fournie.

Script de test : scripts/windows/test-produit.ps1.`,
    endpoints: [
      {
        method: 'GET',
        path: '/public/produits',
        scope: 'produits.read',
        desc: 'Produits de votre organisation',
        queryParams: '?page=1&search=…&kind=SERVICE',
      },
      {
        method: 'GET',
        path: '/public/produits/sku/:sku',
        scope: 'produits.read',
        desc: 'Produit org par SKU exact',
      },
      { method: 'GET', path: '/public/produits/:id', scope: 'produits.read', desc: 'Détail par id' },
      {
        method: 'POST',
        path: '/public/produits',
        scope: 'produits.write',
        desc: 'Créer',
        requestBody:
          '{ "name", "sku", "unitPrice", "kind", "techStack", "details" ou "livrables": [{ "label", "amount", "hours" }], "languages" / "technos" (optionnel) }',
      },
      { method: 'PATCH', path: '/public/produits/:id', scope: 'produits.write', desc: 'Modifier' },
      { method: 'DELETE', path: '/public/produits/:id', scope: 'produits.write', desc: 'Supprimer' },
    ],
    exampleBody: `{
  "name": "Site vitrine WordPress",
  "sku": "WP-VITRINE-API",
  "kind": "SERVICE",
  "unitPrice": 3200,
  "estimatedHours": 40,
  "category": "DEV",
  "techStack": {
    "languages": ["PHP"],
    "cms": ["WordPress"]
  },
  "details": [
    { "label": "Intégration thème", "amount": 1800, "hours": 24 },
    { "label": "Recette & mise en ligne", "amount": 600, "hours": 8 },
    { "label": "Formation éditeur", "amount": 800, "hours": 8 }
  ]
}`,
    exampleCurl: { method: 'POST', path: '/public/produits' },
  },
  {
    id: 'livrables',
    title: 'Catalogue livrables',
    scopes: ['produits.read', 'produits.write'],
    body: `Répertoire organisation des libellés de livrables réutilisés entre produits (comme l’autocomplete dans l’app web).

• Recherche : GET /public/produits/livrables/catalog?q=mot-clé (sans q → livrables récents, max 25).
• Enregistrement : automatique à chaque POST/PATCH /public/produits dont details contient un label non vide.
• Mise à jour : si le libellé existe déjà (insensible à la casse), amount et hours fournis écrasent les valeurs par défaut.

Réponse : tableau [{ "id", "label", "defaultAmount", "defaultHours" }] — montants HT, heures entières.

Les livrables structurés alimentent aussi la répartition du prix sur le PDF devis (si tous les montants sont renseignés).`,
    endpoints: [
      {
        method: 'GET',
        path: '/public/produits/livrables/catalog',
        scope: 'produits.read',
        desc: 'Rechercher des livrables (autocomplete)',
        queryParams: '?q=intégration (optionnel)',
        responseHint: '[{ "id": 1, "label": "Intégration thème", "defaultAmount": 1800, "defaultHours": 24 }]',
      },
    ],
    exampleCurl: { method: 'GET', path: '/public/produits/livrables/catalog?q=wordpress' },
    workflow: API_WORKFLOWS.find(w => w.id === 'deliverables-catalog'),
  },
  {
    id: 'factures',
    title: 'Factures',
    scopes: ['factures.read', 'factures.write', 'factures.send', 'factures.refund'],
    body: `clientId ou clientEmail (crée la fiche si besoin). paidExternally: true → PAID, solde 0.

Paiement Stripe différé : POST …/payment-intent puis confirm-payment (voir section dédiée).
Remboursements : POST …/refunds (scope factures.refund) — vérif Stripe anti-doublon.

Voir aussi « Paiement externe + envoi email » pour le parcours paidExternally.`,
    endpoints: [
      {
        method: 'GET',
        path: '/public/factures',
        scope: 'factures.read',
        desc: 'Liste',
        queryParams: '?page=1&pageSize=20',
      },
      { method: 'GET', path: '/public/factures/:id', scope: 'factures.read', desc: 'Détail' },
      {
        method: 'POST',
        path: '/public/factures',
        scope: 'factures.write',
        desc: 'Créer',
        requestBody: 'clientEmail ou clientId, lines[], paidExternally (optionnel)',
      },
      { method: 'PATCH', path: '/public/factures/:id', scope: 'factures.write', desc: 'Modifier' },
      {
        method: 'GET',
        path: '/public/factures/archives',
        scope: 'factures.read',
        desc: 'Archives groupées par année / mois',
      },
      {
        method: 'POST',
        path: '/public/factures/:id/archive',
        scope: 'factures.write',
        desc: 'Archiver (pas de suppression)',
      },
      {
        method: 'POST',
        path: '/public/factures/:id/restore',
        scope: 'factures.write',
        desc: 'Restaurer depuis les archives',
      },
      {
        method: 'POST',
        path: '/public/factures/:id/send',
        scope: 'factures.send',
        desc: 'Envoyer par email',
        requestBody: '{ "email", "updateClientEmail": true }',
        responseHint: '{ emailSent, sentTo, alreadyPaid }',
      },
      {
        method: 'POST',
        path: '/public/factures/:id/payment-intent',
        scope: 'factures.write',
        desc: 'PaymentIntent Stripe (encaisser plus tard)',
        responseHint: 'clientSecret, stripePublishableKey, paymentIntentId',
      },
      {
        method: 'POST',
        path: '/public/factures/:id/confirm-payment',
        scope: 'factures.write',
        desc: 'Confirmer un PaymentIntent réussi',
        requestBody: '{ "paymentIntentId": "pi_…" }',
      },
      {
        method: 'GET',
        path: '/public/factures/:id/refunds',
        scope: 'factures.read',
        desc: 'Lister les remboursements',
      },
      {
        method: 'POST',
        path: '/public/factures/:id/refunds',
        scope: 'factures.refund',
        desc: 'Rembourser (vérif Stripe si paiement Stripe)',
        requestBody: '{ "amount", "paymentId?", "refundViaStripe?", "reason?" }',
      },
    ],
    exampleBody: `{
  "clientEmail": "client@exemple.com",
  "clientName": "Client Exemple",
  "lines": [
    { "description": "Prestation", "quantity": 1, "unitPrice": 100, "taxRate": 0.2 }
  ]
}`,
    exampleCurl: {
      method: 'POST',
      path: '/public/factures',
      sendExample: {
        path: '/public/factures/:id/send',
        body: '{"email":"client@exemple.com","updateClientEmail":true}',
      },
    },
  },
  {
    id: 'devis',
    title: 'Devis',
    scopes: ['devis.read', 'devis.write', 'devis.send', 'clients.read', 'clients.write'],
    body: `clientId est une chaîne (ex. "kl644kqh8r"), pas un entier.

Lignes — trois modes (un seul identifiant produit par ligne) :

1. Manuelle : description + unitPrice + quantity (+ taxRate).
2. Catalogue par ID : productId seul (+ quantity) — nom et prix déduits du produit de votre organisation.
3. Get-or-create par SKU : productSku + description (ou productName) + unitPrice lors de la 1re occurrence ; le produit est créé dans le catalogue si le SKU est inconnu (visuel aléatoire). Les appels suivants avec le même SKU réutilisent le produit (unitPrice optionnel = prix catalogue).

Ne pas combiner productId et productSku sur la même ligne.

Scripts : scripts/windows/test-devis.ps1 (envoi / accept), test-devis-produit.ps1 (productSku + envoi), test-produit.ps1.`,
    endpoints: [
      { method: 'GET', path: '/public/devis', scope: 'devis.read', desc: 'Liste' },
      { method: 'GET', path: '/public/devis/:id', scope: 'devis.read', desc: 'Détail' },
      {
        method: 'POST',
        path: '/public/devis',
        scope: 'devis.write',
        desc: 'Créer',
        requestBody:
          '{ "clientId", "expiryDate", "lines": [{ productId | productSku+description+unitPrice | description+unitPrice, "quantity", "taxRate" }] }',
      },
      { method: 'PATCH', path: '/public/devis/:id', scope: 'devis.write', desc: 'Modifier' },
      {
        method: 'GET',
        path: '/public/devis/archives',
        scope: 'devis.read',
        desc: 'Archives groupées par année / mois',
      },
      {
        method: 'POST',
        path: '/public/devis/:id/archive',
        scope: 'devis.write',
        desc: 'Archiver (pas de suppression)',
      },
      {
        method: 'POST',
        path: '/public/devis/:id/restore',
        scope: 'devis.write',
        desc: 'Restaurer depuis les archives',
      },
      {
        method: 'POST',
        path: '/public/devis/:id/send',
        scope: 'devis.send',
        desc: 'Envoyer (accepter / refuser)',
        requestBody: '{ "email" }',
      },
    ],
    exampleBody: `{
  "clientId": "kl644kqh8r",
  "expiryDate": "2026-07-15",
  "lines": [
    {
      "productSku": "DEV-SITE-VITRINE",
      "description": "Site vitrine WordPress",
      "quantity": 1,
      "unitPrice": 3200,
      "taxRate": 0.2
    }
  ]
}`,
    exampleCurl: {
      method: 'POST',
      path: '/public/devis',
      sendExample: {
        path: '/public/devis/:id/send',
        body: '{}',
      },
    },
    workflow: API_WORKFLOWS.find(w => w.id === 'quote-product-sku') ?? API_WORKFLOWS[2],
  },
  {
    id: 'catalog-import',
    title: 'Import catalogue',
    body: `Pour synchroniser un catalogue externe (prestations, SKU e-commerce…) :

• Recherche : GET /public/produits?search=SKU avant POST pour limiter les doublons.
• Création unitaire : POST /public/produits (visuel aléatoire si omis).
• Livrables réutilisables : GET /public/produits/livrables/catalog — indexés via details sur POST/PATCH produit.
• Import massif : préférer l’API session POST /api/products (pas de rate limit 60/15 min).
• Devis sans produit préalable : productSku sur POST /public/devis (get-or-create, voir section Devis).`,
    scopes: ['produits.read', 'produits.write', 'devis.write'],
    workflow: API_WORKFLOWS.find(w => w.id === 'catalog-import'),
  },
]

export function buildCurlExample(
  method: string,
  path: string,
  body?: string,
  base = getApiBaseUrl(),
): string {
  const url = formatDocUrl(base, path)
  const headers = `-H "Authorization: Bearer fact_VOTRE_JETON"`
  if (method === 'GET' || method === 'DELETE') {
    return `curl -s -X ${method} ${headers} "${url}"`
  }
  const compact = body ? body.replace(/\n/g, '').replace(/\s+/g, ' ') : ''
  const data = compact
    ? ` -H "Content-Type: application/json" -d '${compact}'`
    : ''
  return `curl -s -X ${method} ${headers}${data} "${url}"`
}
