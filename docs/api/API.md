# Documentation API - Facturio

Documentation complète des endpoints de l'API Facturio.

## Base URL

```
http://localhost:3000
```

## Format des réponses

Toutes les réponses sont au format JSON.

### Succès

```json
{
  "id": 1,
  "name": "ACME Corp",
  ...
}
```

### Erreur

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

## Clients

### Créer un client

```http
POST /clients
Content-Type: application/json

{
  "name": "ACME Corp",
  "email": "contact@acme.test",
  "type": "B2B",
  "vatNumber": "FR12345678901"
}
```

### Lister les clients

```http
GET /clients
```

### Obtenir un client

```http
GET /clients/:id
```

### Modifier un client

```http
PATCH /clients/:id
Content-Type: application/json

{
  "name": "ACME Corporation"
}
```

### Supprimer un client

```http
DELETE /clients/:id
```

## Factures

### Créer une facture

```http
POST /invoices
Content-Type: application/json

{
  "clientId": 1,
  "lines": [
    {
      "description": "Prestation développement",
      "quantity": 2,
      "unitPrice": 150
    }
  ]
}
```

La TVA est calculée automatiquement selon les règles :
- FR : 20% par défaut
- UE B2B avec numéro TVA : 0% (autoliquidation)
- Export : 0%
- Exonération client : 0%

### Lister les factures

```http
GET /invoices
```

### Obtenir une facture

```http
GET /invoices/:id
```

### Modifier une facture

```http
PATCH /invoices/:id
Content-Type: application/json

{
  "status": "PAID"
}
```

### Supprimer une facture

```http
DELETE /invoices/:id
```

### Paiements

#### Lister les paiements d'une facture

```http
GET /invoices/:id/payments
```

#### Enregistrer un paiement

```http
POST /invoices/:id/payments
Content-Type: application/json

{
  "amount": 360,
  "paymentDate": "2024-01-15",
  "method": "BANK_TRANSFER"
}
```

## Devis

### Créer un devis

```http
POST /quotes
Content-Type: application/json

{
  "clientId": 1,
  "lines": [
    {
      "description": "Prestation",
      "quantity": 1,
      "unitPrice": 500
    }
  ],
  "validUntil": "2024-02-01"
}
```

### Lister les devis

```http
GET /quotes
```

### Obtenir un devis

```http
GET /quotes/:id
```

### Modifier un devis

```http
PATCH /quotes/:id
Content-Type: application/json

{
  "status": "SENT"
}
```

### Supprimer un devis

```http
DELETE /quotes/:id
```

### Convertir un devis en facture

```http
POST /quotes/:id/convert-to-invoice
```

## Produits

### Créer un produit

```http
POST /products
Content-Type: application/json

{
  "name": "Site web WordPress",
  "description": "Site vitrine avec WordPress",
  "price": 1500,
  "type": "SERVICE"
}
```

### Lister les produits

```http
GET /products
```

### Obtenir un produit

```http
GET /products/:id
```

### Modifier un produit

```http
PATCH /products/:id
Content-Type: application/json

{
  "price": 1800
}
```

### Supprimer un produit

```http
DELETE /products/:id
```

## TVA

### Créer un taux de TVA

```http
POST /taxes
Content-Type: application/json

{
  "name": "TVA standard",
  "rate": 20,
  "country": "FR"
}
```

### Lister les taux de TVA

```http
GET /taxes
```

### Obtenir un taux de TVA

```http
GET /taxes/:id
```

### Modifier un taux de TVA

```http
PATCH /taxes/:id
Content-Type: application/json

{
  "rate": 10
}
```

### Supprimer un taux de TVA

```http
DELETE /taxes/:id
```

## Déclarations (Filings)

### Créer une déclaration

```http
POST /filings
Content-Type: application/json

{
  "type": "CA3",
  "period": "2024-01",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31"
}
```

### Lister les déclarations

```http
GET /filings
```

### Obtenir une déclaration

```http
GET /filings/:id
```

### Calculer une déclaration

```http
POST /filings/:id/calculate
```

Calcule automatiquement le CA HT, TVA collectée, TVA déductible, etc.

### Enregistrer un paiement de déclaration

```http
POST /filings/:id/payments
Content-Type: application/json

{
  "amount": 1200,
  "paymentDate": "2024-02-15"
}
```

## Abonnements

### Plans

#### Créer un plan

