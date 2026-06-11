# Inventaire — code, pages et infra à modifier (PA dédiée + ISO)

**Objectif** : PA **DanielCraft / Facturio** (pas partenaire) + conformité ISO 27001.  
**Dernière mise à jour** : juin 2026  
**Documents liés** : [09-PARCOURS_COMPLET_PA_ISO27001.md](./09-PARCOURS_COMPLET_PA_ISO27001.md) · [annexes/isms/](./annexes/isms/)

Légende : ✅ fait · 🔄 partiel · ☐ à faire

---

## Synthèse rapide

| Zone | État | Effort estimé |
|------|------|---------------|
| Module e-invoicing (backend) | 🔄 ~40 % | Élevé |
| Connecteur réseau PA / PPF | ☐ mock seulement | Très élevé |
| Pages app (paramètres, facture) | 🔄 UI partielle | Moyen |
| Pages marketing / légal | 🔄 texte « partenaire » | Faible (après immatriculation) |
| Modèle données (Prisma) | 🔄 champs de base | Moyen |
| Sécurité / ISO (infra + logs) | 🔄 technique partielle | Moyen |
| Mobile | ☐ pas d'e-facture | Moyen (optionnel v1) |

---

## A. Backend — algorithmes et services

### A.1 Module existant `server/src/e-invoicing/`

| Fichier | Rôle actuel | Modification pour PA dédiée | Statut |
|---------|-------------|---------------------------|--------|
| `factur-x-generator.service.ts` | XML simplifié maison, namespace `urn:facturio:einvoice:1.0` | Réécrire : CII/UBL officiel ou lib Factur-X ; PDF/A-3 embarqué ; validation XSD/Schematron | ☐ |
| `e-invoicing-compliance.service.ts` | Score org/client/facture | Ajouter checks mentions réforme, adresse livraison, catégorie opération, blocage envoi sans SIREN | 🔄 |
| `e-invoicing.service.ts` | Orchestration, submit mock | Journal transmissions ; statuts lifecycle complets ; brancher **passerelle PPF** au lieu de mock | 🔄 |
| `pa-partner.client.ts` | Client HTTP partenaire + **mode mock** | **Remplacer** par `ppf-gateway.client.ts` ou `pa-network.service.ts` (émission, réception, annuaire, e-reporting) | ☐ |
| `e-invoicing.controller.ts` | REST readiness, factur-x, submit-pa | Routes : webhooks entrants, statuts, annuaire SIREN, journal audit, e-reporting | 🔄 |
| `reform-schedule.util.ts` | Calendrier réforme | OK — maintenance dates si loi change | ✅ |
| `e-invoicing.module.ts` | Wiring NestJS | Enregistrer nouveaux services PPF, réception, e-reporting | 🔄 |

### A.2 Nouveaux modules à créer (PA opérateur)

| Module proposé | Responsabilité | Priorité |
|----------------|----------------|----------|
| `server/src/e-invoicing/ppf/` | Client API PPF (sandbox + prod), auth, retry | P0 |
| `server/src/e-invoicing/directory/` | Annuaire SIREN, routage destinataire | P0 |
| `server/src/e-invoicing/inbound/` | Webhook réception factures fournisseurs, parsing entrant | P0 |
| `server/src/e-invoicing/ereporting/` | Agrégation B2C / export / paiements | P1 |
| `server/src/e-invoicing/transmission-log/` | Table + service journal audit envois | P0 |
| `server/src/audit-log/` (transverse ISO) | Logs actions admin / accès sensibles | P1 ISO |

### A.3 Factures et PDF

| Fichier / zone | Modification | Statut |
|----------------|--------------|--------|
| Service génération PDF facture (`server/src/invoices/`) | Mentions obligatoires réforme 2026 sur PDF | ☐ |
| Modèle `Invoice` / DTOs | Champs mentions, adresse livraison, catégorie opération | ☐ |
| Envoi email facture | Pièce jointe Factur-X PDF/A-3 (pas seulement PDF classique) | ☐ |

### A.4 Clients et organisation

| Fichier | Modification | Statut |
|---------|--------------|--------|
| `server/src/clients/` DTOs + validation | SIREN obligatoire avant submit PA ; adresse livraison | 🔄 |
| `server/src/organizations/` | Config mode PA (sandbox/prod), identifiants immatriculation | ☐ |
| `server/src/config/config.service.ts` | Variables `PPF_*`, `E_INVOICING_*` (remplacer `PA_PARTNER_*`) | 🔄 |

