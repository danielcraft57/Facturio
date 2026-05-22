/** Documentation API publique Facturio (contenu structuré). */

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
  workflow?: { title: string; steps: string[] }
}

export const API_SCOPES_REFERENCE = [
  { id: 'clients.read', label: 'Lire les clients', resource: 'Clients' },
  { id: 'clients.write', label: 'Créer / modifier / supprimer des clients', resource: 'Clients' },
  { id: 'produits.read', label: 'Lire le catalogue produits', resource: 'Produits' },
  { id: 'produits.write', label: 'Créer / modifier / supprimer des produits', resource: 'Produits' },
  { id: 'factures.read', label: 'Lister et consulter les factures', resource: 'Factures' },
  { id: 'factures.write', label: 'Créer et modifier des factures', resource: 'Factures' },
  { id: 'factures.send', label: 'Envoyer une facture par email (PDF)', resource: 'Factures' },
  { id: 'devis.read', label: 'Lister et consulter les devis', resource: 'Devis' },
  { id: 'devis.write', label: 'Créer et modifier des devis', resource: 'Devis' },
  { id: 'devis.send', label: 'Envoyer un devis par email', resource: 'Devis' },
] as const

export const API_ERROR_CODES = [
  { status: 401, meaning: 'Jeton absent, invalide ou révoqué' },
  { status: 403, meaning: 'Jeton valide mais scope insuffisant (ex. factures.send manquant)' },
  { status: 400, meaning: 'Corps JSON invalide ou règle métier (email manquant, lignes vides…)' },
  { status: 404, meaning: 'Ressource introuvable ou hors de votre organisation' },
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
] as const

/** Sections affichées dans l’onglet Référence (sommaire + contenu). */
export const API_DOC_SECTIONS: ApiDocSection[] = [
  {
    id: 'overview',
    title: 'Vue d’ensemble',
    body: `L’API publique permet d’intégrer clients, produits, devis et factures (e-commerce, scripts, n8n…).

• Préfixe : /api/public/…
• Auth : Authorization: Bearer fact_… (jetons dans Paramètres → API — Jetons)
• Format : JSON UTF-8

En local : base http://localhost:5173/api (proxy Vite → backend :3000). Copiez frontend/env.development.example vers .env. En production : https://votre-domaine/api.

Les pages client (/public/invoices/:token, etc.) sont distinctes et ne utilisent pas le jeton API.

L’application web (tableaux de bord Factures / Devis) se met à jour en temps réel via SSE : GET /api/realtime/stream (session JWT, hors jeton API).`,
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
    body: `Cas typique : commande réglée sur WooCommerce, Shopify, etc. Facturio enregistre la facture comme payée puis envoie le PDF par email.

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
        desc: 'Créer',
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
    endpoints: [
      {
        method: 'GET',
        path: '/public/produits',
        scope: 'produits.read',
        desc: 'Catalogue',
        queryParams: '?page=1&search=…',
      },
      { method: 'GET', path: '/public/produits/:id', scope: 'produits.read', desc: 'Détail' },
      {
        method: 'POST',
        path: '/public/produits',
        scope: 'produits.write',
        desc: 'Créer',
        requestBody: '{ "name", "unitPrice", "kind": "SERVICE" }',
      },
      { method: 'PATCH', path: '/public/produits/:id', scope: 'produits.write', desc: 'Modifier' },
      { method: 'DELETE', path: '/public/produits/:id', scope: 'produits.write', desc: 'Supprimer' },
    ],
  },
  {
    id: 'factures',
    title: 'Factures',
    scopes: ['factures.read', 'factures.write', 'factures.send'],
    body: `clientId ou clientEmail (crée la fiche si besoin). paidExternally: true → PAID, solde 0.

Voir aussi la section « Paiement externe + envoi email » pour le parcours complet en deux requêtes.`,
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
        method: 'POST',
        path: '/public/factures/:id/send',
        scope: 'factures.send',
        desc: 'Envoyer par email',
        requestBody: '{ "email", "updateClientEmail": true }',
        responseHint: '{ emailSent, sentTo, alreadyPaid }',
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
    scopes: ['devis.read', 'devis.write', 'devis.send'],
    endpoints: [
      { method: 'GET', path: '/public/devis', scope: 'devis.read', desc: 'Liste' },
      { method: 'GET', path: '/public/devis/:id', scope: 'devis.read', desc: 'Détail' },
      {
        method: 'POST',
        path: '/public/devis',
        scope: 'devis.write',
        desc: 'Créer',
        requestBody: '{ "clientId", "lines", "expiryDate" }',
      },
      { method: 'PATCH', path: '/public/devis/:id', scope: 'devis.write', desc: 'Modifier' },
      {
        method: 'POST',
        path: '/public/devis/:id/send',
        scope: 'devis.send',
        desc: 'Envoyer (accepter / refuser)',
        requestBody: '{ "email" }',
      },
    ],
    exampleBody: `{
  "clientId": 1,
  "expiryDate": "2026-07-15",
  "lines": [
    { "description": "Développement", "quantity": 1, "unitPrice": 2500, "taxRate": 0.2 }
  ]
}`,
    exampleCurl: { method: 'POST', path: '/public/devis' },
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
