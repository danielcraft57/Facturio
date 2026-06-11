# Parcours complet — Plateforme Agréée dédiée & ISO/IEC 27001

Document de référence unique pour devenir **Plateforme Agréée (PA)** en tant que DanielCraft / Facturio, avec suivi de l'avancement et liste des actions restantes.

**Éditeur** : Loïc DANIEL — DanielCraft  
**Objectif stratégique** : immatriculation PA propre (pas seulement solution compatible partenaire)  
**Dernière mise à jour** : juin 2026  
**Statut global** : en préparation — ISO 27001 non démarrée, produit PA partiel, dossier DGFiP non déposé

---

## Comment utiliser ce document

1. Lire la [synthèse des trois chantiers](#les-trois-chantiers-en-parallèle) pour avoir la vue d'ensemble.
2. Suivre le [tableau d'avancement](#tableau-davancement-global) et cocher au fil de l'eau.
3. Pour l'ISO : suivre les [phases détaillées](#obtenir-lisoiec-27001--guide-étape-par-étape) et la [liste des livrables ISMS](#livrabales-isms-à-produire).
4. Pour le produit : croiser avec [FACTURATION_ELECTRONIQUE_2026.md](../planning/FACTURATION_ELECTRONIQUE_2026.md) et [07-checklist-depot-immatriculation.md](./07-checklist-depot-immatriculation.md) au moment du dépôt.

**Documents liés**

| Fichier | Rôle |
|---------|------|
| [06-plan-certification-iso27001.md](./06-plan-certification-iso27001.md) | Résumé budget / phases ISO |
| [05-securite-conformite.md](./05-securite-conformite.md) | État sécurité technique actuel |
| [07-checklist-depot-immatriculation.md](./07-checklist-depot-immatriculation.md) | Pièces administratives DGFiP |
| [04-dossier-technique-facturio.md](./04-dossier-technique-facturio.md) | Module e-invoicing existant |
| [CONFORMITE_RGPD_ET_FACTURATION_2026.md](../planning/CONFORMITE_RGPD_ET_FACTURATION_2026.md) | Audit RGPD produit |

---

## Les trois chantiers en parallèle

Devenir PA, ce n'est pas qu'un dossier en ligne. Trois axes doivent avancer en même temps :

```
┌─────────────────────────────────────────────────────────────────┐
│  CHANTIER A — ISO/IEC 27001 (bloquant pour le dépôt DGFiP)      │
│  ISMS · analyse de risques · procédures · audit certificateur   │
└────────────────────────────┬────────────────────────────────────┘
                             │ certificat obtenu
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  CHANTIER B — Dépôt & immatriculation PA (DGFiP)                │
│  immatpdp · interop PPF · interop autre PA · audit conformité   │
└────────────────────────────┬────────────────────────────────────┘
                             │ en parallèle dès le début
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  CHANTIER C — Produit Facturio « opérateur PA »                 │
│  Factur-X · émission · réception · annuaire · e-reporting       │
└─────────────────────────────────────────────────────────────────┘
```

**Délai réaliste** (micro-entreprise, démarrage juin 2026) :

| Jalon | Date optimiste | Date prudente |
|-------|----------------|---------------|
| Certificat ISO 27001 | T1 2027 | T2-T3 2027 |
| Dépôt dossier `immatpdp` | Après certificat | Idem |
| Immatriculation PA effective | T2-T3 2027 | 2028 |
| Produit PA opérationnel (MVP) | Peut précéder l'immatriculation (sandbox) | Q4 2026 - Q1 2027 |

> **Septembre 2026** : échéance légale pour les utilisateurs (réception / émission ETI), pas pour ton immatriculation PA si l'ISO n'est pas prête. Prévoir une solution de repli (partenaire temporaire ou communication honnête aux clients) si l'immatriculation n'est pas effective à cette date.

---

## Obtenir l'ISO/IEC 27001 — guide étape par étape

### Principe

L'ISO 27001 certifie un **Système de Management de la Sécurité de l'Information** (ISMS), pas uniquement le code de Facturio. Le certificateur vérifie :

- que tu as identifié les risques sur un périmètre défini ;
- que tu as choisi et documenté des mesures (contrôles) ;
- que tu les **appliques** et que tu peux le **prouver** ;
- que tu t'améliores en continu (revues, audits internes, actions correctives).

Une certification « en cours » n'est **pas** recevable pour le dépôt PA DGFiP.

### Périmètre recommandé (v1)

Rédiger une page « Périmètre ISMS » signée :

| Inclus | Exclu (v1) |
|--------|------------|
| Développement et maintenance de Facturio (repo Git) | Projets clients hors Facturio |
| Exploitation production (node10.lan, PostgreSQL, Nginx) | Poste de travail personnel (sauf si impossible à exclure) |
| Données : comptes utilisateurs, organisations, clients, factures, devis, flux e-invoicing | Données sans lien avec Facturio |
| Sous-traitants liés au service (Stripe, SMTP, hébergeur si tiers) | — |

**Responsable sécurité** : Loïc DANIEL (RSSI / DPO contact : contact@danielcraft.fr).

### Phase ISO-0 — Cadrage (semaines 1 à 8)

| # | Action | Livrable | Statut |
|---|--------|----------|--------|
| ISO-0.1 | Demander 2-3 devis **consultants ISO** (SaaS, PME) | Comparatif devis | ☐ |
| ISO-0.2 | Demander 2-3 devis **organismes certificateurs** accrédités (COFRAC) | Comparatif (AFNOR, Bureau Veritas, SGS, LRQA, APCER…) | ☐ |
| ISO-0.3 | Rédiger le **périmètre ISMS** v1 | `annexes/isms/PERIMETRE_ISMS.md` | ☐ |
| ISO-0.4 | Nommer officiellement le RSSI | Mention dans politique sécurité | ☐ |
| ISO-0.5 | Inventaire des **actifs** (serveurs, BDD, repos, comptes cloud, domaines) | Registre des actifs | ☐ |
| ISO-0.6 | Première **analyse de risques** (atelier ou grille) | Registre des risques v1 | ☐ |
| ISO-0.7 | Rédiger la **politique de sécurité** (engagement direction) | Document signé | ☐ |

### Phase ISO-1 — Construction ISMS (semaines 9 à 32)

| # | Action | Livrable | Statut |
|---|--------|----------|--------|
| ISO-1.1 | **Déclaration d'applicabilité** (SoA) — contrôles ISO 27001:2022 retenus | SoA v1 | ☐ |
| ISO-1.2 | Procédure **gestion des accès** (comptes admin, SSH, Git, prod) | PROC-ACC-001 | ☐ |
| ISO-1.3 | Procédure **mots de passe** et authentification | PROC-IAM-001 | ☐ |
| ISO-1.4 | Procédure **sauvegarde et restauration** | PROC-BKP-001 | ☐ |
| ISO-1.5 | Procédure **gestion des incidents** sécurité | PROC-INC-001 | ☐ |
| ISO-1.6 | Procédure **gestion des changements** (déploiement prod) | PROC-CHG-001 | ☐ |
| ISO-1.7 | Procédure **gestion des vulnérabilités** (CVE, dépendances) | PROC-VUL-001 | ☐ |
| ISO-1.8 | **Registre des traitements RGPD** (CNIL) | Registre formalisé | ☐ |
| ISO-1.9 | **DPA** signés ou archivés : hébergeur, Stripe, SMTP, ProspectLab | Dossier sous-traitants | ☐ |
| ISO-1.10 | **PRA / PCA** : RTO, RPO, scénarios, test de restauration documenté | PLAN-PRA-001 | ☐ |
| ISO-1.11 | Revue des accès (trimestrielle) — première preuve | Compte-rendu revue | ☐ |
| ISO-1.12 | Sensibilisation sécurité (même solo : checklist annuelle) | Trace formation | ☐ |

### Phase ISO-2 — Mise en œuvre technique (en parallèle de ISO-1)

Alignement avec l'existant Facturio — voir [état technique](#état-technique-facturio-vs-exigences-iso--pa).

| # | Action | Preuve attendue | Statut |
|---|--------|-----------------|--------|
| ISO-2.1 | `SECRETS_ENCRYPTION_KEY` défini et vérifié en prod | Doc déploiement + test chiffrement | ☐ |
| ISO-2.2 | Sauvegardes PostgreSQL **automatisées** quotidiennes | Cron + logs + rétention 30 j min. | ☐ |
| ISO-2.3 | **Test de restauration** sauvegarde (au moins 1 fois) | CR avec date et durée | ☐ |
| ISO-2.4 | Journalisation accès admin / actions sensibles | Logs centralisés ou exportables | ☐ |
| ISO-2.5 | Dependabot ou équivalent + `npm audit` en CI | `.github/dependabot.yml` + job CI | ☐ |
| ISO-2.6 | **Pentest** applicatif (avant prod PA) | Rapport externe ou audit ciblé | ☐ |
| ISO-2.7 | TLS, en-têtes sécurité, rate limiting documentés | [AUTH_SECURITY.md](../development/AUTH_SECURITY.md) à jour | ☐ |
| ISO-2.8 | Inventaire et durcissement SSH / pare-feu prod | Fiche infra node10/node12 | ☐ |

### Phase ISO-3 — Audit interne (semaines 33 à 36)

| # | Action | Livrable | Statut |
|---|--------|----------|--------|
| ISO-3.1 | Plan d'audit interne | Planning + périmètre | ☐ |
| ISO-3.2 | Exécution audit interne (consultant ou auto-grille) | Rapport + écarts | ☐ |
| ISO-3.3 | Plan d'actions correctives sur écarts | Actions datées et assignées | ☐ |
| ISO-3.4 | Clôture des écarts majeurs | Preuves de correction | ☐ |

### Phase ISO-4 — Certification (semaines 37 à 48)

| # | Action | Livrable | Statut |
|---|--------|----------|--------|
| ISO-4.1 | **Audit étape 1** (documentation ISMS) | Rapport certificateur | ☐ |
| ISO-4.2 | Corrections post-étape 1 si besoin | Actions clôturées | ☐ |
| ISO-4.3 | **Audit étape 2** (mise en œuvre sur le terrain) | Rapport certificateur | ☐ |
| ISO-4.4 | **Certificat ISO/IEC 27001** émis | PDF certificat (< 3 ans) | ☐ |

### Phase ISO-5 — Maintien (annuel)

| # | Action | Fréquence | Statut |
|---|--------|-----------|--------|
| ISO-5.1 | Audit de surveillance certificateur | Annuel | ☐ |
| ISO-5.2 | Revue de direction sécurité | Annuelle | ☐ |
| ISO-5.3 | Mise à jour analyse de risques | Annuelle ou si incident majeur | ☐ |
| ISO-5.4 | Renouvellement certification | Tous les 3 ans | ☐ |

### Budget ISO (rappel)

| Poste | Fourchette |
|-------|------------|
| Consultant accompagnement | 15-40 k€ |
| Audit certification initial | 8-20 k€ |
| Pentest, outils | 2-10 k€/an |
| **Total première année** | **25-70 k€** |

---

## Livrables ISMS à produire

Dossier cible local (ne pas committer de pièces confidentielles sans précaution) :

```
docs/accreditation-pa/annexes/isms/
├── PERIMETRE_ISMS.md
├── POLITIQUE_SECURITE.md
├── REGISTRE_RISQUES.md
├── SOA_DECLARATION_APPLICABILITE.md
├── REGISTRE_ACTIFS.md
├── procedures/
│   ├── PROC-ACC-001-gestion-acces.md
│   ├── PROC-IAM-001-mots-de-passe.md
│   ├── PROC-BKP-001-sauvegardes.md
│   ├── PROC-INC-001-incidents.md
│   ├── PROC-CHG-001-changements.md
│   └── PROC-VUL-001-vulnerabilites.md
├── PLAN-PRA-001.md
├── REGISTRE_TRAITEMENTS_RGPD.md
└── revues/
    ├── REVUE_ACCES_YYYY-MM.md
    └── AUDIT_INTERNE_YYYY-MM.md
```

**Modèles créés (juin 2026)** — à compléter dans `annexes/isms/` :

- [PERIMETRE_ISMS.md](./annexes/isms/PERIMETRE_ISMS.md)
- [POLITIQUE_SECURITE.md](./annexes/isms/POLITIQUE_SECURITE.md)
- [REGISTRE_RISQUES.md](./annexes/isms/REGISTRE_RISQUES.md)
- [SOA_DECLARATION_APPLICABILITE.md](./annexes/isms/SOA_DECLARATION_APPLICABILITE.md)
- [REGISTRE_ACTIFS.md](./annexes/isms/REGISTRE_ACTIFS.md)
- [REGISTRE_TRAITEMENTS_RGPD.md](./annexes/isms/REGISTRE_TRAITEMENTS_RGPD.md)
- [PLAN-PRA-001.md](./annexes/isms/PLAN-PRA-001.md)
- Procédures : [procedures/](./annexes/isms/procedures/)

**Code et pages à modifier** : [10-INVENTAIRE_CODE_ET_PAGES_PA.md](./10-INVENTAIRE_CODE_ET_PAGES_PA.md)

---

## État technique Facturio vs exigences ISO & PA

### Déjà en place (juin 2026)

| Domaine | Détail | Référence code / doc |
|---------|--------|----------------------|
| Auth | JWT cookie HTTP-only, bcrypt | `server/src/auth/` |
| Multi-tenant | Isolation `organizationId` | Schéma Prisma |
| Secrets BDD | AES-256-GCM si clé définie | `SecretsCryptoService` |
| Validation entrées | `class-validator` sur DTOs | Modules NestJS |
| RGPD partiel | Export compte, suppression | `GET /gdpr/export`, `POST /gdpr/delete-account` |
| Rate limiting | Routes auth et publiques | Middleware serveur |
| e-invoicing fondations | Score conformité, XML simplifié, SIREN | `server/src/e-invoicing/` |
| CI tests | Unit + e2e e-invoicing | GitHub Actions |
| Pages légales | CGU, CGV, confidentialité | Frontend marketing |

### À faire — sécurité / gouvernance (ISO)

| Priorité | Action | Bloquant ISO ? | Bloquant PA ? |
|----------|--------|----------------|---------------|
| P0 | Registre traitements RGPD formalisé | Oui | Oui |
| P0 | Sauvegardes auto + test restauration documenté | Oui | Oui |
| P0 | DPA tous sous-traitants | Oui | Oui |
| P0 | PRA / PCA écrit | Oui | Oui |
| P1 | Journal accès admin renforcé | Oui | Oui |
| P1 | Dependabot + audit dépendances CI | Oui | Recommandé |
| P1 | Pentest avant prod PA | Recommandé | Oui |
| P1 | `SECRETS_ENCRYPTION_KEY` vérifié prod | Oui | Oui |
| P2 | Rotation clé chiffrement documentée | Non | Recommandé |
| P2 | AIPD si traitement à risque | Selon cas | Possible |

### À faire — produit opérateur PA (chantier C)

| Priorité | Action | Statut |
|----------|--------|--------|
| P0 | Factur-X complet PDF/A-3 + XML EN 16931 | ☐ |
| P0 | Validation schéma XSD / règles métier | ☐ |
| P0 | Service **émission** vers réseau (PPF / PA) | ☐ |
| P0 | Service **réception** factures entrantes | ☐ |
| P0 | **Annuaire** SIREN / routage destinataire | ☐ |
| P0 | Cycle de vie statuts (`PENDING_PA` → `DELIVERED`) | Partiel (enum existe) |
| P0 | Journal transmissions audit | ☐ |
| P1 | **E-reporting** (B2C, export, paiements) | ☐ |
| P1 | Mentions obligatoires réforme PDF + modèle | ☐ |
| P1 | UI paramètres PA + envoi + suivi statuts | ☐ |
| P1 | Boîte réception fournisseurs | ☐ |
| P2 | Export UBL / CII si exigé interop | ☐ |

Détail phases : [FACTURATION_ELECTRONIQUE_2026.md](../planning/FACTURATION_ELECTRONIQUE_2026.md).

### Architecture cible si tu es PA (pas partenaire)

Remplacer « connecteur PA partenaire » par **tes propres services réseau** :

```
Facturio (métier + e-invoicing)
    → API émission / réception / annuaire / e-reporting (interne)
    → Passerelle PPF (interop DGFiP)
    → Réseau PA + clients B2B + administration
```

Schéma de départ : [03-architecture-solution-compatible.md](./03-architecture-solution-compatible.md) (à adapter : la PA devient Facturio).

---

## Dépôt immatriculation PA — après l'ISO

Ne pas déposer sur [immatpdp](https://demarche.numerique.gouv.fr/commencer/immatpdp) tant que le **certificat ISO 27001** n'est pas obtenu.

### Séquence post-certificat

| # | Action | Référence | Statut |
|---|--------|-----------|--------|
| PA-1 | Compiler les pièces administratives | [07-checklist-depot-immatriculation.md](./07-checklist-depot-immatriculation.md) | ☐ |
| PA-2 | Kbis < 3 mois | `annexes/pieces-jointes/` | ☐ |
| PA-3 | Copie certificat ISO 27001 | Idem | ☐ |
| PA-4 | Dossier technique émission + réception | [04-dossier-technique-facturio.md](./04-dossier-technique-facturio.md) | ☐ |
| PA-5 | Schéma architecture + protocoles sécurité | [03](./03-architecture-solution-compatible.md), [05](./05-securite-conformite.md) | ☐ |
| PA-6 | Hébergement UE documenté (+ SecNumCloud si cloud tiers) | Fiche hébergeur | ☐ |
| PA-7 | Lettre d'accompagnement | [templates/lettre-accompagnement-depot.md](./templates/lettre-accompagnement-depot.md) | ☐ |
| PA-8 | Dépôt en ligne + suivi DGFiP | Portail immatpdp | ☐ |
| PA-9 | Tests interopérabilité **PPF** (sandbox) | Plan de tests | ☐ |
| PA-10 | Tests interop avec **une autre PA** | Plan de tests | ☐ |
| PA-11 | Rapport audit conformité (si demandé sous 12 mois) | Rapport auditeur | ☐ |
| PA-12 | Immatriculation effective (3 ans renouvelables) | Notification DGFiP | ☐ |

---

## Tableau d'avancement global

Légende : ✅ fait · 🔄 en cours · ☐ à faire · ⛔ bloquant

### Chantier A — ISO 27001

| Bloc | Avancement | Prochaine action |
|------|------------|------------------|
| Cadrage (ISO-0) | ☐ 0/7 | Demander devis consultants + certificateurs |
| ISMS documents (ISO-1) | ☐ 0/12 | Rédiger périmètre + politique sécurité |
| Technique preuves (ISO-2) | 🔄 ~3/8 | Sauvegardes auto + test restauration |
| Audit interne (ISO-3) | ☐ 0/4 | — |
| Certification (ISO-4) | ☐ 0/4 | — |
| **Certificat obtenu** | ☐ | **Bloquant pour dépôt PA** |

### Chantier B — Dépôt DGFiP

| Bloc | Avancement | Prochaine action |
|------|------------|------------------|
| Dossier local préparé | 🔄 | Synthèse, identité, technique, sécurité rédigés |
| Pièces officielles (Kbis, ISO) | ☐ | Après certification |
| Dépôt immatpdp | ☐ | Après certificat |
| Interop PPF + PA tierce | ☐ | Après dépôt accepté |
| Immatriculation | ☐ | — |

### Chantier C — Produit Facturio PA

| Bloc | Avancement | Prochaine action |
|------|------------|------------------|
| Fondations e-invoicing | 🔄 ~60 % | XML ok, pas Factur-X complet |
| Émission réseau | ☐ | Architecture passerelle PPF |
| Réception | ☐ | Webhooks + parsing entrant |
| E-reporting | ☐ | Phase 5 roadmap |
| UI utilisateur PA | ☐ | Paramètres + envoi + statuts |

---

## Planning indicatif (démarrage juin 2026)

### T2 2026 (juin - août) — Lancement

- [ ] Devis consultants ISO + certificateurs
- [ ] Périmètre ISMS + registre actifs + analyse risques v1
- [ ] Politique sécurité + lancement registre RGPD
- [ ] Sauvegardes prod automatisées + 1 test restauration
- [ ] Continuer dev : mentions facture, Factur-X (chantier C)

### T3 2026 (sept. - nov.) — Construction

- [ ] SoA + procédures ISMS (accès, backup, incidents, changements, vulnérabilités)
- [ ] DPA sous-traitants
- [ ] PRA documenté
- [ ] Dependabot + audit CI
- [ ] Dev : émission/réception sandbox (même sans immatriculation)

### T4 2026 (déc.) — Audit interne

- [ ] Audit blanc ISMS
- [ ] Correction écarts majeurs
- [ ] Pentest applicatif

### T1 2027 — Certification ISO

- [ ] Audit étape 1 certificateur
- [ ] Audit étape 2
- [ ] Obtention certificat

### T2 2027 — Dépôt PA

- [ ] Dépôt `immatpdp` avec certificat
- [ ] Tests interop PPF
- [ ] Tests interop PA tierce

### T3 2027+ — Production PA

- [ ] Immatriculation effective
- [ ] Mise en production réseau pour clients Facturio
- [ ] E-reporting complet
- [ ] Audit conformité post-immatriculation si requis

---

## Organismes et ressources utiles

### Certificateurs ISO 27001 (France — exemples, à comparer par devis)

- [AFNOR Certification](https://www.afnor.org/)
- Bureau Veritas Certification
- SGS
- LRQA
- APCER

Vérifier l'accréditation COFRAC du certificateur pour la norme ISO/IEC 27001.

### Réglementation PA

- [Guide immatriculation PA (PDF)](https://www.impots.gouv.fr/sites/default/files/media/1_metier/2_professionnel/EV/2_gestion/290_facturation_electronique/guide_utilisateur_fe_ds_immatriculation_pdp.pdf)
- [Dépôt en ligne immatpdp](https://demarche.numerique.gouv.fr/commencer/immatpdp)
- [Liste PA immatriculées](https://www.impots.gouv.fr/liste-des-plateformes-de-dematerialisation-partenaires-pdp-immatriculees-sous-reserve)
- Annexes : [references-officielles.md](./annexes/references-officielles.md)

### Norme

- **ISO/IEC 27001:2022** — exigences ISMS
- **ISO/IEC 27002:2022** — guide des contrôles (référence pour la SoA)

---

## Risques et décisions à tracer

| Risque | Impact | Mitigation |
|--------|--------|------------|
| ISO non obtenue avant sept. 2026 | Pas de dépôt PA | Planning réaliste ; pas de promesse commerciale « PA Facturio » avant immatriculation |
| Coût ISO 25-70 k€ | Trésorerie micro-entreprise | Devis multiples ; périmètre minimal |
| Charge solo (dev + ISMS + interop) | Retards | Consultant ISO ; prioriser P0 |
| Hébergement on-prem sans SecNumCloud | Question DGFiP si interprétation stricte | Documenter UE ; étudier SecNumCloud si migration cloud |
| Produit PA incomplet à l'immatriculation | Tests interop échoués | Dev sandbox en parallèle de l'ISO |

**Journal des décisions** (à compléter) :

| Date | Décision | Auteur |
|------|----------|--------|
| 2026-05 | Objectif long terme : PA propre DanielCraft | Loïc DANIEL |
| 2026-06 | Document parcours complet créé | — |
| | Choix consultant ISO : _à renseigner_ | |
| | Choix certificateur : _à renseigner_ | |

---

## Prochaines actions immédiates (top 5)

1. **Demander 2 devis** consultant ISO + 1 devis certificateur (email type : SaaS facturation, micro-entreprise, périmètre Facturio prod Metz / infra dédiée).
2. **Créer** `annexes/isms/PERIMETRE_ISMS.md` et `POLITIQUE_SECURITE.md` (même brouillon).
3. **Automatiser** sauvegarde PostgreSQL prod + noter la date du premier test de restauration.
4. **Formaliser** le registre des traitements RGPD (à partir de [CONFORMITE_RGPD](../planning/CONFORMITE_RGPD_ET_FACTURATION_2026.md)).
5. **Planifier** le sprint produit Factur-X complet (indépendant de l'ISO mais nécessaire pour les tests interop).

---

## Historique de ce document

| Version | Date | Changement |
|---------|------|------------|
| 1.0 | juin 2026 | Création — parcours PA dédiée, guide ISO complet, tableaux d'avancement |
