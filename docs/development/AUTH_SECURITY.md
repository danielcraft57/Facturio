# Authentification et sécurité — PrestaFacture

## Page d’attente post-connexion

Après login (email ou Google), l’utilisateur passe par **`/auth/session`** :

1. Validation serveur (`POST /api/auth/session/bootstrap`)
2. Synchronisation du token SPA (cookie httpOnly + `localStorage`)
3. Redirection vers le tableau de bord (ou `?from=`)

## Sessions appareil (implémenté)

Modèle Prisma **`UserSession`** :

| Champ | Rôle |
|--------|------|
| `deviceFingerprint` | Empreinte navigateur (hash côté client) |
| `ipHash` | IP hashée (SHA-256 + sel `SESSION_IP_SALT`) |
| `userAgent` | Navigateur (tronqué 512 car.) |
| `trusted` / `verifiedAt` | Session validée |
| `revokedAt` | Déconnexion ou révocation |

**Déclenchement email** si :

- Session **active** (< 30 min) sur un **autre appareil**
- **Nouvel appareil** alors qu’un appareil de confiance existe déjà

Lien : `/auth/confirmer-appareil?token=…` → `POST /api/auth/verify-device`

Les autres sessions actives sont **révoquées** après confirmation.

JWT : claim `sid` (id de session) vérifié à chaque requête.

## Mesures existantes

- Rate limit login (5 / IP / 15 min), signup, forgot-password, resend-verification
- Validation DTO + suppression `<>`
- Cookie `httpOnly`, `sameSite: lax`, bcrypt 12 rounds
- Vérification email à l’inscription
- En-têtes `X-Frame-Options`, `X-Content-Type-Options`, etc.

## Double authentification (2FA) — à venir

Champs Prisma prévus : `User.twoFactorEnabled`, `User.twoFactorSecret`.

**Roadmap recommandée** :

1. TOTP (Google Authenticator / Authy) à l’activation dans Compte
2. Codes de secours (backup codes)
3. Exiger 2FA pour les rôles `ADMIN` (option org)

## Pistes complémentaires

- [ ] CAPTCHA sur signup / login après échecs
- [ ] Helmet + CSP stricte en production
- [ ] Rate limit Redis (multi-instance)
- [ ] Liste des sessions dans Compte → révoquer un appareil
- [ ] Aligner durée cookie (7 j) et JWT (24 h) ou refresh token

## Migration

```bash
cd server && npx prisma migrate deploy
# ou en dev :
npx prisma migrate dev
```
