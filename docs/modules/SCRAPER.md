# Module Scraper - PrestaFacture

Documentation sur le module de scraping web pour l'enrichissement de données.

## Vue d'ensemble

Le module scraper permet d'extraire automatiquement des informations depuis des sites web pour enrichir les données clients et prospects.

## Fonctionnalités

### Extraction de données

- **Informations entreprise** : Nom, description, secteur d'activité
- **Contacts** : Emails, téléphones, adresses
- **Équipe** : Photos, noms, postes des collaborateurs
- **Technologies** : Stack technique utilisée
- **Actualités** : Dernières nouvelles et événements

### Surveillance continue

- **Changements de contenu** : Détection des modifications
- **Nouveaux employés** : Suivi des recrutements
- **Évolution des services** : Nouvelles offres
- **Alertes automatiques** : Notifications sur changements

## Architecture

### Technologies utilisées

- **Puppeteer/Playwright** : Scraping de sites dynamiques (JavaScript)
- **Cheerio** : Parsing HTML statique
- **Axios** : Requêtes HTTP simples
- **Node-cron** : Jobs programmés pour surveillance

### Structure du module

```
server/src/scraper/
├── scraper.module.ts
├── scraper.service.ts
├── scraper.controller.ts
├── strategies/
│   ├── puppeteer.strategy.ts
│   ├── cheerio.strategy.ts
│   └── api.strategy.ts
└── utils/
    ├── extractors.ts
    └── validators.ts
```

## Utilisation

### Scraping basique

```typescript
// Scraper service
const data = await scraperService.scrape(url, {
  extractors: ['company', 'contacts', 'team']
});
```

### Scraping avec stratégie

```typescript
// Utiliser Puppeteer pour sites dynamiques
const data = await scraperService.scrape(url, {
  strategy: 'puppeteer',
  waitFor: '.content',
  extractors: ['company', 'team']
});
```

### Surveillance programmée

```typescript
// Job cron pour surveillance quotidienne
@Cron('0 9 * * *') // Tous les jours à 9h
async monitorClients() {
  const clients = await this.clientService.findAll();
  for (const client of clients) {
    if (client.website) {
      await this.scraperService.monitor(client.website, client.id);
    }
  }
}
```

## Extracteurs

### Informations entreprise

```typescript
extractCompanyInfo(html: string): CompanyInfo {
  return {
    name: extractMetaTag(html, 'og:site_name'),
    description: extractMetaTag(html, 'description'),
    industry: extractFromSelector(html, '.industry'),
    // ...
  };
}
```

### Équipe

```typescript
extractTeam(html: string): TeamMember[] {
  const members = [];
  // Extraction depuis sélecteurs CSS
  // ...
  return members;
}
```

### Contacts

```typescript
extractContacts(html: string): ContactInfo {
  return {
    email: extractEmail(html),
    phone: extractPhone(html),
    address: extractAddress(html),
    // ...
  };
}
```

## Stratégies de scraping

### Puppeteer (sites dynamiques)

Pour les sites qui chargent du contenu via JavaScript :

```typescript
const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.goto(url);
await page.waitForSelector('.content');
const html = await page.content();
await browser.close();
```

### Cheerio (sites statiques)

Pour les sites HTML classiques :

```typescript
const $ = cheerio.load(html);
const title = $('h1').text();
const description = $('meta[name="description"]').attr('content');
```

### API (si disponible)

Pour les sites avec API publique :

```typescript
const response = await axios.get(apiUrl);
const data = response.data;
```

## Gestion des erreurs

### Rate limiting

```typescript
const rateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60000 // 1 minute
});

await rateLimiter.wait();
await scraperService.scrape(url);
```

### Retry automatique

```typescript
async scrapeWithRetry(url: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await this.scrape(url);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(1000 * (i + 1)); // Backoff exponentiel
    }
  }
}
```

### Gestion des timeouts

