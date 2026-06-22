# DanielCraft — Descriptif du dispositif d'authentification des utilisateurs

**Éditeur** : Loïc DANIEL — DanielCraft  
**Service** : PrestaFacture  
**Référence** : article 242 nonies F de l'annexe II au CGI  
**Version** : 1.0 — juin 2026  
**PDF signé** : `DanielCraft – Descriptif authentification – 202606.pdf`

---

## 1. Objet

Description des moyens mis en œuvre pour **vérifier l'identité** et la **qualité** de l'utilisateur et **sécuriser les conditions d'accès** à la plateforme PrestaFacture et à ses services d'émission / réception de factures électroniques.

## 2. Population utilisateurs

| Type | Description |
|------|-------------|
| Utilisateur inscrit | Prestataire (freelance, micro-entreprise, agence) — responsable de son organisation |
| Utilisateur invité | Multi-utilisateurs (plan Agence) — accès limité à une organisation |
| Accès public | Liens tokenisés devis / factures (lecture seule, pas d'émission PA) |

## 3. Inscription et identification

1. Création de compte avec **email** et **mot de passe**
2. Acceptation obligatoire **CGU** et **politique de confidentialité** (horodatage `termsAcceptedAt`, `privacyConsentAt`)
3. Association à une **organisation** (profil émetteur : SIRET, SIREN, adresse, TVA)
4. Vérification email (selon configuration production)

## 4. Authentification

| Mécanisme | Détail |
|-----------|--------|
| Protocole | Session via **JWT** signé |
| Stockage côté client | Cookie **HTTP-only**, **Secure**, **SameSite** en production |
| Mot de passe | Hachage **bcrypt** (facteur 12) — jamais stocké en clair |
| Expiration session | Configurable (JWT TTL) |
| Protection brute-force | **Rate limiting** sur `/api/auth/login` et routes sensibles |

## 5. Contrôle d'accès

- Chaque requête API authentifiée vérifie le JWT et l'**organizationId**
- Isolation stricte des données entre organisations (multi-tenant)
- Plans SaaS : fonctionnalités e-facture réservées aux paliers `PRO_EFACTURE` et `AGENCY`
- Endpoints e-invoicing protégés par garde d'authentification NestJS

## 6. Vérification de la qualité de l'utilisateur (émetteur)

Avant toute émission sur le réseau PA :

- Contrôle **SIRET** émetteur (14 chiffres)
- Contrôle **SIREN** client B2B (9 chiffres)
- Score de **conformité** affiché (organisation, client, facture)
- Blocage si données insuffisantes (`ForbiddenException`)

## 7. Sécurisation des accès administrateur

- Accès SSH serveurs production : clés / pare-feu (documenté dans ISMS)
- Comptes GitHub / Stripe : MFA recommandé
- Journalisation des actions sensibles : renforcement prévu (table `AuditLog`)

## 8. Déconnexion et révocation

- Déconnexion : invalidation côté client (cookie)
- Rotation des secrets organisation (clés Stripe) possible via interface
- Suppression de compte RGPD : `POST /api/gdpr/delete-account`

## 9. Évolution prévue

- Renforcement MFA pour comptes administrateurs
- Niveau de garantie **substantiel** des moyens d'identification (exigence réglementaire PA — à aligner sur référentiel ANSSI / eIDAS selon cadrage DGFiP)

---

**Loïc DANIEL** — DanielCraft  
Metz, le _______________
