# Intégration URSSAF - Statuts d'entreprises

## État actuel

### Ce qui existe déjà

1. **Modèle de déclarations (Filings)**
   - Support `URSSAF_MONTHLY` et `URSSAF_QUARTERLY`
   - Gestion des périodes et échéances
   - Calcul et suivi des paiements

2. **Service comptable (AccountingService)**
   - `postUrssafPayment()` : Paiement URSSAF (431/512)
   - `postMicroSocialContribution()` : Cotisation micro-social (auto-entrepreneur)
   - `postC3SContribution()` : Contribution C3S (si seuil dépassé)

3. **Modèle Client**
   - `isCompany` : Distinction B2B/B2C
   - Pas de champ pour le statut d'entreprise (auto-entrepreneur, micro-entreprise, etc.)

## Problématique

Les différents statuts d'entreprises ont des règles URSSAF différentes :

### Auto-entrepreneur (Micro-entreprise)
- **Cotisation** : Pourcentage du CA (taux selon activité)
  - Vente de marchandises : 12,8% (ou 1% si option micro-fiscal)
  - Prestations de services BIC : 22% (ou 1,7% si option micro-fiscal)
  - Prestations de services BNC : 22% (ou 2,2% si option micro-fiscal)
- **Déclaration** : Mensuelle ou trimestrielle (selon choix)
- **Seuils** : Plafonds de CA annuel (176 200€ services, 72 600€ vente)

### Micro-entreprise (ancien régime)
- Similaire à auto-entrepreneur mais avec comptabilité simplifiée

### Entreprise classique
- Cotisations sociales sur salaires
- Déclarations DSN (Déclaration Sociale Nominative)
- Pas de cotisation sur CA

## Proposition d'intégration

### 1. Extension du modèle Client

Ajouter dans `schema.prisma` :

```prisma
enum CompanyStatus {
  AUTO_ENTREPRENEUR
  MICRO_ENTERPRISE
  CLASSIC
  ASSOCIATION
  OTHER
}

model Client {
  // ... champs existants
  companyStatus CompanyStatus? // Statut de l'entreprise
  urssafRate    Decimal?       // Taux URSSAF personnalisé (%)
  urssafActivity String?        // Activité (VENTE, SERVICE_BIC, SERVICE_BNC)
  urssafFiscalOption Boolean @default(false) // Option micro-fiscal
  urssafDeclarationFrequency String? // MONTHLY ou QUARTERLY
  urssafThreshold Decimal? // Seuil de CA annuel
}
```

### 2. Service URSSAF dédié

Créer `server/src/urssaf/urssaf.service.ts` :

```typescript
@Injectable()
export class UrssafService {
  // Taux par défaut selon activité (auto-entrepreneur)
  private readonly DEFAULT_RATES = {
    VENTE: 0.128, // 12,8%
    SERVICE_BIC: 0.22, // 22%
    SERVICE_BNC: 0.22, // 22%
  };

  // Taux micro-fiscal
  private readonly FISCAL_RATES = {
    VENTE: 0.01, // 1%
    SERVICE_BIC: 0.017, // 1,7%
    SERVICE_BNC: 0.022, // 2,2%
  };

  // Calculer cotisation URSSAF pour une période
  async calculateContribution(params: {
    clientId: number;
    periodStart: Date;
    periodEnd: Date;
  }) {
    const client = await this.prisma.client.findUnique({
      where: { id: params.clientId }
    });

    if (!client || client.companyStatus !== 'AUTO_ENTREPRENEUR') {
      throw new BadRequestException('Client non éligible');
    }

    // Récupérer CA de la période
    const invoices = await this.prisma.invoice.findMany({
      where: {
        clientId: params.clientId,
        date: { gte: params.periodStart, lte: params.periodEnd },
        status: { in: ['PAID', 'SENT'] }
      }
    });

    const ca = invoices.reduce((sum, inv) => 
      sum + Number(inv.total), 0
    );

    // Déterminer le taux
    const activity = client.urssafActivity || 'SERVICE_BIC';
    const rate = client.urssafFiscalOption
      ? this.FISCAL_RATES[activity]
      : (client.urssafRate || this.DEFAULT_RATES[activity]);

    const contribution = ca * rate;

    return {
      ca,
      rate,
      contribution,
      activity,
      invoicesCount: invoices.length
    };
  }

  // Créer déclaration URSSAF automatique
  async createUrssafFiling(params: {
    clientId: number;
    period: string; // "2024-M01" ou "2024-Q1"
  }) {
    const calculation = await this.calculateContribution(...);
    
    const filing = await this.prisma.filing.create({
      data: {
        type: client.urssafDeclarationFrequency === 'MONTHLY' 
          ? 'URSSAF_MONTHLY' 
          : 'URSSAF_QUARTERLY',
        authority: 'URSSAF',
        periodStart: ...,
        periodEnd: ...,
        dueDate: ...,
        amountDue: calculation.contribution,
        lines: [{
          taxRate: calculation.rate,
          taxableBase: calculation.ca,
          taxAmount: calculation.contribution
        }]
      }
    });

    // Créer écriture comptable
    await this.accounting.postMicroSocialContribution({
      periodStart: ...,
      periodEnd: ...,
      rate: calculation.rate,
      reference: filing.number
    });

    return filing;
  }
}
```

