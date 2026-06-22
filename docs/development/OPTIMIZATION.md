# Guide d'optimisation du projet PrestaFacture

Ce document liste les optimisations possibles pour améliorer les performances, la maintenabilité et l'expérience utilisateur.

## 🚀 Optimisations prioritaires

### 1. Base de données

#### Problème N+1 dans Dashboard
**Fichier**: `server/src/dashboard/dashboard.service.ts` (lignes 77-84)

**Problème actuel**:
```typescript
const topClients = await Promise.all(
  topClientsData.map(async (item) => {
    const client = await this.prisma.client.findUnique({ where: { id: item.clientId } });
    // N+1 query problem
  })
);
```

**Solution**: Utiliser `include` dans la requête groupBy ou faire une seule requête avec les IDs
```typescript
const clientIds = topClientsData.map(item => item.clientId);
const clients = await this.prisma.client.findMany({
  where: { id: { in: clientIds } }
});
const clientMap = new Map(clients.map(c => [c.id, c]));
const topClients = topClientsData.map(item => ({
  client: {
    id: String(item.clientId),
    name: clientMap.get(item.clientId)?.name || ''
  },
  revenue: Number(item._sum.total || 0)
}));
```

#### Ajouter des index sur les champs de recherche
**Fichier**: `server/prisma/schema.prisma`

```prisma
model Invoice {
  // ... existing fields
  @@index([status, date])
  @@index([clientId])
  @@index([number])
}

model Client {
  // ... existing fields
  @@index([email])
  @@index([name])
}

model Prospect {
  // ... existing fields
  @@index([companyName])
  @@index([industry])
  @@index([status])
}
```

#### Optimiser les requêtes Dashboard
**Problème**: Filtrage en mémoire au lieu de SQL, multiples requêtes séparées

**Solution**: Utiliser des agrégations SQL directes
```typescript
// Au lieu de charger toutes les factures puis filtrer
const thisMonthRevenue = await this.prisma.invoice.aggregate({
  where: {
    status: { in: ['PAID', 'SENT'] },
    date: { gte: thisMonthStart, lte: thisMonthEnd }
  },
  _sum: { total: true }
});
```

### 2. Cache côté serveur

#### Implémenter un cache Redis ou en mémoire
**Fichier**: Nouveau fichier `server/src/common/cache.service.ts`

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class CacheService {
  private cache = new Map<string, { data: any; expires: number }>();

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    return item.data as T;
  }

  set(key: string, data: any, ttlMs: number) {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttlMs
    });
  }

  invalidate(pattern: string) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}
```

**Utilisation dans Dashboard**:
```typescript
async getStats(startDate?: string, endDate?: string) {
  const cacheKey = `dashboard:stats:${startDate || 'all'}:${endDate || 'all'}`;
  const cached = this.cache.get(cacheKey);
  if (cached) return cached;

  const stats = await this.computeStats(startDate, endDate);
  this.cache.set(cacheKey, stats, 5 * 60 * 1000); // 5 min
  return stats;
}
```

### 3. Pagination et limites

#### Ajouter des limites par défaut
**Fichier**: `server/src/common/dto/list-query.dto.ts`

```typescript
export class ListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100) // Limite max
  pageSize?: number = 20;
  
  // ...
}
```

#### Limiter les résultats Dashboard
```typescript
// Au lieu de charger toutes les factures
const recentInvoices = await this.prisma.invoice.findMany({
  take: 10, // ✅ Déjà fait
  orderBy: { createdAt: 'desc' },
  select: { // ✅ Sélectionner seulement les champs nécessaires
    id: true,
    number: true,
    total: true,
    createdAt: true,
    client: { select: { name: true } }
  }
});
```

### 4. Optimisations frontend

#### Code splitting et lazy loading
**Fichier**: `frontend/src/modules/app/App.tsx`

```typescript
// Au lieu d'importer directement
const ClientsPage = lazy(() => import('./clients/ClientsPage'));
const InvoicesPage = lazy(() => import('./invoices/InvoicesPage'));
// etc.
```

#### Optimiser les bundles
**Fichier**: `frontend/vite.config.ts`

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-mui': ['@mui/material', '@mui/icons-material'],
          'vendor-charts': ['chart.js', 'react-chartjs-2']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});
```

