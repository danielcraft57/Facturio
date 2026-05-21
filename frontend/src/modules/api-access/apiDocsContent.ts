/** Documentation API publique Facturio (contenu structuré). */

export function getApiBaseUrl(): string {
  const isDev = import.meta.env.DEV
  if (isDev) return `${window.location.origin}/api`
  return import.meta.env.VITE_API_URL || `${window.location.origin}/api`
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
  example?: string
  exampleBody?: string
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
    title: 'Facture déjà payée sur un autre site',
    steps: [
      'Créer un jeton avec factures.read, factures.write et factures.send.',
      'POST /public/factures avec paidExternally: true, clientEmail et lines[].',
      'Si l’email n’existe pas, Facturio crée automatiquement la fiche client (clientName optionnel).',
      'POST /public/factures/:id/send avec { "email": "...", "updateClientEmail": true } pour envoyer le justificatif PDF.',
    ],
  },
  {
    id: 'classic',
    title: 'Facture classique à encaisser',
    steps: [
      'POST /public/clients ou réutiliser un client existant (GET /public/clients).',
      'POST /public/factures avec clientId ou clientEmail + lines[].',
      'POST /public/factures/:id/send — le client reçoit le PDF et le lien de paiement en ligne si Stripe est configuré.',
    ],
  },
] as const

