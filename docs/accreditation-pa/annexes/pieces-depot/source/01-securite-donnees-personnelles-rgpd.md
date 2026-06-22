# DanielCraft — Sécurité des données à caractère personnel (RGPD art. 32)

**Éditeur** : Loïc DANIEL — DanielCraft  
**SIRET** : 823 417 050 000 23  
**Service** : PrestaFacture — https://prestafacture.com  
**Version** : 1.0 — juin 2026  
**Document à convertir en PDF signé** : `DanielCraft – Securite donnees personnelles RGPD – 202606.pdf`

---

## 1. Objet

Présentation des moyens mis en œuvre pour assurer la sécurité des données à caractère personnel traitées dans le cadre de l'activité de **Plateforme Agréée** (émission, transmission, réception de factures électroniques et transmission des données de facturation, transaction et paiement).

## 2. Périmètre

- Application SaaS **PrestaFacture** (API NestJS, frontend React)
- Données : comptes utilisateurs, organisations, clients, devis, factures, flux e-facture, journaux techniques
- Hébergement production : infrastructure **Union européenne** (serveurs DanielCraft — node10.lan / node12.lan, France)

## 3. Gouvernance

| Rôle | Responsable |
|------|-------------|
| Responsable de traitement (comptes PrestaFacture) | Loïc DANIEL — DanielCraft |
| RSSI / contact sécurité | Loïc DANIEL — contact@danielcraft.fr |
| DPO (contact) | contact@danielcraft.fr |

Système de management de la sécurité (ISMS) en cours de structuration pour certification **ISO/IEC 27001** (voir `annexes/isms/`).

## 4. Mesures techniques

### 4.1 Authentification et accès

- Authentification par **JWT** stocké en cookie **HTTP-only** / **Secure** en production
- Mots de passe hachés **bcrypt** (coût 12)
- **Rate limiting** sur routes d'authentification et routes publiques
- Isolation **multi-tenant** : chaque ressource métier liée à un `organizationId`

### 4.2 Chiffrement

- **TLS 1.2+** pour toutes les communications HTTPS (prestafacture.com)
- Secrets sensibles (clés Stripe prestataire, tokens ProspectLab) chiffrés en base **AES-256-GCM** lorsque `SECRETS_ENCRYPTION_KEY` est configuré
- Pas de stockage de numéros de carte bancaire (délégation **Stripe**)

### 4.3 Intégrité et traçabilité e-facture

- Empreinte **SHA-256** du XML généré (`eInvoiceXmlHash`)
- Horodatage de génération (`eInvoiceGeneratedAt`)
- Statuts de cycle de vie (`eInvoiceStatus`)
- Journal des transmissions PA (module en cours de déploiement)

### 4.4 Validation des entrées

- Validation systématique des DTO API via **class-validator**
- Contrôles métier conformité (SIREN, SIRET, mentions) avant génération Factur-X

### 4.5 Sauvegardes et disponibilité

- Sauvegardes base PostgreSQL production (procédure documentée — automatisation en cours)
- Plan de reprise d'activité : `annexes/isms/PLAN-PRA-001.md`

### 4.6 Gestion des vulnérabilités

- Tests automatisés CI (unitaires, e2e)
- Dependabot et audit dépendances npm (déploiement prévu)
- Correctifs de sécurité appliqués via processus de changement documenté

## 5. Mesures organisationnelles

- Politique de sécurité et registre des risques (`annexes/isms/`)
- Registre des traitements RGPD (`annexes/isms/REGISTRE_TRAITEMENTS_RGPD.md`)
- Procédure de gestion des incidents (`procedures/PROC-INC-001-incidents.md`)
- Contrats / DPA avec sous-traitants : Stripe, fournisseur email, hébergeur

## 6. Sous-traitants

| Sous-traitant | Finalité | Localisation |
|---------------|----------|--------------|
| Stripe | Paiements abonnement et factures clients | UE / politique Stripe |
| Fournisseur SMTP | Emails transactionnels | À documenter |
| Hébergeur / infra | Exécution PrestaFacture | Union européenne |

## 7. Droits des personnes

- Export des données compte : `GET /api/gdpr/export`
- Suppression compte : `POST /api/gdpr/delete-account`
- Politique de confidentialité : https://prestafacture.com/privacy

## 8. Amélioration continue

- Certification ISO/IEC 27001 en cours de préparation
- Pentest applicatif prévu avant mise en production du réseau PA
- Revue annuelle des mesures et mise à jour du présent document

---

**Loïc DANIEL**  
Représentant légal — DanielCraft  
Metz, le _______________
