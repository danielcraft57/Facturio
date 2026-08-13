# Documentation API

Documentation complète de l'API REST de PrestaFacture.

## Contenu

- [API](./API.md) - Documentation des endpoints session (JWT)
- Doc **API publique Bearer** (intégrateurs) : dans l'app, Paramètres → API → Documentation (`/api-docs`)

## Base URL

```
http://localhost:3000/api
```

## Endpoints principaux (session)

- **Clients** : `/clients`
- **Factures** : `/invoices`
- **Devis** : `/quotes`
- **Produits** : `/products`
- **Comptabilité** : `/accounting`
- **Remboursements** : `/refunds`, `/invoices/:id/refunds`

## API publique (Bearer `fact_…`)

Préfixe `/api/public/…`. Scopes sur le jeton (dont `factures.refund`).

| Action | Méthode |
|--------|---------|
| PaymentIntent (payer plus tard) | `POST /public/factures/:id/payment-intent` |
| Confirmer paiement | `POST /public/factures/:id/confirm-payment` |
| Lister / créer remboursements | `GET\|POST /public/factures/:id/refunds` |

Voir aussi [Finance, avoirs & remboursements](../modules/FINANCE_REMBOURSEMENTS_AVOIRS.md).

Pour la documentation session complète, voir [API](./API.md).

