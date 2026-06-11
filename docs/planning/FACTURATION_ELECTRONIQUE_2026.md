# Facturation électronique B2B (réforme 2026–2027)

Document de référence pour la mise en conformité de Facturio avec la réforme française de facturation électronique entre entreprises et l’e-reporting.

**Statut** : **partiellement implémenté** (fondations + XML pré-Factur-X) — transmission PA non connectée.  
**Dernière mise à jour** : mai 2026.

## État d’implémentation (mai 2026)

| Élément | Statut | Détail |
|---------|--------|--------|
| Module `server/src/e-invoicing/` | ✅ | Compliance, génération XML, API REST |
| Champs Prisma `Client.siren`, `Invoice.eInvoice*` | ✅ | Migration `20260520120000_e_invoicing_readiness` |
| UI rapport conformité | ✅ | Compte, détail facture, dashboard |
| Export Factur-X | ⚠️ | XML simplifié EN 16931 — pas PDF/A-3 officiel |
| Connexion PA | ❌ | Phase 3 |
| E-reporting | ❌ | Phase 5 |
| Tests CI | ✅ | Unit + e2e `e-invoicing` |

Guide technique : [E_INVOICING.md](../development/E_INVOICING.md) · Dossier PA : [accreditation-pa/](../accreditation-pa/README.md)

> **Positionnement produit** : Facturio cible la facturation des **prestations de services numériques** (dev web, logiciel, automatisation, maintenance, IA). Voir [POSITIONNEMENT_PRESTATIONS_SERVICES.md](./POSITIONNEMENT_PRESTATIONS_SERVICES.md) pour développer ce vertical **en parallèle** de la conformité réforme.

## Contexte réglementaire

| Date | Obligation |
|------|------------|
| **1er sept. 2026** | Toutes les entreprises assujetties à la TVA en France doivent pouvoir **recevoir** des factures électroniques B2B. Les **grandes entreprises** et **ETI** doivent **émettre** en électronique. |
| **1er sept. 2027** | Les **PME** et **micro-entreprises** doivent **émettre** en électronique. |

Chaque flux B2B passe par une **Plateforme Agréée (PA)** — anciennement PDP — ou le **Portail Public de Facturation (PPF)**. Les factures doivent être au format structuré : **Factur-X**, **UBL** ou **CII**. L’administration reçoit aussi des données via l’**e-reporting** (transactions sans facture électronique, paiements, etc.).

### Ressources officielles

