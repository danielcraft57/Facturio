# Positionnement — Prestations de services numériques

Facturio n’est pas un logiciel de facturation générique : il est conçu pour les **prestataires de services numériques** — développement web, logiciels sur mesure, automatisation, intégrations API, maintenance, offres IA — avec un catalogue et des parcours adaptés à ce métier.

**Référence produit actuelle** : catalogue DanielCraft (seed + UI produits) — sites vitrine, apps métier, intégrations, maintenance, packs IA.  
**Conformité réforme 2026** : [FACTURATION_ELECTRONIQUE_2026.md](./FACTURATION_ELECTRONIQUE_2026.md).  
**Monétisation (bootstrap)** : [MONETISATION.md](./MONETISATION.md).

**Dernière mise à jour** : mai 2026.

---

## Périmètre métier visé

| Segment | Exemples de prestations | Modèle de facturation typique |
|---------|-------------------------|-------------------------------|
| **Développement web** | Site vitrine, refonte, pages, formulaires | Forfait, devis → facture, acomptes |
| **Logiciel & apps métier** | Application sur mesure, SaaS livré au client | Jalons / phases, récurrence licence |
| **Automatisation & intégration** | API, CRM, migrations, scripts, n8n/Make | Régie (TJM) ou forfait par lot |
| **IA & assistants** | Chatbot, contenus, FAQ, évolutions mensuelles | Abonnement + setup initial |
| **Maintenance & support** | Hébergement, sécurité, correctifs, SLA | Mensuel / annuel, consommation |
| **Conseil technique** | Audit, architecture, performance | Mission courte, facture unique |

**Utilisateurs cibles** : auto-entrepreneurs et sociétés du numérique (micro, EURL, SASU, agences) qui facturent principalement en **B2B** (parfois B2C pour particuliers).

---

## Ce qui existe déjà dans le projet

- **Catalogue prestations** : `server/prisma/seeds/danielcraft-prestations.data.ts`, sections (identité, IA, technique, site, maintenance, offres).
- **Types produit** : `ProductKind` (`SERVICE`, `SAAS`, `APP`, `GOOD`), catégories (`DEV`, `MAINTENANCE`, `API`, `CI_CD`, etc.) — `frontend/src/types/product.ts`.
- **UI catalogue** : grille visuelle, filtres, sections — `frontend/src/modules/products/`.
- **Cycle commercial** : devis, conversion, factures, PDF, envoi email, lien public, paiements (Stripe).
- **TVA** : règles FR / UE B2B (autoliquidation) de base côté serveur.

Ce socle couvre le **métier** ; la **réforme facturation électronique** reste à brancher (voir doc dédiée).

---

## Développer la spécialisation (axe produit)

Objectif : renforcer l’outil là où un généraliste (Sage, Pennylane seul, etc.) est faible pour les **prestations intellectuelles / numériques**.

### 1. Catalogue & devis intelligents

- [ ] Bibliothèque de prestations par défaut (seed + import) alignée secteur dev / auto
- [ ] Modèles de devis par type : « site vitrine », « intégration API », « maintenance annuelle »
- [ ] Lignes avec **description technique** structurée (périmètre, livrables, hors périmètre)
- [ ] Lien **heures estimées** (`estimatedHours`) ↔ proposition TJM / forfait
- [ ] Packs et options (SEO, hébergement, formation) en lignes enfants ou produits liés

### 2. Modes de facturation services

- [ ] **Forfait** : une ou plusieurs factures (acompte 30 % / solde 70 %)
- [ ] **Régie** : saisie temps (futur module temps) → lignes « X h × TJM »
- [ ] **Récurrent** : abonnements maintenance / SLA (déjà partiellement prévu v1.1 roadmap)
- [ ] **Avenants** : factures complémentaires liées au devis / contrat initial

### 3. Relation client B2B

- [ ] Fiche client enrichie : SIREN, code NAF, contact technique vs facturation
- [ ] Historique par **mission** (projet) : devis → factures → paiements
- [ ] Notes internes (stack, repo, environnement) — hors facture, utile au prestataire

### 4. Contenu des documents

- [ ] Mentions légales **prestations de services** (délai de paiement, pénalités, indemnité 40 €)
- [ ] Clause propriété intellectuelle / licence (modèles par type de livrable)
- [ ] Référence au **bon de commande** ou au **devis accepté** sur chaque facture

### 5. Vertical « DanielCraft » vs multi-tenant

- Aujourd’hui : catalogue DanielCraft comme **référence** et seed.
- Demain : chaque organisation peut **cloner / personnaliser** le catalogue sans perdre la structure (sections, SKU, catégories).
- Ne pas confondre : Facturio = produit ; DanielCraft = premier cas d’usage / démo.

---

## Rester conforme à la réforme tout en se spécialisant

La spécialisation **ne dispense pas** de la facturation électronique : elle impose de **modéliser correctement** les cas d’usage services pour que le passage par une PA soit transparent.

### Principe

```
Catalogue métier (Facturio)  →  Facture structurée (Factur-X)  →  PA partenaire  →  Client B2B + DGFiP
```

Facturio reste la **couche métier** ; la PA assure le **réseau réglementaire**. Voir [FACTURATION_ELECTRONIQUE_2026.md](./FACTURATION_ELECTRONIQUE_2026.md).