#### Debounce sur les recherches
**Fichier**: `frontend/src/services/apiClient.ts`

```typescript
import { debounce } from 'lodash-es';

// Debounce les recherches pour éviter trop de requêtes
const debouncedSearch = debounce((callback: () => void) => {
  callback();
}, 300);
```

### 5. Sécurité et performance API

#### Rate limiting
**Fichier**: `server/src/main.ts`

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limite chaque IP à 100 requêtes par fenêtre
});

app.use('/api/', limiter);
```

#### Compression
```typescript
import compression from 'compression';
app.use(compression());
```

#### Validation des entrées
**Fichier**: `server/src/dashboard/dashboard.controller.ts`

```typescript
@Get('stats')
@UsePipes(new ValidationPipe({ transform: true }))
getStats(
  @Query('startDate') startDate?: string,
  @Query('endDate') endDate?: string
) {
  // Valider le format des dates
  if (startDate && !isValidDate(startDate)) {
    throw new BadRequestException('Format de date invalide');
  }
  return this.dashboard.getStats(startDate, endDate);
}
```

### 6. Optimisations Prisma

#### Utiliser `select` au lieu de `include` quand possible
```typescript
// Au lieu de
include: { client: true }

// Utiliser
select: {
  id: true,
  number: true,
  client: {
    select: {
      id: true,
      name: true
    }
  }
}
```

#### Batch les requêtes avec `$transaction`
```typescript
// Au lieu de plusieurs await séparés
const [stats, invoices, clients] = await Promise.all([
  this.getInvoiceStats(),
  this.getRecentInvoices(),
  this.getActiveClients()
]);
```

### 7. Monitoring et logging

#### Ajouter des logs de performance
```typescript
async getStats() {
  const start = Date.now();
  const stats = await this.computeStats();
  const duration = Date.now() - start;
  
  if (duration > 1000) {
    console.warn(`Dashboard stats took ${duration}ms`);
  }
  
  return stats;
}
```

#### Ajouter des métriques
```typescript
// Utiliser @nestjs/terminus pour health checks
@Get('health')
health() {
  return {
    status: 'ok',
    database: await this.checkDatabase(),
    memory: process.memoryUsage()
  };
}
```

## 📊 Priorités d'implémentation

### Phase 1 (Impact élevé, effort faible)
1. ✅ Corriger le N+1 query dans Dashboard
2. ✅ Ajouter des index sur les champs de recherche
3. ✅ Utiliser `select` au lieu de `include` où possible
4. ✅ Ajouter des limites max sur la pagination

### Phase 2 (Impact élevé, effort moyen)
1. ✅ Implémenter un cache en mémoire pour Dashboard
2. ✅ Optimiser les requêtes Dashboard avec des agrégations
3. ✅ Ajouter rate limiting
4. ✅ Code splitting frontend

### Phase 3 (Impact moyen, effort variable)
1. ✅ Compression HTTP
2. ✅ Debounce sur les recherches frontend
3. ✅ Monitoring et logging
4. ✅ Health checks

## 🔧 Commandes utiles

### Analyser la taille des bundles
```bash
cd frontend
npm run build
npx vite-bundle-visualizer
```

### Analyser les requêtes Prisma
```typescript
// Activer le logging Prisma
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});
```

### Profiler les performances
```bash
# Node.js
node --inspect server/dist/main.js

# Chrome DevTools
chrome://inspect
```

## 📈 Métriques à surveiller

- Temps de réponse API (objectif: < 200ms pour 95% des requêtes)
- Taille des bundles frontend (objectif: < 500KB initial)
- Nombre de requêtes DB par endpoint (objectif: < 5)
- Taux d'erreur (objectif: < 0.1%)
- Utilisation mémoire (objectif: < 500MB en production)

