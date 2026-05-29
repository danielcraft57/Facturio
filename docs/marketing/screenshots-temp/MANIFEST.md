# Manifeste des captures — Facturio marketing

| Fichier | Écran | Usage landing / pub |
|---------|-------|---------------------|
| `01-factures-liste.png` | Liste factures, dossiers, tags | Hero « gestion factures », preuve produit |
| `02-factures-selection-bulk.png` | Sélection multiple + barre Archiver | Feature productivité / bulk |
| `03-menu-commercial.png` | Mega-menu Commercial | Navigation, crédibilité « tout-en-un » |
| `04-menu-finance.png` | Mega-menu Finance | Angle pré-compta / fiscalité |
| `05-dashboard.png` | Tableau de bord KPI + graphiques | Remplacer ou compléter `HeroDashboardMock` |
| `06-parametres.png` | Grille paramètres (e-facture, API) | Conformité 2026, confiance |
| `07-client-finance.png` | Fiche client synthèse finance | B2B, suivi encours |
| `08-devis-liste.png` | Liste devis | Cycle commercial |
| `09-facture-detail.png` | Détail facture acompte + Stripe | Paiement en ligne |
| `10-devis-accepte-acompte.png` | Devis accepté, acompte/solde | Workflow forfait 30/70 |
| `11-modal-nouveau-devis.png` | Modal création devis | Onboarding « 10 min » |
| `12-modal-nouveau-client.png` | Modal client SIREN | Conformité B2B |
| `13-modal-nouvelle-facture.png` | Modal création facture | CTA inscription |

## Visuels générés (`generated/`)

| Fichier | Intention |
|---------|-----------|
| `facturio-hero-invoices.png` | Hero stylisé liste factures (sans données réelles) |
| `facturio-hero-dashboard.png` | Hero KPI / graphiques pour bandeau pub |
| `facturio-ad-devis-flow.png` | Vertical mobile — flux devis |

> Les visuels générés sont des **approximations IA** pour maquettes. Pour la pub finale, privilégier les captures Playwright (script `scripts/capture-overflow-screenshots.mjs`) ou les PNG `raw/` retouchés.

## Prochaine étape technique

1. Captures **full-page** (viewport 1440×900, hauteur document ×2) via Playwright.
2. Découpe / animation avec `OverflowScreenshotFrame` (voir `scripts/overflow-frame-demo.html`).
3. Intégration landing : remplacer `HeroDashboardMock` + `/images/facturio-*.png` statiques par assets réels floutés si besoin.
