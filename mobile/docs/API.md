# API mobile — mapping endpoints

Base URL : `EXPO_PUBLIC_API_URL` (ex. `http://localhost:3000/api`).

Toutes les requêtes authentifiées incluent `Authorization: Bearer <token>`.

Les réponses Nest peuvent être wrappées `{ success, data }` — le client `unwrapApi` normalise.

## Auth

Voir [AUTH.md](./AUTH.md).

## Dashboard

### `GET /dashboard/stats`

Query optionnel : `startDate`, `endDate` (ISO).

Réponse (extrait) :

```typescript
{
  revenue: { total, thisMonth, lastMonth, growth },
  invoices: { total, paid, overdue, draft, sent, … },
  clients: { total, active, … },
  recentActivity: [{ type, message, amount?, date }],
  monthlyRevenue: [{ month, revenue }],
  chartData: { revenueEvolution, invoiceStatus, topClients }
}
```

## Factures

### `GET /invoices`

Query : `page`, `limit`, `search`, `status`, `folder`, `sortBy`, `sortOrder`.

Réponse paginée : `{ invoices, total, page, pageSize }` (forme exacte selon `InvoicesService.findAll`).

### `GET /invoices/:id`

Détail complet d’une facture.

### `GET /invoices/:id/pdf`

Binaire PDF — ouvrir via `expo-sharing` / `Linking` (phase 2).

## Devis

### `GET /quotes`

Même pattern pagination que factures.

## Clients

### `GET /clients`

Liste paginée clients de l’organisation.

## Codes erreur courants

| HTTP | Signification | Action app |
|------|---------------|------------|
| 401 | Token expiré / invalide | Déconnexion → login |
| 403 | Email non vérifié | Écran « Confirmez votre email » |
| 429 | Rate limit login | Message + backoff |
| 502 | Backend injoignable | Bannière réseau |

## Parité frontend web

Les services mobile (`src/services/*`) reprennent les mêmes routes que :

- `frontend/src/services/authService.ts`
- `frontend/src/services/dashboard.ts`
- `frontend/src/services/invoices.ts`
