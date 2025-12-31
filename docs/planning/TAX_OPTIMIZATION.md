# Optimisation Fiscale Légale

## Objectif

Développer un module d'optimisation fiscale légale pour aider les entreprises à :
- Minimiser leur charge fiscale dans le respect de la législation
- Choisir le régime fiscal optimal
- Identifier les déductions et crédits d'impôt disponibles
- Simuler différents scénarios fiscaux
- Optimiser la rémunération (salaire vs dividendes)

## Principes

⚠️ **IMPORTANT** : Toutes les optimisations proposées doivent être **100% légales** et conformes à la législation française. Le système ne doit jamais suggérer d'évasion fiscale.

## Fonctionnalités à développer

### 1. Calcul de l'Impôt sur les Sociétés (IS)

#### Taux d'IS selon le CA
- **CA < 38 120€** : Exonération (sous conditions)
- **38 120€ ≤ CA < 75 000€** : 15% sur la tranche
- **75 000€ ≤ CA < 500 000€** : 15% jusqu'à 38 120€, puis 28% jusqu'à 75 000€, puis 28% sur le reste
- **CA ≥ 500 000€** : 15% jusqu'à 38 120€, puis 28% jusqu'à 75 000€, puis 31% sur le reste

#### Réduction d'IS pour PME
- Réduction de 25% si CA < 10M€ et capital détenu à 75% minimum par des personnes physiques
- Plafond : 38 120€ de bénéfice

#### Calcul du résultat fiscal
```
Résultat fiscal = Résultat comptable
  + Réintégrations fiscales
  - Déductions fiscales
  - Amortissements déductibles
  - Provisions déductibles
```

### 2. Calcul de la CFE (Cotisation Foncière des Entreprises)

#### Base de calcul
- Valeur locative des biens immobiliers
- Ou forfait selon l'activité et le CA

#### Taux
- Variable selon la commune (minimal : 0,5% de la base)
- Exonération possible pour les premières années d'activité

### 3. Gestion des déductions fiscales

#### Charges déductibles
- Frais professionnels (déplacement, repas, hébergement)
- Charges sociales
- Intérêts d'emprunt
- Loyers
- Assurances professionnelles
- Abonnements et services
- Matériel et équipements (amortissements)

#### Crédits d'impôt
- **CIR** (Crédit d'Impôt Recherche) : 30% des dépenses de R&D
- **CII** (Crédit d'Impôt Innovation) : 20% des dépenses d'innovation
- **CICE** (remplacé par réduction de charges)
- **Formation** : 60% des dépenses de formation

### 4. Amortissements

#### Linéaire
- Durée d'utilisation normale
- Taux = 100% / durée

#### Dégressif
- Pour matériel neuf
- Taux = taux linéaire × coefficient (1,25 ou 1,75 selon durée)
- Limité à 3 ans minimum

#### Exceptionnel
- Amortissement accéléré pour certains équipements (écologiques, etc.)

### 5. Optimisation du régime fiscal

#### Comparaison des régimes
- **Micro-entreprise** : Pas d'IS, cotisations sur CA
- **Réel simplifié** : IS avec déclaration simplifiée
- **Réel normal** : IS avec comptabilité complète

#### Simulation
- Comparer les charges fiscales selon le régime
- Prendre en compte le CA, les charges, les investissements

### 6. Optimisation de la rémunération

#### Salaire vs Dividendes
- Calculer le coût total (charges sociales + impôts)
- Optimiser selon le niveau de rémunération
- Prendre en compte l'IS sur les dividendes (flat tax 30% ou barème progressif)

### 7. Simulation fiscale

#### Scénarios
- Simulation "as-is" (situation actuelle)
- Simulation avec optimisations suggérées
- Comparaison année N vs année N-1

#### Indicateurs
- Charge fiscale totale
- Taux effectif d'imposition
- Économies potentielles
- ROI des investissements déductibles

## Modèles de données

### TaxOptimization
```prisma
model TaxOptimization {
  id              Int       @id @default(autoincrement())
  organizationId  Int
  organization    Organization @relation(fields: [organizationId], references: [id])
  year            Int
  scenario        String    // "current", "optimized", "custom"
  
  // Résultats
  revenue         Decimal
  expenses        Decimal
  taxableIncome   Decimal
  corporateTax    Decimal
  cfe             Decimal
  totalTax        Decimal
  effectiveRate   Decimal
  
  // Optimisations appliquées
  deductions      Json?     // Liste des déductions
  credits         Json?     // Liste des crédits d'impôt
  amortizations   Json?     // Amortissements
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

### TaxDeduction
```prisma
model TaxDeduction {
  id              Int       @id @default(autoincrement())
  organizationId  Int
  organization    Organization @relation(fields: [organizationId], references: [id])
  
  category        String    // "expense", "amortization", "provision", "credit"
  name            String
  amount          Decimal
  year            Int
  deductibleRate  Decimal  @default(1.0) // 100% par défaut
  
  // Justificatifs
  invoiceId       Int?
  invoice         Invoice?  @relation(fields: [invoiceId], references: [id])
  documentId      Int?
  document        OrganizationDocument? @relation(fields: [documentId], references: [id])
  
  status          String    @default("PENDING") // PENDING, VALIDATED, REJECTED
  notes           String?
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

## API Endpoints

### Calculs fiscaux
- `POST /api/taxes/calculate-is` - Calculer l'IS
- `POST /api/taxes/calculate-cfe` - Calculer la CFE
- `POST /api/taxes/calculate-total` - Calculer la charge fiscale totale

### Optimisations
- `POST /api/taxes/optimize` - Générer des suggestions d'optimisation
- `GET /api/taxes/optimizations/:year` - Récupérer les optimisations d'une année
- `POST /api/taxes/simulate` - Simuler un scénario fiscal

### Déductions
- `GET /api/taxes/deductions` - Liste des déductions
- `POST /api/taxes/deductions` - Ajouter une déduction
- `PATCH /api/taxes/deductions/:id` - Mettre à jour une déduction
- `DELETE /api/taxes/deductions/:id` - Supprimer une déduction

### Crédits d'impôt
- `GET /api/taxes/credits` - Liste des crédits d'impôt disponibles
- `POST /api/taxes/credits/calculate` - Calculer les crédits d'impôt éligibles

### Amortissements
- `GET /api/taxes/amortizations` - Liste des amortissements
- `POST /api/taxes/amortizations` - Créer un amortissement
- `POST /api/taxes/amortizations/calculate` - Calculer les amortissements d'un bien

## Implémentation

### Phase 1 : Calculs de base
1. Service de calcul IS
2. Service de calcul CFE
3. DTOs et validation

### Phase 2 : Déductions
1. Modèle TaxDeduction
2. CRUD déductions
3. Validation et catégorisation

### Phase 3 : Amortissements
1. Calcul amortissements linéaires
2. Calcul amortissements dégressifs
3. Gestion des biens amortissables

### Phase 4 : Optimisation
1. Service d'optimisation
2. Suggestions automatiques
3. Simulation de scénarios

### Phase 5 : Crédits d'impôt
1. Détection des crédits d'impôt éligibles
2. Calcul des montants
3. Suivi et reporting

## Ressources légales

- Code de commerce
- Code général des impôts
- Bulletins officiels des impôts (BOI)
- Site impots.gouv.fr
- Documentation URSSAF

## Notes importantes

⚠️ **Avertissement légal** : Ce système est un outil d'aide à la décision. Il ne remplace pas les conseils d'un expert-comptable ou d'un avocat fiscaliste. Les calculs sont indicatifs et doivent être validés par un professionnel.

