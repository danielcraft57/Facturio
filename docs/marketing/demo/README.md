# Captures espace démo

Screenshots Playwright de l'espace démo partagé (lecture seule).

## Prérequis

```bash
npm run ensure-demo --prefix server
npm run start:all
cd frontend
npx playwright install chromium
```

## Lancer

Depuis la racine du monorepo :

```bash
npm run demo:capture
```

## Sortie

- Dossier : `docs/marketing/demo/captures/`
- Manifeste : `manifest.json` (liste des slugs capturés)

## CI (optionnel)

Workflow manuel GitHub Actions : **Demo captures** (`workflow_dispatch`).

- Fichier : `.github/workflows/demo-captures.yml`
- Artefact : `demo-captures-<sha>` (PNG + `manifest.json`, 14 jours)

## Contenu typique

- Pages publiques : landing, login (lien démo), `/essayer`
- App connectée : dashboard avec bandeau démo, clients, factures, devis, produits
- Modales : aperçu création facture / devis (interactif, sans enregistrement)
- Toast : tentative d'enregistrement bloquée en mode démo
