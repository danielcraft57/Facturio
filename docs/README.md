# Documentation Facturio

Documentation complète du projet Facturio, organisée par catégories.

**Positionnement** : Facturio est orienté **prestations de services numériques** (développement web, logiciel sur mesure, automatisation, intégrations, maintenance, offres IA) — voir [Positionnement prestations](./planning/POSITIONNEMENT_PRESTATIONS_SERVICES.md).

## Structure de la documentation

```
docs/
├── getting-started/    # Démarrage rapide
├── api/                # Documentation API
├── accreditation-pa/   # Dossier candidature Plateforme Agréée
├── deployment/         # Déploiement en production
├── development/        # Guides de développement
├── modules/            # Modules spécialisés
├── planning/           # Roadmap et planning
└── changelog/          # Changelogs et notes
```

## Démarrage rapide

### [Installation](./getting-started/INSTALLATION.md)
Guide complet pour installer et démarrer Facturio en local, avec Docker, et dépannage.

### [Configuration des environnements](./getting-started/ENVIRONMENTS.md)
Configuration des variables d'environnement pour développement et production.

## API

### [Documentation API](./api/API.md)
Documentation complète des endpoints de l'API REST, avec exemples cURL et codes de statut.

## Développement

### [Architecture](./development/ARCHITECTURE.md)
Vue d'ensemble de l'architecture du projet, structure des modules, stack technique et principes de conception.

### [Guide de développement](./development/DEVELOPMENT.md)
Guide pour contribuer au projet : workflow, structure du code, tests, bonnes pratiques.

### [CI/CD](./development/CI_CD.md)
Documentation sur l'intégration continue et le déploiement de Facturio.

### [Déploiement production](./deployment/DEPLOIEMENT_PRODUCTION.md)
Guide complet pour déployer Facturio en production (serveur applicatif, Nginx, SSL, build local). Voir aussi `scripts/deploy/README.md` pour la liste des scripts (Windows et Linux).

### [Optimisation](./development/OPTIMIZATION.md)
Guide d'optimisation des performances et des ressources.

## Modules spécialisés

### [OSINT](./modules/OSINT.md)
Documentation sur l'intégration OSINT pour l'enrichissement de données clients et prospects.

### [Scraper](./modules/SCRAPER.md)
Documentation du module de scraping web pour l'extraction automatique d'informations.

### [Outils OSINT](./modules/OSINT_TOOLS.md)
Liste complète des outils OSINT disponibles, gratuits et payants, pour l'intelligence économique.

## Planning et Roadmap

### [Roadmap globale](./planning/ROADMAP.md)
Vue d'ensemble des fonctionnalités à venir, phases de développement et priorités, alignée avec l'état réel du projet (backend + frontend).

### [Positionnement — Prestations services](./planning/POSITIONNEMENT_PRESTATIONS_SERVICES.md)
Vision produit (dev web, logiciel, automatisation) et développement du vertical en conformité avec la réforme.

### [Monétisation (bootstrap)](./planning/MONETISATION.md)
Méthode économique pour rentabiliser Facturio (freemium, dogfooding DanielCraft, PA partenaire, SEO).

### [Stratégie acquisition & inscriptions 2026](./planning/STRATEGIE_ACQUISITION_INSCRIPTIONS_2026.md)
Concurrence, réglementation, entonnoir d’inscription, priorisation produit et messages marketing (landing pages).

### [Roadmap d'exécution 2026](./planning/ROADMAP_EXECUTION_2026.md)
Sprints opérationnels (conformité PA, vertical métier, compta UI) — suivi branche `feat/roadmap-execution-2026`.

### [Facturation électronique 2026–2027](./planning/FACTURATION_ELECTRONIQUE_2026.md)
Plan de mise en conformité avec la réforme française (PA, Factur-X, e-reporting, jalons sept. 2026 / 2027).

### [Dossier accréditation PA](./accreditation-pa/README.md)
Candidature immatriculation Plateforme Agréée (DanielCraft) + piste PA partenaire.

### [Module e-invoicing (dev)](./development/E_INVOICING.md)
API, tests et évolutions techniques du module conformité 2026.

### [TODO - Liste complète](./planning/TODO.md)
Liste exhaustive de toutes les tâches restantes, organisée par priorité et domaine.

### [Avancement du projet](./planning/AVANCEMENT.md)
État actuel du projet, progression globale et fonctionnalités implémentées (version, pourcentage d'avancement, par module).

## Changelog et notes

### [Changelog - Priorités hautes](./changelog/CHANGELOG_PRIORITES_HAUTES.md)
Changelog détaillé des fonctionnalités prioritaires implémentées.

### [Changelog - DTOs et Pagination](./changelog/CHANGELOG_DTO_PAGINATION.md)
Changelog des fonctionnalités DTOs, pagination, tri et recherche.

### [Notes de développement](./changelog/NOTES_DEVELOPPEMENT.md)
Notes techniques et décisions de développement pour les fonctionnalités prioritaires.

## Documentation par composant

### Backend
- Voir `server/README.md` pour la documentation du serveur
- Voir `server/ROADMAP.md` pour la roadmap backend

### Frontend
- Voir `frontend/README.md` pour la documentation du frontend
- Voir `frontend/ROADMAP.md` pour la roadmap frontend

### Module Prospects
- Voir `frontend/src/modules/prospects/README.md` pour la documentation du module de prospection

## Liens rapides

### Démarrage
- [Installation](./getting-started/INSTALLATION.md)
- [Configuration](./getting-started/ENVIRONMENTS.md)

### API & Développement
- [API](./api/API.md)
- [Architecture](./development/ARCHITECTURE.md)
- [Développement](./development/DEVELOPMENT.md)
- [CI/CD](./development/CI_CD.md)
- [Déploiement production](./deployment/DEPLOIEMENT_PRODUCTION.md)

### Modules
- [OSINT](./modules/OSINT.md)
- [Scraper](./modules/SCRAPER.md)
- [Outils OSINT](./modules/OSINT_TOOLS.md)

### Planning
- [Roadmap](./planning/ROADMAP.md)
- [Positionnement prestations services](./planning/POSITIONNEMENT_PRESTATIONS_SERVICES.md)
- [Monétisation](./planning/MONETISATION.md)
- [Stratégie acquisition 2026](./planning/STRATEGIE_ACQUISITION_INSCRIPTIONS_2026.md)
- [Facturation électronique 2026](./planning/FACTURATION_ELECTRONIQUE_2026.md)
- [TODO](./planning/TODO.md)
- [Avancement](./planning/AVANCEMENT.md)

### Changelog
- [Priorités hautes](./changelog/CHANGELOG_PRIORITES_HAUTES.md)
- [Notes de développement](./changelog/NOTES_DEVELOPPEMENT.md)

## Contribuer

Pour contribuer à la documentation :

1. Modifier les fichiers Markdown dans `docs/`
2. Suivre le style existant
3. Vérifier la syntaxe Markdown
4. Créer une PR avec les changements

## Questions

Pour toute question sur la documentation, ouvrir une issue sur GitHub.
