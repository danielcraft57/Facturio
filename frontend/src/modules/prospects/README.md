# Module Prospection - Facturio

## 🎯 Vue d'ensemble

Le module de prospection permet de gérer l'ensemble du pipeline commercial, de la qualification des prospects jusqu'à la conversion en clients. Il intègre des fonctionnalités d'OSINT, d'analyse de marché et de suivi des opportunités.

## 🚀 Fonctionnalités

### Gestion des prospects
- **CRUD complet** : Création, lecture, mise à jour et suppression des prospects
- **Scoring automatique** : Évaluation de 0 à 100 basée sur différents critères
- **Statuts de suivi** : Pipeline de vente complet (nouveau → contacté → qualifié → proposition → négociation → gagné/perdu)
- **Priorités** : Faible, moyenne, élevée, urgente
- **Tags et catégorisation** : Organisation flexible des prospects

### Informations enrichies
- **Données entreprise** : Taille, industrie, budget, chiffre d'affaires
- **Contact principal** : Nom, poste, coordonnées, LinkedIn
- **Points de douleur** : Identification des besoins et problèmes
- **Notes et historique** : Suivi des interactions et évolutions
- **Source de lead** : Traçabilité de l'origine du prospect

### Filtres et recherche
- **Recherche textuelle** : Par nom d'entreprise, industrie, contact
- **Filtres avancés** : Statut, priorité, taille, budget, source
- **Pagination** : Gestion de grandes listes de prospects
- **Tri intelligent** : Par score, date de création, priorité

### Analytics et métriques
- **Tableau de bord** : Vue d'ensemble des prospects par statut
- **Statistiques** : Répartition par industrie, taille, source
- **Taux de conversion** : Suivi des performances commerciales
- **ROI des sources** : Analyse de l'efficacité des canaux

## 🏗️ Architecture

### Types TypeScript
```typescript
// Prospect principal
interface Prospect {
  id: string;
  companyName: string;
  industry: string;
  size: CompanySize;
  status: ProspectStatus;
  score: number;
  priority: Priority;
  // ... autres champs
}

// Enums
enum ProspectStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  // ... autres statuts
}
```

### Store Zustand
```typescript
// Store principal avec cache et synchronisation
export const useProspectsStore = create<ProspectsState>()(
  devtools(
    persist(
      (set, get) => ({
        prospects: [],
        filters: {},
        // ... état et actions
      })
    )
  )
);
```

### Service API
```typescript
export class ProspectService {
  async getProspects(filters?: ProspectFilters): Promise<Prospect[]>
  async createProspect(data: CreateProspectDto): Promise<Prospect>
  async updateProspect(id: string, data: UpdateProspectDto): Promise<Prospect>
  async deleteProspect(id: string): Promise<void>
  // ... autres méthodes
}
```

## 📱 Composants UI

### ProspectsPage
Page principale avec :
- Tableau des prospects avec colonnes personnalisées
- Filtres et recherche en temps réel
- Statistiques et métriques
- Actions CRUD (créer, modifier, supprimer)

### EditProspectDialog
Formulaire d'édition avec :
- Champs obligatoires et optionnels
- Validation des données
- Gestion des erreurs
- Mode création et modification

### ProspectDetails
Vue détaillée avec :
- Informations complètes du prospect
- Historique des interactions
- Actions rapides (modifier, convertir)
- Affichage des métadonnées

## 🔧 Utilisation

### Navigation
```typescript
// Route dans l'application
<Route path="/prospection" element={<ProspectsPage />} />

// Navigation programmatique
navigate('/prospection');
```

### Hook personnalisé
```typescript
const {
  prospects,
  loading,
  filters,
  fetchProspects,
  createProspect,
  updateProspect,
  deleteProspect
} = useProspects();
```

### Actions métier
```typescript
// Créer un prospect
const newProspect = await createProspect({
  companyName: 'TechStartup Inc',
  industry: 'SaaS',
  size: 'startup',
  // ... autres champs
});

// Filtrer les prospects
setFilters({ status: ['qualified'], priority: ['high'] });

// Actualiser les données
await refreshProspects();
```

## 📊 Données de démonstration

Le module inclut des données mock pour le développement :
- **TechStartup Inc** : Startup SaaS avec score 85
- **E-commerce Plus** : PME e-commerce avec score 92
- **Consulting Pro** : Cabinet conseil avec score 78

## 🔮 Évolutions futures

### Phase 6.1 - OSINT avancé
- Intégration d'APIs externes (LinkedIn, Crunchbase)
- Analyse automatique des sites web
- Veille concurrentielle automatisée

### Phase 6.2 - Marketing automation
- Campagnes email personnalisées
- Suivi des leads et scoring
- Intégration CRM externe

### Phase 6.3 - Analytics avancés
- Prédiction de conversion
- Analyse des parcours clients
- ROI des actions commerciales

## 🧪 Tests

### Tests unitaires
```bash
npm test -- --testPathPattern=prospects
```

### Tests d'intégration
```bash
npm run test:integration -- --testPathPattern=prospects
```

## 📚 Ressources

- [Documentation TypeScript](./types/prospect.ts)
- [Store Zustand](./stores/prospectsStore.ts)
- [Service API](./services/prospectService.ts)
- [Composants UI](./components/)

---

*Module développé dans le cadre de la Phase 6 de Facturio - Prospection & Marketing*
