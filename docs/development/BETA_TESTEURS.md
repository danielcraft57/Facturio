# Programme beta testeurs

Programme d'invitation limité : **3 mois d'accès complet** (plan Agence par défaut) sans passer par Stripe.

Les codes sont **réutilisables** (même code partagé sur les réseaux) mais limités par :
- le **plafond global** du programme (`BETA_TESTER_MAX_SLOTS`) ;
- un **plafond par code** (`maxRedemptions`, optionnel) ;
- une **date d'expiration** du code (`expiresAt`, optionnel) ;
- la **date de fin du programme** (`BETA_TESTER_PROGRAM_ENDS_AT`, optionnel).

Une organisation ne peut activer le beta **qu'une seule fois** (`betaTesterAt`).

## Prérequis

- Migrations appliquées :
  - `20260612120000_beta_invite_codes`
  - `20260612140000_beta_invite_multi_use` (codes multi-usage + table `BetaInviteRedemption`)
- Variable `DATABASE_URL` configurée dans `server/.env` (SQLite en dev, PostgreSQL en prod).

## Configuration serveur

Variables optionnelles dans `server/.env` (valeurs par défaut entre parenthèses) :

| Variable | Défaut | Description |
|----------|--------|-------------|
| `BETA_TESTER_MAX_SLOTS` | `20` | Nombre maximum d'organisations ayant activé le beta |
| `BETA_TESTER_DURATION_DAYS` | `90` | Durée d'accès complet après activation |
| `BETA_TESTER_PLAN` | `AGENCY` | Plan accordé : `AGENCY`, `PRO` ou `PRO_EFACTURE` |
| `BETA_TESTER_PROGRAM_ENDS_AT` | _(vide)_ | Date ISO de fin des inscriptions beta (ex. `2026-12-31`) |
| `BETA_TESTER_CODE_MIN_LENGTH` | `3` | Longueur minimale d'un code |
| `BETA_TESTER_CODE_MAX_LENGTH` | `6` | Longueur maximale d'un code |

En production (`node10.lan`), ajouter ces variables dans le `.env` applicatif puis redémarrer le service `facturio` si vous modifiez les plafonds.

## Créer et gérer des codes

Toutes les commandes se lancent depuis `server/` :

```bash
cd server

# Code personnalisé pour une campagne réseaux sociaux
npm run beta:codes -- create DEV26 --label="Twitter juin 2026"

# Plusieurs codes d'un coup
npm run beta:codes -- create FACTIO SHIP26 --label="LinkedIn"

# Codes aléatoires courts (vocabulaire dev)
npm run beta:codes -- random 3 --label="Campagne email"

# Limiter les utilisations d'un code précis
npm run beta:codes -- create MVP26 --max=50 --expires=2026-09-30

# Lister tous les codes ou seulement les actifs
npm run beta:codes -- list
npm run beta:codes -- list --active

# Synthèse : plafond global, inscrits, places restantes, codes campagne
npm run beta:codes -- stats

# Désactiver / réactiver un code sans le supprimer
npm run beta:codes -- disable DEV26
npm run beta:codes -- enable DEV26
```

Format des codes : **3 à 6 caractères** (A-Z, 0-9), personnalisables (`DEV26`, `FACTIO`, `SHIP26`…). Idéal pour les réseaux sociaux.

Les anciens codes `FACTURIO-BETA-XXXXXX` ne sont plus valides : recréer des codes courts via la CLI.

### Production

Sur le serveur applicatif :

```bash
cd /opt/facturio/server
npm run beta:codes -- create DEV26 --label="Twitter"
npm run beta:codes -- stats
```

## Stats publiques (site marketing)

Endpoint public (sans auth) :

```
GET /api/billing/beta-program/stats
```

Retourne notamment : places restantes, nombre d'inscrits, codes campagne actifs (code + label + utilisations).

Le bandeau `BetaTesterPromo` sur les pages marketing consomme cet endpoint pour afficher la jauge et les codes cliquables.

## Parcours testeur

### Option 1 : lien direct (recommandé)

