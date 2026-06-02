# Roadmap — Facturio Mobile

Application React Native (Expo) pour **tablette et mobile**, alignée sur la charte visuelle Facturio (maquettes dashboard + factures).

## Phase 0 — Fondations (en cours)

- [x] Dossier `mobile/` dans le monorepo, branche `feature/mobile-react-native`
- [x] Thème (couleurs navy / teal, typo Inter-like, composants de base)
- [x] Client API + auth email/mot de passe → JWT Bearer
- [x] Écran connexion + shell navigation (drawer tablette / tabs mobile)
- [x] Écrans placeholder : tableau de bord, liste factures
- [x] Documentation (`README`, `AUTH`, `API`, `DESIGN`)

## Phase 1 — MVP lecture seule

| Écran | API | Priorité |
|-------|-----|----------|
| Tableau de bord (KPI + graphiques) | `GET /dashboard/stats` | P0 |
| Liste factures (filtres, pagination) | `GET /invoices` | P0 |
| Détail facture | `GET /invoices/:id` | P0 |
| Liste devis | `GET /quotes` | P1 |
| Liste clients | `GET /clients` | P1 |
| Profil / déconnexion | `GET /auth/me`, `POST /auth/logout` | P0 |

**Livrables :** données réelles, pull-to-refresh, gestion erreurs réseau, états vides.

## Phase 2 — Actions métier

- Création / édition facture (formulaire adapté mobile)
- Envoi facture par email
- Téléchargement PDF (`GET /invoices/:id/pdf`)
- Notifications push (paiement reçu, facture en retard) — à cadrer côté backend

## Phase 3 — Expérience tablette

- Sidebar persistante ≥ 768 px (layout 2 colonnes pour graphiques)
- Split view détail facture (liste + panneau)
- Clavier externe / raccourcis basiques

## Phase 4 — Qualité & distribution

- Tests unitaires services (`auth`, `apiClient`)
- Tests E2E Detox ou Maestro (login → dashboard)
- Build EAS (Android APK/AAB, iOS TestFlight)
- Deep links (`facturio://auth/verify-device?token=…`)

## Hors scope initial

- OAuth Google (redirect mobile complexe — phase ultérieure)
- Mode offline complet
- Scan OCR de factures

## Jalons indicatifs

| Jalon | Contenu |
|-------|---------|
| **v0.1** | Auth + dashboard + liste factures (lecture) |
| **v0.2** | Détail facture + clients + devis |
| **v0.3** | Création facture + PDF |
| **v1.0** | Stores publics + CI EAS |

## Dépendances backend

- JWT via header `Authorization: Bearer` (déjà supporté par `JwtStrategy`)
- `deviceFingerprint` recommandé à la connexion (sessions / anti-usurpation)
- CORS : autoriser l’origine Expo dev (`exp://`, tunnel) si appels directs sans proxy
