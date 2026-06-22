# Intégration OSINT - PrestaFacture

Documentation sur les fonctionnalités d'intelligence économique et OSINT dans PrestaFacture.

## Vue d'ensemble

L'intégration OSINT permet d'enrichir automatiquement les données clients et prospects avec des informations publiques, améliorant ainsi la qualité des données et l'intelligence commerciale.

## Fonctionnalités

### Enrichissement des prospects

Le module de prospection intègre des données OSINT pour :

- **Scoring automatique** : Évaluation de 0 à 100 basée sur des critères multiples
- **Données entreprise** : Taille, industrie, budget, chiffre d'affaires
- **Contact principal** : Nom, poste, coordonnées, LinkedIn
- **Source de lead** : Traçabilité de l'origine du prospect

### Sources de données OSINT

Les données peuvent provenir de :

- **Sites web** : Analyse automatique des sites clients
- **LinkedIn** : Informations professionnelles et contacts
- **Crunchbase** : Données startups et entreprises
- **Glassdoor** : Informations employeur
- **Actualités** : Surveillance médias
- **Réseaux sociaux** : Données publiques
- **Registres publics** : Données légales et financières

## Architecture

### Types TypeScript

```typescript
interface OSINTData {
  id: string;
  prospectId: string;
  source: OSINTSource;
  data: Record<string, any>;
  confidence: number; // 0-100
  lastUpdated: Date;
}

enum OSINTSource {
  WEBSITE = 'website',
  LINKEDIN = 'linkedin',
  CRUNCHBASE = 'crunchbase',
  GLASSDOOR = 'glassdoor',
  NEWS = 'news',
  SOCIAL_MEDIA = 'social_media',
  PUBLIC_RECORDS = 'public_records'
}
```

### Intégration dans le module Prospects

Le module de prospection utilise les données OSINT pour :

1. **Enrichissement automatique** : Lors de la création d'un prospect
2. **Scoring** : Calcul du score basé sur les données OSINT
3. **Veille** : Surveillance continue des changements
4. **Alertes** : Notifications sur événements significatifs

## Outils OSINT utilisés

Voir `docs/OSINT_TOOLS.md` pour la liste complète des outils.

### Outils gratuits recommandés

- **Google** : Recherche avancée avec opérateurs
- **HaveIBeenPwned** : Vérification de fuites de données
- **BuiltWith** : Technologies utilisées par les sites
- **Pipl** : Recherche de personnes et emails
- **OpenCorporates** : Données d'entreprises
- **Infogreffe** : Registre du commerce français
- **Wayback Machine** : Archives historiques

### Outils payants (optionnels)

- **Shodan** : Recherche d'infrastructures
- **ZoomInfo** : Contacts B2B professionnels
- **Dun & Bradstreet** : Scoring de crédit
- **Bloomberg Terminal** : Données financières

## Implémentation future

### Phase 1 : Scraping de base

- [ ] Analyse automatique des sites web clients
- [ ] Extraction des informations de contact
- [ ] Détection des technologies utilisées
- [ ] Surveillance des changements de contenu

### Phase 2 : Intégration APIs

- [ ] Intégration LinkedIn API
- [ ] Intégration Crunchbase API
- [ ] Intégration registres publics (INSEE, Infogreffe)
- [ ] Gestion des rate limits et quotas

### Phase 3 : Intelligence avancée

- [ ] Scoring de risque automatique
- [ ] Détection de difficultés financières
- [ ] Veille concurrentielle automatisée
- [ ] Alertes sur changements significatifs

### Phase 4 : Machine Learning

- [ ] Prédiction de conversion
- [ ] Classification automatique des prospects
- [ ] Recommandations personnalisées
- [ ] Détection d'anomalies

## Cas d'usage

### Enrichissement prospect

Lors de la création d'un prospect, le système peut :

1. Rechercher automatiquement l'entreprise sur le web
2. Extraire les informations publiques disponibles
3. Calculer un score de qualité
4. Enrichir le profil avec les données trouvées

### Veille concurrentielle

Surveillance continue pour :

- Détecter de nouveaux acteurs sur le marché
- Analyser l'évolution des prix
- Identifier les tendances sectorielles
- Suivre les changements d'activité

### Analyse de risque

Évaluation automatique basée sur :

- Données financières publiques
- Historique de paiement
- Signaux de difficultés (fermetures, réductions d'effectifs)
- Scoring de crédit

## Conformité et éthique

### Respect de la vie privée

- Utilisation uniquement de données publiques
- Respect des conditions d'utilisation des APIs
- Pas de collecte de données personnelles sensibles
- Conformité RGPD

### Bonnes pratiques

- Rate limiting pour éviter la surcharge
- Cache des données pour limiter les requêtes
- Anonymisation des données sensibles
- Logs d'audit pour traçabilité

## Configuration

### Variables d'environnement

```env
# APIs OSINT (optionnel)
LINKEDIN_API_KEY=...
CRUNCHBASE_API_KEY=...
SHODAN_API_KEY=...

# Scraping
SCRAPER_USER_AGENT=PrestaFacture/1.0
SCRAPER_TIMEOUT=30000
SCRAPER_RATE_LIMIT=10
```

### Configuration du scraper

```typescript
{
  userAgent: 'PrestaFacture/1.0',
  timeout: 30000,
  rateLimit: 10, // requêtes par seconde
  retryAttempts: 3
}
```

## Monitoring

### Métriques à suivre

- Nombre de prospects enrichis
- Taux de succès des requêtes OSINT
- Temps de réponse moyen
- Erreurs et timeouts
- Utilisation des quotas API

### Alertes

- Quotas API proches de la limite
- Taux d'erreur élevé
- Timeouts fréquents
- Changements significatifs détectés

## Ressources

- [OSINT_TOOLS.md](./OSINT_TOOLS.md) : Liste complète des outils OSINT
- [ROADMAP.md](./ROADMAP.md) : Roadmap avec fonctionnalités OSINT
- Module Prospects : `frontend/src/modules/prospects/`

## Évolutions futures

Voir la roadmap pour les fonctionnalités OSINT à venir :

- Scraping avancé des sites web
- Intégration d'APIs externes
- Machine Learning pour prédictions
- Veille concurrentielle automatisée
- Intelligence des risques