### Cas d’usage services × conformité

| Cas métier | Ce que Facturio doit porter | Conformité e-facture |
|------------|----------------------------|----------------------|
| Devis accepté → facture forfait | Lignes = prestations catalogue, TVA, totaux | Émission Factur-X à l’envoi ; statut PA |
| Acompte + solde | 2 factures liées au même devis / mission | 2 flux B2B distincts, références croisées |
| Maintenance mensuelle | Facture récurrente ou abonnement | Émission chaque période ; e-reporting **paiements** si encaissement décalé |
| Client UE B2B (autoliquidation) | TVA 0 % + mention + n° TVA intracom | Même format électronique ; règles TVA dans le XML |
| Particulier (B2C) | Facture classique ou simplifiée | Souvent **e-reporting** (pas toujours facture électronique B2B obligatoire) |
| Sous-traitance reçue | Facture fournisseur dev (hébergeur, licence) | **Réception** via PA → module entrant |

### Données à enrichir (indispensables pour la PA)

Pour chaque **organisation** (émetteur) et **client B2B** :

- SIREN / SIRET, raison sociale, adresse complète
- N° TVA intracommunautaire si applicable
- Adresse de facturation dédiée (si différente du siège)

Pour chaque **ligne de prestation** (spécificité dev / services) :

- Libellé **exploitable fiscalement** (nature de la prestation, pas seulement « Dev »)
- Quantité / unité (`heure`, `forfait`, `mois`, `unité`)
- Prix HT, taux TVA, code TVA si requis par le format
- Optionnel mais utile : référence **devis** / **mission** / **période** (ex. « Maintenance 2026-05 »)

Ces champs alimentent le **Factur-X** ; le catalogue DanielCraft (`description`, `details`, `sku`, `category`) est une base déjà adaptée.

### Roadmap couplée (métier + conformité)

| Priorité | Spécialisation métier | Conformité réforme |
|----------|----------------------|-------------------|
| **P0** | SIREN client + mentions légales prestations | Cadrage PA partenaire |
| **P1** | Modèles devis/facture par section catalogue | Génération Factur-X |
| **P2** | Missions / lien devis–facture–acompte | Envoi + statuts PA |
| **P3** | Abonnements maintenance | E-reporting paiements |
| **P4** | Import factures fournisseurs (hébergement, outils) | Réception PA |
| **P5** | Export compta + FEC (déjà partiel) | Archivage preuves + logs PA |

Ne pas développer uniquement le catalogue visuel sans les champs réglementaires : une belle carte produit **sans SIREN client** bloquera l’émission électronique.

### E-reporting : spécificités prestataires services

En plus des factures B2B :

- **Encaissements** (virement, Stripe, PayPal) à déclarer selon les flux définis par la réforme
- **B2C** ou export hors périmètre facture électronique stricte → agrégation e-reporting
- **Notes de frais refacturées** : traiter en ligne distincte ou facture séparée (à cadrer comptablement)

Facturio enregistre déjà des `Payment` et Stripe : le branchement e-reporting réutilisera ces données (phase 5 de la doc réforme).

---

## Architecture cible (vertical + conformité)

```
┌──────────────────────────────────────────────────────────────┐
│  Couche métier Facturio (spécialisation services numériques) │
│  · Catalogue sections (IA, dev, maintenance…)                │
│  · Devis / missions / acomptes / récurrence                  │
│  · TVA prestations FR / UE                                   │
└────────────────────────────┬─────────────────────────────────┘
                             │ mapping champs réglementaires
                             ▼
┌──────────────────────────────────────────────────────────────┐
│  Couche e-invoicing (Factur-X, validation)                   │
└────────────────────────────┬─────────────────────────────────┘
                             ▼
                    Plateforme Agréée partenaire
```

---

## Fichiers code de référence

| Rôle | Chemin |
|------|--------|
| Seed catalogue prestations | `server/prisma/seeds/danielcraft-prestations.data.ts` |
| Seed produits | `server/prisma/seeds/products.seed.ts` |
| Constantes UI catalogue | `frontend/src/modules/products/constants/danielCraftCatalog.ts` |
| Types produit | `frontend/src/types/product.ts` |
| Module factures | `server/src/invoices/` |
| Module devis | `server/src/quotes/` |

---

## Tâches doc & produit (synthèse)

Voir aussi [TODO.md](./TODO.md) (sections *Prestations services* et *Facturation électronique*).

- [ ] Valider ce positionnement comme **vision produit** officielle du dépôt
- [ ] Documenter les modèles de devis types (1 page par offre principale)
- [ ] Aligner roadmap v1.3 e-facture avec les jalons métier du tableau ci-dessus
- [ ] Éviter toute dérive « e-commerce / stock » hors scope sans besoin utilisateur explicite

---

## Liens

- [Monétisation économique](./MONETISATION.md)
- [Facturation électronique 2026–2027](./FACTURATION_ELECTRONIQUE_2026.md)
- [Roadmap globale](./ROADMAP.md)
- [TODO](./TODO.md)
- [Intégration URSSAF](./URSSAF_INTEGRATION.md) (cotisations prestations services BIC/BNC)
