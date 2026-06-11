# PROC-IAM-001 — Mots de passe et authentification

**Version** : 0.1  
**Propriétaire** : Loïc DANIEL — RSSI

---

## 1. Politique mots de passe (utilisateurs Facturio)

| Règle | Implémentation actuelle | Cible |
|-------|-------------------------|-------|
| Longueur minimale | _À vérifier dans DTO auth_ | 12 caractères min. |
| Stockage | bcrypt coût 12 | ✅ `server/src/auth/` |
| Session | JWT cookie HTTP-only | ✅ |
| Expiration session | _À documenter_ | Config JWT |
| Tentatives / rate limit | Rate limiting routes auth | ✅ |

## 2. Comptes privilégiés (infra)

| Compte | Exigence |
|--------|----------|
| SSH prod | Clé publique uniquement (pas de mot de passe) |
| GitHub | MFA activé |
| Stripe | MFA activé |
| PostgreSQL | Mot de passe fort, accès local uniquement |

## 3. Gestion des secrets applicatifs

- `SECRETS_ENCRYPTION_KEY` : 64 caractères hex, **obligatoire en production**.
- Rotation : documenter procédure si compromission (re-chiffrement secrets org).
- Jamais de secrets dans Git (`.env` ignoré).

## 4. Réinitialisation mot de passe

_Décrire le flux actuel :_ _À compléter_

## 5. Revue

Annuelle ou après incident — vérifier conformité aux règles ci-dessus.