### A.5 RGPD et sécurité (ISO)

| Fichier | Modification | Statut |
|---------|--------------|--------|
| `server/src/gdpr/` | Délai grâce suppression ; traçabilité demandes | 🔄 |
| `server/src/crypto/secrets-crypto.service.ts` | Procédure rotation clé documentée | 🔄 |
| Middleware logging | Journal requêtes sensibles (admin, export GDPR, submit PA) | ☐ |
| Auth | MFA admin (option ISO) | ☐ |

### A.6 Compta (réception fournisseurs)

| Fichier | Modification | Statut |
|---------|--------------|--------|
| `server/src/accounting/` | Import facture entrante PA → écriture achat | ☐ |

### A.7 Tests

| Fichier | Modification | Statut |
|---------|--------------|--------|
| `e-invoicing.e2e-spec.ts` | Scénarios submit PPF sandbox, statuts, idempotence | 🔄 |
| `factur-x-generator.service.spec.ts` | Valider XML contre schéma officiel | ☐ |
| Nouveaux `*.spec.ts` | PPF client, inbound, transmission log | ☐ |

---

## B. Modèle de données (Prisma)

Fichiers : `server/prisma/schema.prisma`, `server/prisma/postgresql/schema.prisma`

| Modèle / champ | Besoin PA / ISO | Statut |
|----------------|-----------------|--------|
| `Invoice.eInvoiceStatus` | Étendre cycle : `SENT`, `DELIVERED`, `REJECTED`… | 🔄 enum partiel |
| `Invoice.eInvoicePaExternalId` | ID réseau PPF / traçabilité | ☐ |
| `Invoice.eInvoiceSubmittedAt` | Horodatage envoi | ☐ |
| `Invoice.eInvoiceRejectionReason` | Motif rejet PA | ☐ |
| `EInvoiceTransmissionLog` (nouveau) | Audit : orgId, invoiceId, payload hash, statut, horodatage | ☐ |
| `InboundSupplierInvoice` (nouveau) | Factures fournisseurs reçues | ☐ |
| `Organization.ppfSandboxMode` | Config environnement | ☐ |
| `Organization.paImmatriculationNumber` | N° immatriculation DanielCraft | ☐ |
| `AuditLog` (nouveau, ISO) | userId, action, ip, createdAt | ☐ |
| `Client.deliveryAddress` | Mention réforme | ☐ |

---

## C. Frontend — pages application

### C.1 Pages existantes à modifier

| Page | Fichier | Modification | Statut |
|------|---------|--------------|--------|
| Paramètres e-facture | `frontend/src/modules/account/pages/SettingsEInvoicingPage.tsx` | Remplacer bloc « PA partenaire » par « Plateforme Facturio » ; config sandbox ; immatriculation ; pas de mock en prod | 🔄 |
| Panneau conformité | `frontend/src/modules/e-invoicing/EInvoicingReadinessPanel.tsx` | Suivi statuts lifecycle ; historique transmissions ; erreurs rejet PPF | 🔄 |
| Fiche facture | _Intégration panel e-invoicing_ | Bouton envoi réseau ; timeline statuts PA | 🔄 |
| Profil entreprise | `SettingsCompanyPage.tsx` | Champs SIRET/SIREN déjà là — valider UX mentions réforme | 🔄 |
| Fiche client | `ClientFormDialog.tsx` | SIREN obligatoire B2B ; adresse livraison | 🔄 |
| Dashboard | `DashboardPage.tsx` | Widget conformité OK — ajouter alertes échéances / rejets PA | 🔄 |
| Données / RGPD | `SettingsPrivacyPage.tsx`, `SettingsDataPage.tsx` | Aligner textes registre RGPD ; lien politique | 🔄 |
| Service API | `frontend/src/services/eInvoicing.ts` | Types statuts étendus ; endpoints réception, journal | 🔄 |

### C.2 Nouvelles pages à créer