### 3. Endpoints API

```typescript
@Controller('urssaf')
export class UrssafController {
  @Post('calculate')
  calculate(@Body() body: { clientId: number; period: string }) {
    return this.urssaf.calculateContribution(...);
  }

  @Post('filing')
  createFiling(@Body() body: { clientId: number; period: string }) {
    return this.urssaf.createUrssafFiling(...);
  }

  @Get('clients/:id/contributions')
  getContributions(@Param('id') id: number) {
    return this.urssaf.getClientContributions(id);
  }
}
```

### 4. Intégration avec le système existant

- **FilingsService** : Étendre pour supporter calcul URSSAF automatique
- **AccountingService** : Utiliser `postMicroSocialContribution()` existant
- **Dashboard** : Afficher prochaines échéances URSSAF

## Tâches à implémenter

### Phase 1 : Modèle de données
- [ ] Ajouter enum `CompanyStatus` dans Prisma
- [ ] Ajouter champs URSSAF dans modèle `Client`
- [ ] Migration Prisma
- [ ] Mettre à jour DTOs Client

### Phase 2 : Service URSSAF
- [ ] Créer `UrssafService` avec calculs
- [ ] Implémenter calcul cotisation selon statut
- [ ] Gérer différents taux (défaut, micro-fiscal)
- [ ] Vérifier seuils de CA

### Phase 3 : Déclarations automatiques
- [ ] Créer déclarations URSSAF depuis service
- [ ] Générer écritures comptables automatiques
- [ ] Gérer fréquences (mensuelle/trimestrielle)
- [ ] Alertes échéances

### Phase 4 : Interface utilisateur
- [ ] Formulaire configuration statut entreprise
- [ ] Calcul prévisionnel cotisations
- [ ] Liste déclarations URSSAF
- [ ] Dashboard échéances

### Phase 5 : Tests
- [ ] Tests unitaires calculs
- [ ] Tests E2E déclarations
- [ ] Tests seuils et limites

## Exemples de calculs

### Auto-entrepreneur - Prestations services BIC
- CA mensuel : 5 000€
- Taux standard : 22%
- Cotisation : 5 000 × 0,22 = 1 100€

### Auto-entrepreneur - Option micro-fiscal
- CA mensuel : 5 000€
- Taux micro-fiscal : 1,7%
- Cotisation : 5 000 × 0,017 = 85€

### Vérification seuil
- Seuil annuel : 72 600€ (vente) ou 176 200€ (services)
- Si CA annuel > seuil → passage en entreprise classique

## Ressources

- [URSSAF - Auto-entrepreneur](https://www.autoentrepreneur.urssaf.fr/)
- [Taux de cotisations 2024](https://www.autoentrepreneur.urssaf.fr/portail/accueil/je-cree-mon-entreprise/les-taux-de-cotisations.html)
- [Seuils 2024](https://www.autoentrepreneur.urssaf.fr/portail/accueil/je-cree-mon-entreprise/les-seuils.html)

