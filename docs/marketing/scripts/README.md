# Scripts marketing — captures & démos

## Prérequis

```bash
npm run seed:playwright          # compte playwright@facturio.local / playwright
npm run start:all                # API + frontend
cd frontend && npx playwright install chromium
```

## Captures écrans (landing showcase)

```bash
npm run marketing:capture
```

Génère ~20 vues (dashboard, clients, produits catalogue/liste/compact, factures, devis, compta, paramètres…) dans :

- `docs/marketing/screenshots-temp/captures/`
- `frontend/public/images/marketing/overflow/captures/` (servi par Vite)

## Démo animée devis / facture

```bash
npm run marketing:workflow
# ou seulement devis :
node docs/marketing/scripts/record-workflow-demo.mjs --quote-only
```

Produit :

- PNG pas-à-pas → `frontend/public/images/marketing/workflow/`
- Vidéos WebM brutes → `docs/marketing/screenshots-temp/videos/` (montage CapCut / DaVinci)

La landing consomme les PNG via `MarketingWorkflowDemo` (onglets Devis / Facture).

## Variables

| Variable | Défaut |
|----------|--------|
| `FACTURIO_BASE_URL` | `http://localhost:5173` |
| `FACTURIO_TEST_EMAIL` | `playwright@facturio.local` |
| `FACTURIO_TEST_PASSWORD` | `playwright` |
