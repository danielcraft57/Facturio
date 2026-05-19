# Module e-invoicing (réforme 2026)

Guide développeur pour le module de **préparation** à la facturation électronique B2B.

## Périmètre actuel

| Fonctionnalité | Statut |
|----------------|--------|
| Checklist conformité org / client / facture | ✅ |
| Export XML simplifié (pré-Factur-X) | ✅ |
| Statuts `eInvoiceStatus` + hash SHA-256 | ✅ |
| SIREN client (API + UI) | ✅ |
| PDF/A-3 Factur-X officiel | ❌ |
| Validation XSD / Schematron | ❌ |
| Envoi Plateforme Agréée | ❌ |
| Réception fournisseurs | ❌ |
| E-reporting | ❌ |

## Structure code

```
server/src/e-invoicing/
├── e-invoicing.module.ts
├── e-invoicing.controller.ts
├── e-invoicing.service.ts
├── e-invoicing-compliance.service.ts
├── factur-x-generator.service.ts
└── *.spec.ts / e-invoicing.e2e-spec.ts

frontend/src/
├── services/eInvoicing.ts
└── modules/e-invoicing/EInvoicingReadinessPanel.tsx
```

## API

Préfixe global : `/api`. Authentification JWT requise.

### GET `/e-invoicing/readiness`

Retourne le score organisation, le plan (`planAllowsEInvoicing`), les dates réforme et les prochaines étapes.

### GET `/e-invoicing/invoices/:id/readiness`

Score facture + sous-scores client et organisation.

### GET `/e-invoicing/invoices/:id/factur-x`

Télécharge le XML. Requiert plan `PRO_EFACTURE` ou `AGENCY` et facture « prête ».

Erreurs :

- `403` — plan Free/Pro ou facture non conforme
- `404` — facture introuvable

## Plans SaaS

Voir `server/src/billing/saas-plan.limits.ts` — clé `eInvoicing`.

## Tests

```bash
cd server
npm run test:unit -- --testPathPattern=e-invoicing
npm run test:e2e -- --testPathPattern=e-invoicing
```

## Évolutions prévues

1. **FacturXGenerator** : PDF/A-3 + XML embarqué (librairie type Mustang ou service dédié).
2. **PaConnector** : interface + implémentation partenaire (`E_INVOICING_*` env).
3. Webhooks statuts PA → mise à jour `eInvoiceStatus`.
4. Blocage envoi email classique si client B2B exige PA (option org).

## Documentation liée

- [FACTURATION_ELECTRONIQUE_2026.md](../planning/FACTURATION_ELECTRONIQUE_2026.md)
- [Dossier accréditation PA](../accreditation-pa/README.md)