export const API_DOC_SECTIONS: ApiDocSection[] = [
  {
    id: 'overview',
    title: 'Vue d’ensemble',
    body: `L’API publique Facturio permet d’intégrer votre facturation (clients, produits, devis, factures) depuis un site e-commerce, un script ou un outil d’automatisation.

Toutes les routes métier sont sous le préfixe \`/api/public/…\`. L’authentification se fait par jeton Bearer créé dans Paramètres → API — Jetons.

Les liens client (consultation facture / devis par le destinataire) utilisent des routes séparées (\`/api/public/invoices/:token\`, \`/api/public/quotes/:token\`) et ne nécessitent pas votre jeton API.`,
  },
  {
    id: 'auth',
    title: 'Authentification',
    body: `1. Créez un jeton sur /parametres/tokens en cochant uniquement les permissions nécessaires.
2. Copiez le jeton complet (préfixe fact_) — il n’est affiché qu’une fois.
3. Ajoutez l’en-tête sur chaque requête :

Authorization: Bearer fact_VOTRE_JETON

Test rapide : GET /api/public renvoie le résumé des ressources disponibles.`,
    example: `curl -s -H "Authorization: Bearer fact_VOTRE_JETON" "${getApiBaseUrl()}/public"`,
  },
  {
    id: 'pagination',
    title: 'Pagination et recherche',
    body: `Les listes (clients, factures, produits) acceptent les query params :

• page (défaut 1)
• pageSize ou limit (1–100, défaut 20)
• search (texte libre selon la ressource)
• sortBy, order / sortOrder (tri)

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
        desc: 'Liste paginée des clients de votre organisation',
        queryParams: '?page=1&pageSize=20&search=…',
        responseHint: '{ items, total, page, pageSize } ou tableau selon version',
      },
      {
        method: 'GET',
        path: '/public/clients/:id',
        scope: 'clients.read',
        desc: 'Détail d’un client',
      },
      {
        method: 'POST',
        path: '/public/clients',
        scope: 'clients.write',
        desc: 'Créer un client',
        requestBody: '{ "name": "Acme", "email": "contact@acme.fr", "countryCode": "FR" }',
      },
      {
        method: 'PATCH',
        path: '/public/clients/:id',
        scope: 'clients.write',
        desc: 'Mettre à jour un client',
      },
      {
        method: 'DELETE',
        path: '/public/clients/:id',
        scope: 'clients.write',
        desc: 'Supprimer un client (si aucune facture bloquante)',
      },
    ],
    exampleBody: `{
  "name": "Société Dupont",
  "email": "facturation@dupont.fr",
  "isCompany": true,
  "countryCode": "FR"
}`,
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
        desc: 'Catalogue produits / prestations',
        queryParams: '?page=1&search=…',
      },
      {
        method: 'GET',
        path: '/public/produits/:id',
        scope: 'produits.read',
        desc: 'Détail produit',
      },
      {
        method: 'POST',
        path: '/public/produits',
        scope: 'produits.write',
        desc: 'Créer un produit',
        requestBody: '{ "name": "Audit SEO", "unitPrice": 800, "kind": "SERVICE" }',
      },
      {
        method: 'PATCH',
        path: '/public/produits/:id',
        scope: 'produits.write',
        desc: 'Modifier un produit',
      },
      {
        method: 'DELETE',
        path: '/public/produits/:id',
        scope: 'produits.write',
        desc: 'Supprimer un produit',
      },
    ],
  },
  {
    id: 'factures',
    title: 'Factures',
    scopes: ['factures.read', 'factures.write', 'factures.send'],
    body: `Création : fournissez clientId **ou** clientEmail. Si l’email n’existe pas, une fiche client est créée (clientName recommandé).

paidExternally: true enregistre la facture comme déjà payée (solde 0, paiement externe tracé).

taxRate sur chaque ligne : décimal (0.2 = 20 %).`,
    endpoints: [
      {
        method: 'GET',
        path: '/public/factures',
        scope: 'factures.read',
        desc: 'Liste des factures',
        queryParams: '?page=1&pageSize=20&search=…&sortBy=date&order=desc',
      },
      {
        method: 'GET',
        path: '/public/factures/:id',
        scope: 'factures.read',
        desc: 'Détail (lignes, client, totaux, statut)',
      },
      {
        method: 'POST',
        path: '/public/factures',
        scope: 'factures.write',
        desc: 'Créer une facture',
        requestBody: 'Voir exemple ci-dessous',
      },
      {
        method: 'PATCH',
        path: '/public/factures/:id',
        scope: 'factures.write',
        desc: 'Modifier une facture (souvent brouillon)',
      },
      {
        method: 'POST',
        path: '/public/factures/:id/send',
        scope: 'factures.send',
        desc: 'Envoyer par email',
        requestBody: '{ "email": "client@exemple.com", "updateClientEmail": true }',
        responseHint: '{ emailSent, sentTo, publicUrl, alreadyPaid }',
      },
    ],
    exampleBody: `{
  "clientEmail": "client@boutique.fr",
  "clientName": "Client Boutique",
  "paidExternally": true,
  "externalPaymentMethod": "WooCommerce",
  "externalPaymentDate": "2026-05-20",
  "dueDate": "2026-06-30",
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
    workflow: API_WORKFLOWS[0],
  },
  {
    id: 'devis',
    title: 'Devis',
    scopes: ['devis.read', 'devis.write', 'devis.send'],
    endpoints: [
      {
        method: 'GET',
        path: '/public/devis',
        scope: 'devis.read',
        desc: 'Liste des devis',
      },
      {
        method: 'GET',
        path: '/public/devis/:id',
        scope: 'devis.read',
        desc: 'Détail devis + lignes',
      },
      {
        method: 'POST',
        path: '/public/devis',
        scope: 'devis.write',
        desc: 'Créer un devis',
        requestBody: '{ "clientId": 1, "lines": […], "expiryDate": "2026-07-01" }',
      },
      {
        method: 'PATCH',
        path: '/public/devis/:id',
        scope: 'devis.write',
        desc: 'Modifier un devis',
      },
      {
        method: 'POST',
        path: '/public/devis/:id/send',
        scope: 'devis.send',
        desc: 'Envoyer par email (liens accepter / refuser)',
        requestBody: '{ "email": "client@exemple.com" }',
      },
    ],
    exampleBody: `{
  "clientId": 1,
  "expiryDate": "2026-07-15",
  "lines": [
    { "description": "Développement site", "quantity": 1, "unitPrice": 2500, "taxRate": 0.2 }
  ]
}`,
  },
  {
    id: 'errors',
    title: 'Codes d’erreur HTTP',
    body: 'Réponses JSON avec message explicite (NestJS). En cas de 401 sur une route protégée par session, vérifiez que vous appelez bien /api/public/… avec le jeton API.',
  },
]

export function buildCurlExample(
  method: string,
  path: string,
  body?: string,
  base = getApiBaseUrl(),
): string {
  const url = `${base}${path}`
  const headers = `-H "Authorization: Bearer fact_VOTRE_JETON"`
  if (method === 'GET' || method === 'DELETE') {
    return `curl -X ${method} ${headers} "${url}"`
  }
  const data = body ? ` \\\n  -H "Content-Type: application/json" \\\n  -d '${body.replace(/\n/g, '').replace(/\s+/g, ' ')}'` : ''
  return `curl -X ${method} ${headers}${data} "${url}"`
}
