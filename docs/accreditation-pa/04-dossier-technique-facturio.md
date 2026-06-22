# Dossier technique — module e-invoicing PrestaFacture

## Stack

| Couche | Technologie |
|--------|-------------|
| API | NestJS 11, TypeScript |
| Base | Prisma — SQLite (dev) / PostgreSQL (prod) |
| Frontend | React 19, MUI, Vite |
| Auth | JWT cookie HTTP-only |

## Modèle de données (extrait)

### Organization

- `siret`, `siren`, `vatNumber`, adresse complète — contrôle conformité émetteur.

### Client

- `siren`, `isCompany`, `vatNumber`, `address`, `countryCode` — contrôle B2B.

### Invoice

- `eInvoiceStatus` : `NOT_READY` | `READY` | `XML_GENERATED` | `PENDING_PA` | `SENT` | `DELIVERED` | `ERROR`
- `eInvoiceGeneratedAt`, `eInvoiceXmlHash`

## Module serveur `server/src/e-invoicing/`

| Fichier | Rôle |
|---------|------|
| `e-invoicing-compliance.service.ts` | Scores et checklists org / client / facture |
| `factur-x-generator.service.ts` | XML profil simplifié EN 16931 |
| `e-invoicing.service.ts` | Orchestration, plans SaaS, persistance statut |
| `e-invoicing.controller.ts` | API REST |

## API REST (authentification requise)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/e-invoicing/readiness` | Préparation organisation + calendrier réforme |
| GET | `/api/e-invoicing/invoices/:id/readiness` | Préparation facture + sous-scores client/org |
| GET | `/api/e-invoicing/invoices/:id/factur-x` | Téléchargement XML (plan `PRO_EFACTURE` ou `AGENCY`) |

## Règles métier conformité

### Organisation (émetteur)

- Nom, SIRET 14 chiffres, SIREN 9 chiffres (ou dérivé SIRET), adresse, pays.

### Client B2B

- `isCompany = true`, SIREN 9 chiffres, adresse ; TVA recommandée UE.

### Facture

- Statut ≠ brouillon, `sentAt` renseigné, au moins une ligne, org et client prêts.

## Plans SaaS

| Plan | eInvoicing |
|------|------------|
| FREE / PRO | Non |
| PRO_EFACTURE / AGENCY | Oui (export XML ; PA à venir) |

## Tests

- Unitaires : `*.spec.ts` dans `e-invoicing/`, `billing.service.spec.ts`
- E2E : `e-invoicing.e2e-spec.ts`
- CI : jobs `server-unit` et `server-e2e` (GitHub Actions)

## Limites connues (à traiter avant PA)

1. XML seul — pas de PDF/A-3 Factur-X conforme.
2. Pas de validation XSD officielle.
3. Pas d’envoi réseau ni annuaire SIREN PA.
4. Pas d’e-reporting automatisé.

## Variables d’environnement (prévision connecteur PA)

```env
E_INVOICING_ENABLED=false
E_INVOICING_PROVIDER=
E_INVOICING_API_URL=
E_INVOICING_API_KEY=
E_INVOICING_WEBHOOK_SECRET=
E_INVOICING_SANDBOX=true
```

## Références code

- `server/prisma/schema.prisma` — enum `EInvoiceStatus`
- `server/src/billing/saas-plan.limits.ts` — feature `eInvoicing`
- `frontend/src/modules/e-invoicing/EInvoicingReadinessPanel.tsx`