```http
POST /subscriptions/plans
Content-Type: application/json

{
  "name": "Plan Pro",
  "price": 49.99,
  "billingCycle": "MONTHLY",
  "features": ["Feature 1", "Feature 2"]
}
```

#### Lister les plans

```http
GET /subscriptions/plans
```

#### Obtenir un plan

```http
GET /subscriptions/plans/:id
```

#### Modifier un plan

```http
PATCH /subscriptions/plans/:id
```

#### Supprimer un plan

```http
DELETE /subscriptions/plans/:id
```

### Abonnements

#### Créer un abonnement

```http
POST /subscriptions
Content-Type: application/json

{
  "clientId": 1,
  "planId": 1,
  "startDate": "2024-01-01"
}
```

#### Lister les abonnements

```http
GET /subscriptions
```

#### Obtenir un abonnement

```http
GET /subscriptions/:id
```

#### Modifier un abonnement

```http
PATCH /subscriptions/:id
```

#### Annuler un abonnement

```http
POST /subscriptions/:id/cancel-at-period-end
```

ou

```http
POST /subscriptions/:id/cancel-now
```

## Comptabilité

### Comptes

#### Lister les comptes

```http
GET /accounting/accounts
```

#### Créer un compte

```http
POST /accounting/accounts
Content-Type: application/json

{
  "code": "411",
  "name": "Clients",
  "type": "ASSET"
}
```

### Journaux

#### Créer un journal

```http
POST /accounting/journals
Content-Type: application/json

{
  "code": "VE",
  "name": "Ventes"
}
```

### Écritures

#### Créer une écriture

```http
POST /accounting/entries
Content-Type: application/json

{
  "journalCode": "VE",
  "date": "2024-01-15",
  "description": "Vente",
  "lines": [
    {
      "accountCode": "411",
      "debit": 1200,
      "credit": 0
    },
    {
      "accountCode": "706",
      "debit": 0,
      "credit": 1000
    },
    {
      "accountCode": "44571",
      "debit": 0,
      "credit": 200
    }
  ]
}
```

Les écritures doivent être équilibrées (débit = crédit).

### Rapports

#### Balance

```http
GET /accounting/reports/balance?start=2024-01-01&end=2024-01-31
```

#### Grand livre

```http
GET /accounting/reports/general-ledger?account=706&start=2024-01-01&end=2024-01-31
```

### Export FEC

```http
GET /accounting/exports/fec?start=2024-01-01&end=2024-12-31
```

Retourne le fichier FEC au format texte.

### Opérations spécialisées

#### Achat de service

```http
POST /accounting/purchases/service
Content-Type: application/json

{
  "supplierName": "Fournisseur",
  "amount": 1000,
  "vatAmount": 200,
  "date": "2024-01-15"
}
```

#### Paiement fournisseur

```http
POST /accounting/payments/service
Content-Type: application/json

{
  "supplierName": "Fournisseur",
  "amount": 1200,
  "date": "2024-01-20"
}
```

#### Paie

```http
POST /accounting/payroll
Content-Type: application/json

{
  "employeeName": "John Doe",
  "salary": 3000,
  "socialCharges": 1200,
  "date": "2024-01-31"
}
```

#### Paiement URSSAF

```http
POST /accounting/payments/urssaf
Content-Type: application/json

{
  "amount": 1200,
  "date": "2024-02-05"
}
```

#### Contribution micro-social

```http
POST /accounting/contrib/micro-social
Content-Type: application/json

{
  "turnover": 50000,
  "rate": 12,
  "date": "2024-01-31"
}
```

#### Contribution C3S

```http
POST /accounting/contrib/c3s
Content-Type: application/json

{
  "turnover": 50000,
  "date": "2024-01-31"
}
```

## Codes de statut HTTP

- `200` : Succès
- `201` : Créé
- `400` : Requête invalide
- `404` : Ressource non trouvée
- `500` : Erreur serveur

## Exemples avec cURL

### Créer un client

```bash
curl -X POST http://localhost:3000/clients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ACME Corp",
    "email": "contact@acme.test",
    "type": "B2B"
  }'
```

### Créer une facture

```bash
curl -X POST http://localhost:3000/invoices \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": 1,
    "lines": [
      {
        "description": "Prestation",
        "quantity": 2,
        "unitPrice": 150
      }
    ]
  }'
```

## Notes

- Tous les montants sont en décimal (pas de float)
- Les dates sont au format ISO 8601 (YYYY-MM-DD)
- La TVA est calculée automatiquement selon les règles métier
- Les écritures comptables sont créées automatiquement pour les factures et paiements




