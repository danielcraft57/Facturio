# Synthèse exécutive — Facturio & facturation électronique

**Document** : dossier de candidature / présentation partenaires  
**Version** : 1.1 — juin 2026  
**Éditeur** : Loïc DANIEL — DanielCraft  
**Branche** : `feat/pa-iso27001-parcours`

---

## 1. Objet

**Facturio** est un logiciel SaaS de facturation destiné aux **prestataires de services numériques** (développement web, logiciel sur mesure, automatisation, maintenance, offres IA). L’objectif réglementaire est la conformité à la **réforme française de facturation électronique B2B** (échéances septembre 2026 et 2027) et l’**immatriculation de DanielCraft / Facturio en Plateforme Agréée (PA)**. Une intégration PA partenaire reste une **piste de repli** si le délai d’immatriculation n’est pas tenu.

## 2. Identité de l’éditeur

| Élément | Valeur |
|---------|--------|
| Raison sociale / entrepreneur | Loïc DANIEL — DanielCraft |
| Forme juridique | Micro-entreprise / entreprise individuelle |
| Siège | 57000 Metz, France |
| SIRET | 823 417 050 000 23 |
| SIREN | 823 417 050 |
| TVA | Non assujetti, art. 293 B du CGI |
| Contact | contact@danielcraft.fr — 03 87 78 09 16 |
| Site | https://danielcraft.fr |

## 3. État du produit (mai 2026)

### Livré

- Facturation classique : devis, factures, PDF, email, liens publics, paiements Stripe (double flux : abonnement Facturio / encaissement factures client).
- Module **`e-invoicing`** : score de conformité organisation / client / facture, export **XML simplifié EN 16931** (pré-Factur-X), statuts `eInvoiceStatus`, champ **SIREN client**, tests unitaires et e2e.
- RGPD : export compte, suppression, chiffrement secrets (AES-256-GCM), pages légales (CGU, CGV, mentions, confidentialité).

### Non livré (jalon sept. 2026)

- PDF/A-3 embarquant le XML Factur-X officiel.
- Validation schéma XSD / Schematron.
- Connexion API à une **Plateforme Agréée** (émission, réception, annuaire, e-reporting).
- Immatriculation PA DanielCraft.

## 4. Deux scénarios stratégiques

| Critère | Solution compatible + PA partenaire | Immatriculation PA Facturio |
|---------|-------------------------------------|-----------------------------|
| Délai | 6–12 mois (selon partenaire) | 12–24 mois |
| Coût | Modéré (API + commission) | Élevé (ISO 27001, audits, infra) |
| Risque | Dépendance partenaire | Contrôle du canal réglementaire |
| **Recommandation (juin 2026)** | Piste de repli | **Objectif retenu** |

## 5. Engagements conformité (cible)

- Hébergement et traitement des données en **Union européenne**.
- Traçabilité des flux : hash XML, horodatage génération, logs d’envoi PA (à venir).
- DPA avec sous-traitants (Stripe, SMTP, PA, hébergeur).
- Tests d’**interopérabilité PPF** avant production (si immatriculation PA).

## 6. Calendrier indicatif

| Date | Jalon |
|------|--------|
| Q2–Q3 2026 | ISMS démarré ; Factur-X ; passerelle PPF (sandbox) |
| **1 sept. 2026** | Échéance légale utilisateurs (réception / émission ETI) — immatriculation PA si ISO prête |
| T1–T2 2027 | Certification ISO 27001 (cible) |
| T2 2027 | Dépôt `immatpdp` + tests interop PPF |
| **1 sept. 2027** | Émission PME / micro — activation par défaut |
| Q4 2026 – Q1 2027 | Réception fournisseurs + e-reporting |

## 7. Pièces du dossier

Voir l’index [README.md](./README.md) et le suivi [09-PARCOURS_COMPLET_PA_ISO27001.md](./09-PARCOURS_COMPLET_PA_ISO27001.md) : cadre réglementaire, ISMS, inventaire code, checklist dépôt.

## 8. Contact dossier

**Loïc DANIEL** — contact@danielcraft.fr  
DanielCraft · 57000 Metz · SIRET 823 417 050 000 23