```typescript
const timeout = 30000; // 30 secondes
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), timeout);

try {
  const response = await fetch(url, { signal: controller.signal });
  // ...
} catch (error) {
  if (error.name === 'AbortError') {
    // Timeout géré
  }
} finally {
  clearTimeout(timeoutId);
}
```

## Anti-détection

### Rotation User-Agent

```typescript
const userAgents = [
  'Mozilla/5.0...',
  'Mozilla/5.0...',
  // ...
];

const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
```

### Délais aléatoires

```typescript
await sleep(Math.random() * 2000 + 1000); // 1-3 secondes
```

### Cookies et sessions

```typescript
const cookies = await getCookies();
await page.setCookie(...cookies);
```

### Proxy rotation (optionnel)

```typescript
const proxies = ['proxy1', 'proxy2', ...];
const proxy = proxies[Math.floor(Math.random() * proxies.length)];
```

## Stockage des données

### Cache

Les données scrapées sont mises en cache pour éviter les requêtes répétées :

```typescript
const cacheKey = `scrape:${url}`;
const cached = await cache.get(cacheKey);
if (cached) return cached;

const data = await scrape(url);
await cache.set(cacheKey, data, { ttl: 3600 }); // 1 heure
```

### Base de données

Les données sont stockées dans Prisma :

```typescript
await prisma.scrapeData.create({
  data: {
    url,
    clientId,
    data: scrapedData,
    scrapedAt: new Date(),
  },
});
```

## Endpoints API

### Lancer un scraping

```http
POST /scraper/scrape
Content-Type: application/json

{
  "url": "https://example.com",
  "clientId": 1,
  "options": {
    "extractors": ["company", "contacts", "team"],
    "strategy": "puppeteer"
  }
}
```

### Lister les données scrapées

```http
GET /scraper/data?clientId=1
```

### Surveillance d'un site

```http
POST /scraper/monitor
Content-Type: application/json

{
  "url": "https://example.com",
  "clientId": 1,
  "frequency": "daily"
}
```

## Configuration

### Variables d'environnement

```env
# Scraper
SCRAPER_ENABLED=true
SCRAPER_USER_AGENT=PrestaFacture/1.0
SCRAPER_TIMEOUT=30000
SCRAPER_RATE_LIMIT=10
SCRAPER_CACHE_TTL=3600

# Puppeteer
PUPPETEER_HEADLESS=true
PUPPETEER_ARGS=--no-sandbox,--disable-setuid-sandbox

# Proxy (optionnel)
SCRAPER_PROXY_ENABLED=false
SCRAPER_PROXY_LIST=proxy1,proxy2
```

## Monitoring

### Métriques

- Nombre de scrapings réussis/échoués
- Temps moyen de scraping
- Taux d'erreur
- Utilisation du cache

### Logs

```typescript
logger.log(`Scraping ${url}`, 'ScraperService');
logger.warn(`Timeout on ${url}`, 'ScraperService');
logger.error(`Error scraping ${url}: ${error}`, 'ScraperService');
```

## Bonnes pratiques

1. **Respecter les robots.txt** : Vérifier avant de scraper
2. **Rate limiting** : Ne pas surcharger les serveurs
3. **Cache** : Mettre en cache les résultats
4. **Erreurs gracieuses** : Gérer les erreurs sans planter
5. **Logs** : Logger les actions importantes
6. **Tests** : Tester avec des sites réels mais respectueux

## Conformité

### Respect de la vie privée

- Utiliser uniquement des données publiques
- Respecter les conditions d'utilisation
- Ne pas collecter de données personnelles sensibles
- Conformité RGPD

### Législation

- Vérifier la légalité du scraping selon la juridiction
- Respecter les termes de service des sites
- Obtenir autorisation si nécessaire

## Évolutions futures

- [ ] Scraping multi-thread
- [ ] Support de plus de formats (PDF, etc.)
- [ ] Machine Learning pour extraction
- [ ] Intégration avec APIs externes
- [ ] Dashboard de monitoring
- [ ] Alertes automatiques sur changements