| Page | Route proposée | Contenu | Priorité |
|------|----------------|---------|----------|
| Boîte réception fournisseurs | `/factures-fournisseurs` ou sous factures | Liste factures entrantes PA, valider / refuser | P0 |
| Journal transmissions e-facture | `/parametres/facturation-electronique/journal` | Audit envois (support + ISO) | P1 |
| Tableau e-reporting | `/parametres/facturation-electronique/ereporting` | Périodes, statuts, erreurs | P1 |

### C.3 Routing

| Fichier | Modification |
|---------|--------------|
| `frontend/src/modules/app/App.tsx` | Nouvelles routes réception / journal |
| `SettingsIndexPage.tsx` | Liens menu paramètres |
| `Sidebar.tsx` / navigation | Entrée « Factures fournisseurs » |

---

## D. Marketing et pages légales (après immatriculation)

Ne pas promettre « PA connectée » avant livraison. Quand immatriculé, mettre à jour :

| Fichier | Texte actuel | Cible |
|---------|--------------|-------|
| `frontend/src/modules/marketing/constants/siteContent.ts` | « PA partenaire en déploiement » | « Plateforme Agréée Facturio » (si immatriculé) |
| `ElectronicInvoicingPage.tsx` | Section partenaire | Facturio comme PA |
| `frontend/src/modules/legal/content.ts` | « Futur : PA partenaire » | Statut immatriculation réel |
| `PricingCards.tsx` | Pro + e-facture | Préciser réseau Facturio PA |
| `TermsPage.tsx` | Module en développement | Conditions service PA |

---

## E. Mobile (`mobile/`)

| Zone | État | Action |
|------|------|--------|
| Créances / dettes | 🔄 en cours (git status) | Pas bloquant PA v1 |
| e-invoicing | ☐ absent | Phase 2 : consultation statuts, alertes rejets |
| Live sync | 🔄 | Inclure événements `eInvoiceStatus` si temps réel |

---

## F. Infra, scripts, CI (ISO + PA)

| Élément | Fichier / emplacement | Action | Statut |
|---------|----------------------|--------|--------|
| Backup auto BDD | `scripts/deploy/backup-facturio-db.sh` | Créer + cron node10 | ☐ |
| Variables env PPF | `server/.env.example`, doc déploiement | `PPF_API_URL`, certificats, sandbox | ☐ |
| Dependabot | `.github/dependabot.yml` | Créer | ☐ |
| npm audit CI | `.github/workflows/ci.yml` | Ajouter job | ☐ |
| Doc prod | `docs/deployment/POSTGRESQL_PRODUCTION.md` | Section backup auto + test restauration | ☐ |
| Nginx webhooks PPF | `scripts/deploy/nginx/` | Route `/api/e-invoicing/webhooks/ppf` | ☐ |
| SecNumCloud | — | Évaluer si migration cloud ; documenter choix on-prem UE | ☐ |

---

## G. Ordre de développement recommandé

### Vague 1 — Fondations (bloquant tout)

1. Prisma : `EInvoiceTransmissionLog`, champs invoice étendus
2. `factur-x-generator.service.ts` : Factur-X officiel
3. Mentions réforme PDF + compliance checks
4. Script backup + test restauration (ISO en parallèle)

### Vague 2 — Réseau PA (sandbox PPF)

5. `ppf-gateway.client.ts` : auth, submit, statuts
6. Remplacer / retirer mode mock `pa-partner.client.ts`
7. UI : envoi réel + timeline statuts
8. Journal transmissions

### Vague 3 — Réception et e-reporting

9. Webhook inbound + modèle `InboundSupplierInvoice`
10. UI boîte réception fournisseurs
11. Module e-reporting
12. Tests interop PPF + autre PA (dossier DGFiP)

### Vague 4 — ISO et durcissement

13. `AuditLog` + middleware
14. Dependabot + npm audit CI
15. Pentest + clôture écarts ISMS
16. Mise à jour marketing (si immatriculé)

---

## H. Ce qui ne demande pas de modification code immédiate

| Action | Document |
|--------|----------|
| Remplir ISMS | `annexes/isms/*.md` |
| Devis ISO / certificateur | Hors repo |
| Kbis, certificat ISO | `annexes/pieces-jointes/` |
| DPA sous-traitants | Hors repo + registre RGPD |

---

## I. Journal des mises à jour inventaire

| Date | Changement |
|------|------------|
| juin 2026 | Création inventaire initial |
