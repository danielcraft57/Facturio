# Scripts marketing — captures & démos

## Prérequis

```bash
npm run seed:playwright          # compte playwright@facturio.local / playwright
npm run start:all                # API + frontend
cd frontend && npm i -D playwright && npx playwright install chromium
```

> **Note** : Playwright est une dépendance de `frontend/`, pas de la racine. Les scripts `marketing:*` le chargent depuis `frontend/node_modules` automatiquement.

**Config** : copier `docs/marketing/env.marketing.example` → `docs/marketing/.env` (viewport 1920×2400, scroll clips, format JPEG, etc.).

## Captures écrans (landing showcase)

```bash
npm run marketing:capture
**Vidéo** : navigation UX (mega-menus, barre, sidebar paramètres) — module `marketing-nav-ux.mjs`.

```bash
npm run marketing:clips              # showreel + auto-trim du noir initial
npm run marketing:clips -- --split   # même session → clips découpés via ffmpeg
```
npm run marketing:clean      # supprime screenshots-temp / tts-output
```

Génère ~20 vues (dashboard, clients, produits catalogue/liste/compact, factures, devis, compta, paramètres…) dans :

- `docs/marketing/pub-2026/captures/`
- `frontend/public/images/marketing/overflow/captures/` (avec `--sync-public`)

## Démo animée devis / facture

```bash
npm run marketing:workflow
# ou seulement devis :
node docs/marketing/scripts/record-workflow-demo.mjs --quote-only
```

Produit :

- PNG pas-à-pas → `frontend/public/images/marketing/workflow/`
- Vidéos WebM → `docs/marketing/pub-2026/videos/workflow/`  
- Clips par plan (storyboard) → `npm run marketing:clips` → `pub-2026/videos/<variant>/`

La landing consomme les PNG via `MarketingWorkflowDemo` (onglets Devis / Facture).

## TTS voix pub

Script dans le dépôt : `scripts/marketing/generate_facturio_marketing_tts.py`  
Entrée : `scripts/marketing/facturio-publicite-2026.json`

```bash
pip install edge-tts pydub
npm run marketing:tts
```

Voir `scripts/marketing/README.md`.

## Variables

| Variable | Défaut |
|----------|--------|
| `FACTURIO_BASE_URL` | `http://localhost:5173` |
| `FACTURIO_TEST_EMAIL` | `playwright@facturio.local` |
| `FACTURIO_TEST_PASSWORD` | `playwright` |
