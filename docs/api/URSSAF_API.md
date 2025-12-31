# API URSSAF

Documentation de l'API pour la gestion des cotisations URSSAF et déclarations pour auto-entrepreneurs et micro-entreprises.

## Authentification

Toutes les routes nécessitent une authentification JWT via cookie ou header Authorization.

## Endpoints

### POST /api/urssaf/calculate

Calcule la cotisation URSSAF pour une période donnée.

**Body:**
```json
{
  "organizationId": 1,
  "periodStart": "2024-01-01",
  "periodEnd": "2024-01-31",
  "period": "2024-M01" // Optionnel
}
```

**Réponse:**
```json
{
  "ca": 9600,
  "rate": 0.22,
  "contribution": 2112,
  "activity": "SERVICE_BIC",
  "invoicesCount": 2,
  "periodStart": "2024-01-01T00:00:00.000Z",
  "periodEnd": "2024-01-31T23:59:59.999Z",
  "thresholdExceeded": false,
  "threshold": 176200
}
```

### POST /api/urssaf/filing

Crée une déclaration URSSAF automatique pour une période.

**Body:**
```json
{
  "organizationId": 1,
  "period": "2024-M01" // Format: YYYY-MNN (mensuel) ou YYYY-QN (trimestriel)
}
```

**Réponse:**
```json
{
  "id": 1,
  "type": "URSSAF_MONTHLY",
  "authority": "URSSAF",
  "periodStart": "2024-01-01T00:00:00.000Z",
  "periodEnd": "2024-01-31T23:59:59.999Z",
  "dueDate": "2024-02-29T23:59:59.999Z",
  "status": "DRAFT",
  "amountDue": 2112,
  "calculation": {
    "ca": 9600,
    "rate": 0.22,
    "contribution": 2112,
    "activity": "SERVICE_BIC",
    "invoicesCount": 2
  }
}
```

### GET /api/urssaf/contributions

Récupère l'historique des cotisations URSSAF pour l'organisation authentifiée.

**Réponse:**
```json
[
  {
    "id": 1,
    "type": "URSSAF_MONTHLY",
    "periodStart": "2024-01-01T00:00:00.000Z",
    "periodEnd": "2024-01-31T23:59:59.999Z",
    "dueDate": "2024-02-29T23:59:59.999Z",
    "status": "FILED",
    "amountDue": 2112,
    "amountPaid": 2112,
    "lines": [
      {
        "taxRate": 0.22,
        "taxableBase": 9600,
        "taxAmount": 2112
      }
    ],
    "payments": []
  }
]
```

### PATCH /api/urssaf/organization

Met à jour la configuration URSSAF de l'organisation.

**Body:**
```json
{
  "urssafActivity": "SERVICE_BIC", // VENTE, SERVICE_BIC, SERVICE_BNC
  "urssafFiscalOption": false, // Option micro-fiscal
  "urssafDeclarationFrequency": "MONTHLY", // MONTHLY ou QUARTERLY
  "urssafRate": 15, // Taux personnalisé (en %)
  "urssafThreshold": 176200 // Seuil personnalisé (en €)
}
```

**Réponse:**
```json
{
  "id": 1,
  "name": "Mon Entreprise",
  "urssafActivity": "SERVICE_BIC",
  "urssafFiscalOption": false,
  "urssafDeclarationFrequency": "MONTHLY",
  "urssafRate": null,
  "urssafThreshold": null
}
```

## Taux de cotisation

### Taux par défaut (2024)

- **Vente de marchandises**: 12,8%
- **Prestations de services BIC**: 22%
- **Prestations de services BNC**: 22%

### Taux micro-fiscal (option micro-fiscal)

- **Vente de marchandises**: 1%
- **Prestations de services BIC**: 1,7%
- **Prestations de services BNC**: 2,2%

## Seuils annuels (2024)

- **Vente de marchandises**: 72 600€
- **Prestations de services**: 176 200€

Si le CA annuel estimé dépasse le seuil, `thresholdExceeded` sera `true` dans la réponse de calcul.

## Formats de période

- **Mensuel**: `YYYY-MNN` (ex: `2024-M01`, `2024-M12`)
- **Trimestriel**: `YYYY-QN` (ex: `2024-Q1`, `2024-Q4`)

## Exemples

### Calcul mensuel standard

```bash
curl -X POST http://localhost:3000/api/urssaf/calculate \
  -H "Cookie: access_token=..." \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": 1,
    "periodStart": "2024-01-01",
    "periodEnd": "2024-01-31"
  }'
```

### Création déclaration trimestrielle

```bash
curl -X POST http://localhost:3000/api/urssaf/filing \
  -H "Cookie: access_token=..." \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": 1,
    "period": "2024-Q1"
  }'
```

### Mise à jour configuration

```bash
curl -X PATCH http://localhost:3000/api/urssaf/organization \
  -H "Cookie: access_token=..." \
  -H "Content-Type: application/json" \
  -d '{
    "urssafActivity": "SERVICE_BIC",
    "urssafFiscalOption": true,
    "urssafDeclarationFrequency": "QUARTERLY"
  }'
```

