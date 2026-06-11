# Dossier de candidature — Plateforme Agréée (PA)

Ce répertoire regroupe les éléments pour une **candidature à l'immatriculation** en tant que Plateforme Agréée (réforme facturation électronique B2B, DGFiP), ainsi que la **piste de repli** : Facturio en **solution compatible** connectée à une PA partenaire.

**Éditeur** : Loïc DANIEL — DanielCraft (micro-entreprise)  
**Produit** : Facturio  
**Dernière mise à jour** : juin 2026

## Statut du projet

| Piste | Statut | Note |
|-------|--------|------|
| **Immatriculation PA DanielCraft / Facturio** | **Objectif retenu** — dossier en préparation | Bloquant : ISO 27001 + produit PA + interop PPF |
| **Solution compatible + PA partenaire** | Piste de repli possible | Si délai immatriculation dépassé (ex. sept. 2026) |

## Document principal (suivi)

| Fichier | Description |
|---------|-------------|
| **[09-PARCOURS_COMPLET_PA_ISO27001.md](./09-PARCOURS_COMPLET_PA_ISO27001.md)** | **Parcours PA dédiée + ISO 27001 — guide complet, planning, tableaux d'avancement** |

## Contenu du dossier

| Fichier | Description |
|---------|-------------|
| [00-SYNTHESE-EXECUTIVE.md](./00-SYNTHESE-EXECUTIVE.md) | Synthèse pour dépôt ou partenaires (2 pages) |
| [01-cadre-reglementaire.md](./01-cadre-reglementaire.md) | Calendrier LCEN, PA, PPF, formats |
| [02-identite-danielcraft.md](./02-identite-danielcraft.md) | Identité légale (alignée danielcraft.fr) |
| [03-architecture-solution-compatible.md](./03-architecture-solution-compatible.md) | Schéma Facturio ↔ PA ↔ réseau |
| [04-dossier-technique-facturio.md](./04-dossier-technique-facturio.md) | Module e-invoicing, API, données |
| [05-securite-conformite.md](./05-securite-conformite.md) | RGPD, sécurité, hébergement |
| [06-plan-certification-iso27001.md](./06-plan-certification-iso27001.md) | Feuille de route certification |
| [07-checklist-depot-immatriculation.md](./07-checklist-depot-immatriculation.md) | Checklist administrative DGFiP |
| [08-piste-pa-partenaire.md](./08-piste-pa-partenaire.md) | Piste de repli court terme (commission / API) |
| [09-PARCOURS_COMPLET_PA_ISO27001.md](./09-PARCOURS_COMPLET_PA_ISO27001.md) | Parcours PA dédiée, ISO 27001, avancement |
| [10-INVENTAIRE_CODE_ET_PAGES_PA.md](./10-INVENTAIRE_CODE_ET_PAGES_PA.md) | Fichiers code, pages UI, infra à modifier |
| [annexes/isms/](./annexes/isms/) | Modèles ISMS à compléter (périmètre, procédures, RGPD) |
| [templates/lettre-accompagnement-depot.md](./templates/lettre-accompagnement-depot.md) | Modèle de lettre |
| [annexes/references-officielles.md](./annexes/references-officielles.md) | Liens impots.gouv.fr, démarches |

## Liens internes

- [Plan technique réforme 2026](../planning/FACTURATION_ELECTRONIQUE_2026.md)
- [Conformité RGPD & réforme](../planning/CONFORMITE_RGPD_ET_FACTURATION_2026.md)
- [Guide développeur e-invoicing](../development/E_INVOICING.md)
- [Dépôt en ligne](https://demarche.numerique.gouv.fr/commencer/immatpdp)

## Prochaines actions

Voir le suivi détaillé : **[09-PARCOURS_COMPLET_PA_ISO27001.md](./09-PARCOURS_COMPLET_PA_ISO27001.md)**.

1. Demander devis consultants ISO + organismes certificateurs.
2. Démarrer l'ISMS (périmètre, politique sécurité, registre risques).
3. Automatiser sauvegardes prod + test de restauration.
4. Poursuivre le produit PA (Factur-X, émission, réception) en parallèle.
5. Ne déposer `immatpdp` qu'après obtention du certificat ISO 27001.