Envoyer un lien avec le code en paramètre (champ prérempli à l'inscription) :

```
https://facturio.danielcraft.fr/signup?beta=DEV26
```

Variante acceptée : `?code=DEV26`.

**Inscription Google** : même page `/signup?beta=DEV26` — cochez les CGU, puis « Continuer avec Google ». Le code est transmis pendant la redirection OAuth et activé à la création du compte (comme l'inscription email).

À l'activation beta :
- **Popin app** : message de remerciement dédié (remplace la popin « obtenir un code beta »).
- **Emails** : confirmation d'inscription (Google ou email + lien de validation) puis email **bienvenue beta** (détail plan, questionnaire si `BETA_TESTER_SURVEY_URL`).
- Après l'assistant **Installation**, un email récap liste le catalogue installé.

**Notifications in-app** (`LifecycleNotifier`) : quota atteint / bientôt atteint, jalons beta (2 mois, 1 mois, 7 jours, fin), toast catalogue installé.

**Emails cron beta** (9h serveur) : rappels J-60, J-30, J-7 et fin de période. Désactiver : `BETA_LIFECYCLE_EMAILS_ENABLED=0`.

**Email quota Free** : une fois par type/mois au premier blocage. Désactiver : `FREE_QUOTA_EMAILS_ENABLED=0`.

Prévisualiser les templates : `cd server && npm run preview:emails`.

Si le code est refusé (complet, expiré…), retour sur `/signup` avec le message d'erreur et le code toujours prérempli.

### Option 2 : inscription manuelle

1. Créer un compte sur `/signup`.
2. Coller le code court dans le champ **Code beta testeur (optionnel)**.
3. Valider l'inscription : le code est activé automatiquement si le compte est éligible.

### Option 3 : compte déjà créé

1. Se connecter.
2. Aller dans **Paramètres → Abonnement**.
3. Saisir le code dans la section **Code beta testeur** et cliquer sur **Activer le code**.

## Règles métier

- **Un code = plusieurs organisations** tant que le plafond global et le `maxRedemptions` du code ne sont pas atteints.
- **Une organisation = un seul passage beta** (`betaTesterAt` renseigné une fois ; table `BetaInviteRedemption` avec `organizationId` unique).
- Le code beta est réservé aux comptes **plan Free** sans abonnement Stripe actif.
- Le **plafond global** (`BETA_TESTER_MAX_SLOTS`) compte les organisations avec `betaTesterAt` renseigné.
- À l'expiration (`saasPlanExpiresAt`), l'organisation repasse sur les règles du plan Free (quotas, garde-fous).
- Un code peut être **désactivé** (`active: false`) sans être supprimé.

## API (référence)

| Méthode | Route | Auth | Rôle |
|---------|-------|------|------|
| `GET` | `/api/billing/beta-program/stats` | Publique | Stats programme + codes campagne actifs |
| `GET` | `/api/billing/beta-invite/validate?code=…` | Publique | Vérifier un code avant inscription |
| `POST` | `/api/billing/beta-invite/redeem` | JWT | Activer un code pour l'org connectée |

Corps `redeem` : `{ "code": "DEV26" }`.

À l'inscription, le champ `betaInviteCode` du `POST /api/auth/signup` déclenche la même validation puis le redeem si le code est valide.

## Site public (marketing)

Bandeau **Programme beta testeurs** sur les pages hors connexion (accueil, tarifs, fonctionnalités, prestations, réforme 2026). Affiche les places restantes et les codes campagne actifs.

Bouton **S'inscrire avec un code beta** → `/signup`.

Contenu centralisé dans `frontend/src/modules/marketing/constants/siteContent.ts` (`BETA_PROGRAM`, `CTA.betaSignup`).

## Fichiers utiles

| Fichier | Rôle |
|---------|------|
| `server/scripts/generate-beta-invite-codes.js` | CLI création / list / stats / enable / disable |
| `server/src/billing/beta-tester.service.ts` | Validation, redeem, statut beta, stats publiques |
| `server/src/billing/beta-tester.config.ts` | Lecture des variables d'environnement |
| `server/src/billing/beta-tester-code.util.ts` | Normalisation et validation format code |
| `server/prisma/schema.prisma` | Modèles `BetaInviteCode`, `BetaInviteRedemption`, `Organization.betaTesterAt` |
| `frontend/src/modules/marketing/components/BetaTesterPromo.tsx` | Bandeau + stats temps réel |
| `frontend/src/modules/app/pages/SignupPage.tsx` | Champ code + préremplissage URL `?beta=` |
| `frontend/src/modules/account/BillingPlanSection.tsx` | Activation code après inscription |

## Modèle de post réseaux sociaux

```
🚀 Beta Facturio : 3 mois gratuits, accès complet (plan Agence).

Code : DEV26
→ facturio.danielcraft.fr/signup?beta=DEV26

Places limitées. Devis, factures, compta — pour freelances dev.
```

Adaptez le code et le lien selon la campagne. Ne promettez pas de fonctionnalités non livrées (PA connectée, sync bancaire, etc.).

## Retours testeurs (email + questionnaire)

- **Email automatique** : envoyé par SMTP Facturio à l'activation d'un code beta (`EmailService.sendBetaTesterWelcome`), avec prénom admin, plan, date de fin, code campagne.
- **Testeurs déjà inscrits** : `cd server` puis `npm run beta:welcome-emails` (options `--dry-run`, `--force`).
- **Questionnaire** : créer le Google Form (structure dans [`BETA_TESTEURS_EMAIL_QUESTIONNAIRE.md`](./BETA_TESTEURS_EMAIL_QUESTIONNAIRE.md)), coller l'URL dans `BETA_TESTER_SURVEY_URL`.
- **Réponses** : `BETA_TESTER_REPLY_EMAIL` (Gmail Valentine) ou `COMPANY_EMAIL`.

Com' sous **Valentine Coubertain**. Ne pas promettre PA connectée, sync bancaire, etc.

## Dépannage

| Symptôme | Cause probable | Action |
|----------|----------------|--------|
| `Code d'invitation inconnu` | Code mal saisi ou jamais créé en base | `npm run beta:codes -- list` |
| `Ce code n'est plus actif` | `active: false` | `npm run beta:codes -- enable DEV26` |
| `Ce code a atteint sa limite` | `maxRedemptions` atteint | Augmenter `--max` ou créer un nouveau code |
| `programme beta testeurs est complet` | `BETA_TESTER_MAX_SLOTS` atteint | Augmenter le plafond ou attendre |
| `réservé aux comptes sur le plan Free` | Org déjà Pro / Stripe actif | Compte neuf ou annuler l'abo Stripe d'abord |
| `déjà bénéficié du programme beta` | `betaTesterAt` déjà set | Normal : une org ne passe qu'une fois |
| Script : `DATABASE_URL manquant` | Pas de `.env` dans `server/` | Copier `env.example` → `.env` |

## Tests

```bash
cd server
npm run test:unit -- --testPathPattern=beta-tester.service.spec
```
