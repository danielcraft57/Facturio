# Dossier de candidature — Plateforme Agréée (PA)

Ce répertoire regroupe les éléments pour une **candidature à l’immatriculation** en tant que Plateforme Agréée (réforme facturation électronique B2B, DGFiP), ainsi que la **piste parallèle recommandée** : PrestaFacture en **solution compatible** connectée à une PA partenaire.

**Éditeur** : Loïc DANIEL — DanielCraft (micro-entreprise)  
**Produit** : PrestaFacture  
**Dernière mise à jour** : mai 2026

## Statut du projet

| Piste | Statut | Recommandation |
|-------|--------|----------------|
| **Solution compatible + PA partenaire** | En cours (module e-facture partiel) | **Prioritaire** — délai et coût maîtrisés |
| **Immatriculation PA DanielCraft / PrestaFacture** | Dossier en préparation (ce dossier) | Long terme — ISO 27001, audits, interop PPF |

## Contenu du dossier

| Fichier | Description |
|---------|-------------|
| [00-SYNTHESE-EXECUTIVE.md](./00-SYNTHESE-EXECUTIVE.md) | Synthèse pour dépôt ou partenaires (2 pages) |
| [01-cadre-reglementaire.md](./01-cadre-reglementaire.md) | Calendrier LCEN, PA, PPF, formats |
| [02-identite-danielcraft.md](./02-identite-danielcraft.md) | Identité légale (alignée danielcraft.fr) |
| [03-architecture-solution-compatible.md](./03-architecture-solution-compatible.md) | Schéma PrestaFacture ↔ PA ↔ réseau |
| [04-dossier-technique-facturio.md](./04-dossier-technique-facturio.md) | Module e-invoicing, API, données |
| [05-securite-conformite.md](./05-securite-conformite.md) | RGPD, sécurité, hébergement |
| [06-plan-certification-iso27001.md](./06-plan-certification-iso27001.md) | Feuille de route certification |
| [07-checklist-depot-immatriculation.md](./07-checklist-depot-immatriculation.md) | Checklist administrative DGFiP |
| [08-piste-pa-partenaire.md](./08-piste-pa-partenaire.md) | Piste de repli court terme (commission / API) |
| [GUIDE_REMPLISSAGE_FORMULAIRE_DN.md](./GUIDE_REMPLISSAGE_FORMULAIRE_DN.md) | Remplissage formulaire DN, alerte SIRET |
| [annexes/pieces-depot/](./annexes/pieces-depot/) | Brouillons pièces PDF à signer (dépôt immatpdp) |
| [annexes/isms/](./annexes/isms/) | Modèles ISMS (ISO 27001) |
| [templates/lettre-accompagnement-depot.md](./templates/lettre-accompagnement-depot.md) | Modèle de lettre |
| [annexes/references-officielles.md](./annexes/references-officielles.md) | Liens impots.gouv.fr, démarches |

## Liens internes

- [Plan technique réforme 2026](../planning/FACTURATION_ELECTRONIQUE_2026.md)
- [Conformité RGPD & réforme](../planning/CONFORMITE_RGPD_ET_FACTURATION_2026.md)
- [Guide développeur e-invoicing](../development/E_INVOICING.md)
- [Dépôt en ligne](https://demarche.numerique.gouv.fr/commencer/immatpdp)

## Prochaines actions

1. Valider la décision : PA propre **ou** PA partenaire (voir [08-piste-pa-partenaire.md](./08-piste-pa-partenaire.md)).
2. Compléter les cases « à fournir » du [07-checklist-depot-immatriculation.md](./07-checklist-depot-immatriculation.md) (Kbis, hébergeur, DPO).
3. Lancer l’audit ISO/IEC 27001 si immatriculation PA retenue ([06-plan-certification-iso27001.md](./06-plan-certification-iso27001.md)).
4. Poursuivre le MVP solution compatible (Factur-X + connecteur PA sandbox).
