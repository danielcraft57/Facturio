# Changelog - Validation email et sécurité renforcée

## Date : 21 février 2026

## ✅ Fonctionnalités implémentées

### 1. Validation par email (inscription) ✅

**Fichiers créés/modifiés** :
- `server/prisma/schema.prisma` (ajout champs `emailVerificationToken`, `emailVerificationExpires`)
- `server/src/auth/auth.service.ts` (logique de vérification email)
- `server/src/auth/auth.controller.ts` (endpoints `verify-email`, `resend-verification`)
- `server/src/common/email.service.ts` (templates HTML pour vérification email)
- `frontend/src/modules/app/pages/VerifyEmailPage.tsx` (nouvelle page)
- `frontend/src/services/authService.ts` (méthodes `verifyEmail`, `resendVerificationEmail`)
- `frontend/src/modules/app/pages/SignupPage.tsx` (gestion besoin vérification)
- `frontend/src/modules/app/pages/LoginPage.tsx` (bouton renvoyer email)

**Fonctionnalités** :
- Envoi automatique d'email de vérification à l'inscription
- Token de vérification valide 24h
- Endpoint GET `/auth/verify-email?token=xxx` pour vérifier depuis le lien email
- Endpoint POST `/auth/verify-email` pour vérifier via body
- Endpoint POST `/auth/resend-verification` pour renvoyer l'email
- Page frontend `/verifier-email/:token` avec feedback visuel
- Blocage de l'accès aux routes protégées si email non vérifié
- Blocage de la connexion si email non vérifié

**Templates email** :
- Template HTML professionnel pour vérification email (style PrestaFacture)
- Template HTML amélioré pour réinitialisation mot de passe
- Layout HTML commun réutilisable avec mentions légales

**Migration** :
- Migration Prisma `20260221170003_add_email_verification` créée et appliquée

### 2. Suppression automatique des comptes non vérifiés ✅

**Fichiers créés** :
- `server/src/common/cleanup-unverified-users.service.ts` (nouveau)

**Fonctionnalités** :
- Cron job exécuté toutes les heures
- Supprime les comptes avec `emailVerified: false` créés il y a plus de 24h
- Supprime automatiquement les organisations orphelines
- Logging des suppressions pour traçabilité

**Dépendance** :
- `@nestjs/schedule` installé et configuré

### 3. Protection anti-force brute (Rate Limiting) ✅

**Fichiers créés** :
- `server/src/common/rate-limit.middleware.ts` (nouveau)

**Fonctionnalités** :
- Rate limiting sur login : 5 tentatives par IP / 15 minutes
- Rate limiting sur signup : 3 tentatives par IP / heure
- Rate limiting sur password reset : 3 tentatives par email / heure
- Réinitialisation automatique du compteur après connexion réussie
- Messages d'erreur clairs pour l'utilisateur

**Architecture** :
- Service `RateLimitService` injectable pour réutilisation
- Middleware appliqué sur routes `/auth/login`, `/auth/signup`, `/auth/forgot-password`
- Stockage en mémoire (Map) - en production, utiliser Redis pour distribué

### 4. Protection XSS et validation stricte ✅

**Fichiers modifiés** :
- `server/src/auth/dto/login.dto.ts` (validation renforcée)
- `server/src/auth/dto/signup.dto.ts` (validation renforcée)

**Fonctionnalités** :
- Sanitization des inputs (suppression caractères `<` et `>`)
- Trim automatique des emails et noms
- Validation stricte des emails (format, longueur max 255)
- Validation stricte des mots de passe (min 6, max 128, caractères ASCII uniquement)
- Validation longueur des noms (max 100 caractères)
- Validation longueur organisation (max 200 caractères)
- Messages d'erreur détaillés pour chaque validation

**Protection XSS** :
- Suppression des caractères dangereux dans `firstName`, `lastName`, `organizationName`
- Transformation automatique des emails en lowercase
- Validation regex pour mots de passe (caractères ASCII imprimables uniquement)

### 5. Blocage d'accès si email non vérifié ✅

**Fichiers modifiés** :
- `server/src/auth/strategies/jwt.strategy.ts` (vérification `emailVerified`)
- `server/src/auth/guards/jwt-auth.guard.ts` (ajout routes publiques)

**Fonctionnalités** :
- Vérification `emailVerified` dans la stratégie JWT
- Blocage de toutes les routes protégées si email non vérifié
- Message d'erreur clair : "Veuillez vérifier votre adresse email pour accéder à votre compte"
- Routes publiques ajoutées : `/auth/verify-email`, `/auth/resend-verification`

### 6. Améliorations UI/UX ✅

**Fichiers modifiés** :
- `frontend/src/modules/app/components/PublicLayout.tsx` (navbar optimisée)
- `frontend/src/modules/app/pages/LoginPage.tsx` (bouton œil pour mot de passe)
- `frontend/src/modules/app/pages/SignupPage.tsx` (bouton œil pour mots de passe)
- `frontend/src/modules/app/pages/ResetPasswordPage.tsx` (bouton œil pour mots de passe)

**Fonctionnalités** :
- Navbar : remplacement des boutons par des liens texte avec style "pill" pour Inscription
- Boutons œil pour afficher/masquer les mots de passe sur tous les formulaires
- Feedback visuel sur la page de vérification email
- Message de succès après inscription avec redirection vers login
- Bouton "Renvoyer l'email de confirmation" sur la page de login si erreur

## 📝 Documentation

**Fichiers modifiés** :
- `docs/planning/AUTH_AND_PROFILES.md` (ajout validation email, sécurité)
- `docs/api/API.md` (ajout section authentification complète)
- `server/env.example` (documentation SMTP améliorée)

## 🔒 Sécurité

### Mesures implémentées

1. **Validation email obligatoire** : Aucun accès sans vérification
2. **Rate limiting** : Protection contre force brute
3. **Sanitization XSS** : Nettoyage des inputs utilisateur
4. **Validation stricte** : DTOs avec règles strictes
5. **Suppression automatique** : Comptes non vérifiés supprimés après 24h
6. **Tokens sécurisés** : Tokens de vérification avec expiration
7. **Cookies HTTP-only** : Déjà en place pour les tokens JWT

### Configuration SMTP

Variables d'environnement requises :
```env
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
MAIL_FROM=no-reply@example.com
MAIL_FROM_NAME=PrestaFacture
FRONTEND_URL=http://localhost:5173
```

## 🧪 Tests

À venir :
- Tests unitaires pour `CleanupUnverifiedUsersService`
- Tests E2E pour le flux de vérification email
- Tests de rate limiting
- Tests de validation XSS

## 📦 Dépendances ajoutées

- `@nestjs/schedule` : Pour les cron jobs

## 🔄 Migration

Migration Prisma créée :
- `20260221170003_add_email_verification` : Ajout champs `emailVerificationToken` et `emailVerificationExpires` au modèle User

## 🎨 Templates email

Templates HTML professionnels créés :
- Vérification email : Design PrestaFacture avec bouton CTA
- Réinitialisation mot de passe : Design cohérent avec vérification
- Layout commun : En-tête avec gradient, footer avec mentions légales

## 📋 Prochaines étapes

- [ ] Tests unitaires et E2E
- [ ] Rate limiting distribué avec Redis (production)
- [ ] Monitoring des suppressions de comptes
- [ ] Statistiques de vérification email
- [ ] Expiration configurable des tokens (actuellement 24h fixe)
