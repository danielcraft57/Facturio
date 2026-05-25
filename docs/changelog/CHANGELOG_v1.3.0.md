# Changelog v1.3.0 — Onboarding développeur & catalogue (mai 2026)

## Frontend (1.3.0)

- Assistant d'installation multi-étapes (`/installation`) avec sélection de stack technique
- Parcours inscription : confirmation email, encart compte en attente sur login/signup
- SEO par route (`VITE_APP_NAME`, `VITE_SITE_URL`), titres sans marque forcée en local
- Navigation publique : dashboard uniquement après email validé

## Backend (1.3.0)

- Catalogue templates (`organizationId: null`) + règles de matching (jusqu'à 22 prestations)
- API onboarding : prévisualisation et clonage du catalogue vers l'organisation
- Produits scopés par organisation ; garde `EmailVerifiedGuard` sur l'API
- Mot de passe oublié : réponse 200 systématique (anti-énumération)
- Nettoyage automatique des comptes non vérifiés expirés

## Migrations

- `20260526120000_catalog_personalization`
- `20260527120000_org_products_onboarding`
