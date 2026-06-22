# Audit API — usage mobile PrestaFacture

Inventaire des endpoints NestJS **déjà disponibles** (JWT Bearer) et recommandations pour le mobile.

## Légende

| Symbole | Signification |
|---------|----------------|
| ✅ | Utilisable tel quel en mobile (v0.1–v0.3) |
| ⚠️ | Utilisable avec contraintes (PDF binaire, SSE, OAuth…) |
| 🔧 | Endpoint dédié mobile recommandé (confort / perf) |
| ❌ | Hors scope app terrain (admin, webhooks, fiscalité lourde) |

---

## Auth — ` /auth`

| Méthode | Route | Mobile | Notes |
|---------|-------|--------|-------|
| POST | `/login` | ✅ | `deviceFingerprint` conseillé |
| POST | `/logout` | ✅ | Révoque session serveur |
| GET | `/me` | ✅ | Bootstrap profil |
| POST | `/verify-device` | ✅ | Deep link `facturio://` |
| POST | `/session/bootstrap` | ⚠️ | Utile si cookie web ; mobile = Bearer seul |
| POST | `/signup` | ✅ | Phase inscription mobile |
| POST | `/forgot-password` | ✅ | |
| POST | `/reset-password` | ✅ | |
| GET | `/google` | ❌ | OAuth redirect — phase ultérieure |
| POST | `/resend-verification` | ✅ | |

**🔧 Optionnel :** `POST /auth/mobile/register-push` — enregistrer token FCM/APNs (n’existe pas encore).

---

## Dashboard — `/dashboard`

| Méthode | Route | Mobile | Notes |
|---------|-------|--------|-------|
| GET | `/stats` | ✅ | KPI + `chartData` + `recentActivity` |

**🔧 Optionnel :** `GET /dashboard/stats/summary` — payload allégé (4 KPI + 12 points CA) si perf réseau faible.

---

## Factures — `/invoices` ou `/factures`

| Méthode | Route | Mobile | Notes |
|---------|-------|--------|-------|
| GET | `/` | ✅ | Liste paginée + filtres |
| GET | `/folder-counts` | ✅ | Badges onglets |
| GET | `/:id` | ✅ | Détail |
| GET | `/:id/pdf` | ⚠️ | Binaire — `expo-file-system` + `sharing` |
| POST | `/:id/send` | ✅ | Phase 2 |
| PATCH | `/:id` | ✅ | Édition |
| POST | `/` | ✅ | Création |
| PATCH | `/:id/document-flags` | ✅ | Lu / étoile / snooze |
| GET | `/:id/payments` | ✅ | Historique paiements |
| POST | `/:id/payments` | ✅ | Saisie paiement manuel |

---

## Devis — `/quotes` ou `/devis`

Même modèle que factures : `GET /`, `GET /:id`, `GET /:id/pdf`, `POST /:id/send`, `POST /:id/convert-to-invoice`, etc. — **tout ✅** pour parité web.

---

## Clients — `/clients`

| Méthode | Route | Mobile | Notes |
|---------|-------|--------|-------|
| GET | `/` | ✅ | Liste |
| GET | `/:id` | ✅ | Fiche |
| GET | `/:id/finance` | ⚠️ | Riche — écran dédié tablette |
| POST/PATCH/DELETE | | ✅ | CRUD phase 2 |

---

## Produits — `/products`

CRUD complet ✅ pour catalogue mobile.

---

## Paiements — `/payments`

| GET/POST/PATCH | `/` | ✅ | Liste et saisie paiements globaux |

---

## Organisation — `/organization`

| GET/PATCH | `/profile` | ✅ | Paramètres société |
| GET | `/siret-lookup/:siret` | ✅ | Formulaire client |

---

## Temps réel — `/realtime`

| GET SSE | `/stream` | ⚠️ | `EventSource` RN limité ; alternatives : polling `GET /invoices?updatedSince=`, ou **🔧** WebSocket `/realtime/ws` |

---

## Facturation SaaS — `/billing`, `/subscriptions`

⚠️ Stripe Checkout = souvent WebView ; lecture plan ✅ via endpoints existants.

---

## API publique — `/public` (clé API)

Destinée intégrations tierces, **pas** l’app mobile utilisateur (qui utilise JWT utilisateur).

---

## Modules peu prioritaires mobile

| Module | Raison |
|--------|--------|
| `/accounting`, `/taxes/*`, `/urssaf`, `/filings` | Complexité UI comptable |
| `/prospection`, `/prospects` | CRM avancé |
| `/e-invoicing` | Admin conformité |
| `/gdpr` | Web légal |
| `/webhooks` | Serveur à serveur |

---

## Synthèse

**~90 % du MVP mobile** peut s’appuyer sur l’API actuelle sans nouveau controller.

Endpoints **spécifiques** réellement utiles à planifier :

1. **Push notifications** — `POST /notifications/devices` (token + plateforme)
2. **Sync delta** — `GET /sync/changes?since=` (factures/devis/clients) pour offline partiel
3. **WebSocket** (optionnel) — alternative SSE pour refresh liste
4. **Assistant IA** (si LLM cloud) — `POST /assistant/chat` côté **serveur** (clés API jamais dans l’apk) ; voir [EXPO_NATIVE_MODULES.md](./EXPO_NATIVE_MODULES.md)