- [Facturation électronique et plateformes agréées](https://www.impots.gouv.fr/facturation-electronique-et-plateformes-agreees) (impots.gouv.fr)
- [Liste des plateformes agréées immatriculées](https://www.impots.gouv.fr/liste-des-plateformes-de-dematerialisation-partenaires-pdp-immatriculees-sous-reserve)
- [Demande d’immatriculation PA](https://demarche.numerique.gouv.fr/commencer/immatpdp)
- [Guide utilisateur immatriculation PA (PDF)](https://www.impots.gouv.fr/sites/default/files/media/1_metier/2_professionnel/EV/2_gestion/290_facturation_electronique/guide_utilisateur_fe_ds_immatriculation_pdp.pdf)

## Impact sur Facturio

Facturio couvre la facturation classique (devis, factures, PDF, email, liens publics, Stripe, TVA FR/UE) **et** une première couche e-facture : rapport de conformité, **SIREN client**, export **XML simplifié** (pré-Factur-X). **Il n’existe pas encore** de PDF/A-3 Factur-X complet, ni de connexion PA / PPF ni d’e-reporting.

| Acteur | Concerné ? | Conséquence |
|--------|------------|-------------|
| **Clients Facturio** (entreprises FR assujetties TVA, facturation B2B) | Oui | Ils devront émettre/recevoir via le réseau officiel à partir des échéances ci-dessus. |
| **Facturio en tant que logiciel** | Oui | Proposer un parcours conforme (formats + transmission) avant sept. 2026 pour les premiers utilisateurs visés (réception / ETI). |
| **Facturio en tant que Plateforme Agréée** | Optionnel | Immatriculation DGFiP lourde (ISO 27001, SecNumCloud, tests d’interopérabilité, etc.) — voir [Devenir PA ou s’appuyer sur un partenaire](#décision-stratégique-pa-vs-solution-compatible). |

## Décision stratégique : PA vs solution compatible

L’administration distingue :

- **Plateforme Agréée (PA)** : seul opérateur habilité à transmettre les factures électroniques entre entreprises **et** les données de facturation / transaction / paiement à la DGFiP.
- **Solution compatible** : logiciel métier (Facturio) connecté à une PA via API ; l’utilisateur continue à travailler dans Facturio, la PA assure le réseau et la conformité transmission.

**Recommandation par défaut pour Facturio** : viser le statut de **solution compatible** en s’intégrant à une **PA partenaire** (marque blanche ou co-branding), sauf décision produit explicite de devenir PA.

### Devenir Plateforme Agréée (si choix explicite)

Dépôt en ligne : [demarche.numerique.gouv.fr/commencer/immatpdp](https://demarche.numerique.gouv.fr/commencer/immatpdp).

Exigences principales (non exhaustif) :

- Kbis &lt; 3 mois, documentation RGPD
- **ISO/IEC 27001** valide (3 ans) — certification en cours non recevable
- Hébergement UE, engagement non-transfert hors UE ; **SecNumCloud** si hébergeur tiers
- Dossier technique (émission/réception, authentification, extraction des données, protocole sécurisé)
- Rapport d’audit de conformité sous 1 an
- Tests d’interopérabilité PPF + autre PA (souvent après validation du dossier)
- Immatriculation **3 ans**, renouvelable

Budget et délai indicatifs pour un nouvel entrant : souvent **12–24 mois** et coût significatif (certification, infra, conformité).

## Architecture cible (solution compatible)

```
┌─────────────────────────────────────────────────────────────┐
│  Facturio (métier)                                          │
│  Clients · Devis · Factures · TVA · Compta · PDF (archive)  │
└──────────────────────────┬──────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
   Factur-X / UBL    Module e-reporting   Réception factures
   génération        (B2C, export,        fournisseurs (entrant)
                     paiements)                  │
         └─────────────────┬─────────────────┘
                           ▼
              ┌────────────────────────┐
              │  PA partenaire (API)   │
              │  émission · réception  │
              │  annuaire · statuts    │
              └───────────┬────────────┘
                          ▼
              Clients B2B · DGFiP (PPF)
```

## Roadmap technique

### Phase 0 — Cadrage (Q2 2026)

- [ ] Valider la stratégie : **PA partenaire** vs candidature **PA Facturio**
- [ ] Short-list PA (critères : API, tarifs, marque blanche, SLA, formats supportés)
- [ ] Cartographier les utilisateurs cibles (ETI dès sept. 2026, PME sept. 2027)
- [ ] Recenser les champs obligatoires manquants (SIREN client, adresses, mentions légales, etc.)
- [ ] Définir le format prioritaire : **Factur-X** (recommandé pour le marché FR)

### Phase 1 — Fondations données & mentions (Q2–Q3 2026)

**Backend**

- [x] Étendre `Client` : SIREN ; profil organisation : SIRET/SIREN
- [ ] Nouvelles mentions obligatoires sur facture (réforme) dans le modèle et les DTOs
- [ ] Versioning du numéro de facture et traçabilité (intégrité pour e-invoicing)
- [x] Stockage empreinte XML + horodatage (`eInvoiceXmlHash`, `eInvoiceGeneratedAt`)

**Frontend**

- [x] Formulaires client / organisation : SIREN, SIRET
- [x] Indicateur de conformité (score % org et facture)

### Phase 2 — Génération formats structurés (Q3 2026)

**Backend**

- [x] Module `e-invoicing` NestJS
- [ ] Service génération **Factur-X** complet (PDF/A-3 + XML EN 16931)
- [x] XML simplifié EN 16931 — `FacturXGeneratorService`
- [ ] Export **UBL** ou **CII** (au moins un second format si exigé par la PA retenue)
- [ ] Validation schéma / règles métier avant envoi
- [x] Endpoint : `GET /e-invoicing/invoices/:id/factur-x`

**Frontend**

- [x] Téléchargement XML depuis la fiche facture (plan Pro + e-facture)
- [x] Aperçu des erreurs de validation (checklist panneau conformité)

### Phase 3 — Intégration PA partenaire (Q3–Q4 2026)

**Backend**

- [ ] Client HTTP PA (auth, retry, idempotence)
- [ ] Envoi facture émise → PA (`submit` / équivalent API partenaire)
- [ ] Webhooks ou polling : statuts (déposée, reçue, rejetée, traitée)
- [ ] Consultation annuaire (recherche SIREN → routage destinataire)
- [ ] Configuration par organisation : identifiants PA, mode test / production
- [ ] Journal des transmissions (audit, support client)

**Frontend**

- [ ] Paramètres organisation : connexion PA, test de connexion
- [ ] Bouton « Envoyer en facturation électronique » + suivi des statuts
- [ ] Notifications en cas de rejet (motif PA)

### Phase 4 — Réception & cycle entrant (Q4 2026 – Q1 2027)

**Backend**

- [ ] Réception factures fournisseurs via PA (webhook entrant)
- [ ] Parsing Factur-X / UBL entrant → enregistrement ou brouillon achat
- [ ] Rapprochement avec commandes / écritures comptables achats (lien module `accounting`)

**Frontend**

- [ ] Boîte de réception factures fournisseurs
- [ ] Validation / refus / transfert compta

### Phase 5 — E-reporting (Q1 2027)

**Backend**

- [ ] Identification des flux hors facture électronique obligatoire (B2C France, export, etc.)
- [ ] Agrégation et transmission des données transaction / paiement selon calendrier PA
- [ ] Lien avec les paiements enregistrés dans Facturio (`Payment`, Stripe)

**Frontend**

- [ ] Tableau de bord e-reporting (périodes, statuts, erreurs)
- [ ] Export des déclarations transmises pour archivage

### Phase 6 — Conformité PME & durcissement (avant sept. 2027)

- [ ] Documentation utilisateur (activation, dépannage, FAQ)
- [ ] Tests E2E sur parcours émission + réception
- [ ] Feature flags par taille d’entreprise / date d’obligation
- [ ] Revue sécurité et RGPD (sous-traitant PA, DPA)

## État actuel du code (référence)

| Domaine | Existant | Manquant |
|---------|----------|----------|
| Factures PDF | `invoices` service, export PDF | Factur-X, UBL, CII |
| Envoi client | Email + `publicToken` | Envoi réseau PA |
| TVA | Règles FR/UE de base | Mentions e-facture spécifiques |
| Clients | B2B/B2C de base | SIREN / routage annuaire complet |
| Compta | Écritures ventes/achats | Pipeline facture fournisseur entrant |

Modules à créer ou étendre côté serveur : `server/src/e-invoicing/` (proposition), extensions `invoices`, `clients`, `organizations`, config env (`E_INVOICING_PA_*`).

## Variables d’environnement (prévision)

```env
# Partenaire PA (exemple — noms à aligner sur le contrat)
E_INVOICING_ENABLED=false
E_INVOICING_PROVIDER=                    # identifiant interne du connecteur
E_INVOICING_API_URL=
E_INVOICING_API_KEY=
E_INVOICING_WEBHOOK_SECRET=
E_INVOICING_SANDBOX=true
```

## Critères de « done » par jalons

| Jalon | Critère |
|-------|---------|
| **MVP sept. 2026** | Un utilisateur ETI peut émettre une facture B2B en Factur-X et la transmettre via la PA ; statut consultable ; PDF archivé. |
| **Réception** | Une facture fournisseur reçue via PA est visible et importable dans Facturio. |
| **Sept. 2027** | Parcours PME activé par défaut ; e-reporting des flux concernés opérationnel. |

## Risques si non traité

- Utilisateurs français B2B non conformes aux échéances légales
- Perte de compétitivité face aux logiciels déjà connectés à une PA
- Impossibilité de positionner Facturio comme solution de facturation « complète » pour le marché FR

## Vertical prestations services (spécificité Facturio)

Les prestataires dev / automatisation ont des flux récurrents : **devis forfait**, **acomptes**, **maintenance mensuelle**, **régie**, **clients UE B2B**. La conformité e-facture s’appuie sur les mêmes formats que tout B2B, mais le **modèle de données métier** doit être prêt :

- Catalogue avec libellés et unités exploitables dans le Factur-X (le seed DanielCraft en est la base).
- SIREN / TVA client obligatoires avant tout envoi PA.
- Missions et références devis sur les factures (acompte / solde).
- E-reporting branché sur les `Payment` et abonnements.

Détail des axes produit + tableau cas d’usage × conformité : [POSITIONNEMENT_PRESTATIONS_SERVICES.md](./POSITIONNEMENT_PRESTATIONS_SERVICES.md#rester-conforme-à-la-réforme-tout-en-se-spécialisant).

## Liens internes

- [Positionnement prestations services](./POSITIONNEMENT_PRESTATIONS_SERVICES.md)
- [Roadmap globale](./ROADMAP.md)
- [TODO — section facturation électronique](./TODO.md#-facturation-électronique-réforme-20262027)
- [Architecture](../development/ARCHITECTURE.md)
- [Guide dev e-invoicing](../development/E_INVOICING.md)
- [Dossier accréditation PA](../accreditation-pa/README.md)
- [Parcours complet PA + ISO 27001](../accreditation-pa/09-PARCOURS_COMPLET_PA_ISO27001.md)
- Module factures : `server/src/invoices/`

## Historique des décisions

| Date | Décision |
|------|----------|
| 2026-05 | Document créé ; stratégie par défaut = solution compatible + PA partenaire (à valider en phase 0). |
| 2026-05 | Phase 1–2 partielles livrées (module e-invoicing, SIREN, XML, UI). Dossier [accreditation-pa/](../accreditation-pa/README.md) créé. |
| 2026-06 | **Décision** : objectif immatriculation **PA DanielCraft / Facturio** ; parcours ISO 27001 + inventaire technique sur branche `feat/pa-iso27001-parcours`. |
