# Notes de développement - Priorités hautes

Notes et décisions techniques pour les fonctionnalités prioritaires.

## Exception Filter Global

### Implémentation
- **Fichier** : `server/src/common/filters/http-exception.filter.ts`
- **Intégration** : `server/src/main.ts` avec `app.useGlobalFilters()`

### Fonctionnalités
- Normalise toutes les erreurs HTTP en format JSON standardisé
- Gère les erreurs de validation avec messages multiples
- Logging automatique selon le niveau de sévérité
- Timestamp et path inclus dans toutes les réponses d'erreur

### Format de réponse
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": ["Field 1 is required", "Field 2 must be an email"],
  "timestamp": "2024-12-20T10:30:00.000Z",
  "path": "/api/clients"
}
```

### Tests
- Tests unitaires dans `http-exception.filter.spec.ts`
- Couvre : HttpException, erreurs de validation, erreurs non gérées, NotFoundException

## Service PDF

### Améliorations apportées
- Modèle professionnel avec en-tête, pied de page, mentions légales
- Tableau formaté pour les lignes de facture/devis
- Support des variables d'environnement pour personnalisation :
  - `COMPANY_NAME` : Nom de l'entreprise
  - `COMPANY_ADDRESS` : Adresse
  - `COMPANY_SIRET` : Numéro SIRET
  - `COMPANY_VAT` : Numéro TVA
  - `LEGAL_MENTIONS` : Mentions légales personnalisées

### Structure PDF
1. En-tête avec titre et date
2. Informations entreprise
3. Informations client
4. Tableau des lignes (avec alternance de couleurs)
5. Totaux (Sous-total HT, TVA, Total TTC)
6. Mentions légales
7. Pied de page avec numéro de page

### Bug corrigé
- Le contrôleur `invoices.controller.ts` n'attendait pas la Promise de `generateInvoicePdf`
- Correction : ajout de `await` dans l'endpoint `/invoices/:id/pdf`

## Service Email

### Améliorations apportées
- Templates HTML professionnels pour factures, devis, relances
- Méthodes spécialisées :
  - `sendInvoice()` : Envoi facture avec PDF
  - `sendQuote()` : Envoi devis avec PDF
  - `sendReminder()` : Envoi relance
- Configuration SMTP flexible via variables d'environnement :
  - `SMTP_HOST` : Serveur SMTP
  - `SMTP_PORT` : Port SMTP
  - `SMTP_SECURE` : Connexion sécurisée (true/false)
  - `SMTP_USER` : Utilisateur SMTP
  - `SMTP_PASS` : Mot de passe SMTP
  - `MAIL_FROM` : Email expéditeur
  - `MAIL_FROM_NAME` : Nom expéditeur

### Templates HTML
- Design responsive et professionnel
- Styles inline pour compatibilité email
- Support des pièces jointes PDF
- Messages personnalisés selon le type d'email

### Intégration
- Mise à jour de `quotes.controller.ts` pour utiliser `sendQuote()`
- Prêt pour intégration dans `invoices.controller.ts` pour envoi de factures

## Prochaines étapes

### DTOs avec class-validator
- Vérifier que tous les endpoints utilisent des DTOs
- Ajouter validation manquante sur les DTOs existants
- Créer DTOs pour les endpoints sans validation

### Pagination
- Déjà implémentée via `ListQueryDto` dans certains modules
- Vérifier que tous les modules l'utilisent
- Ajouter pagination manquante si nécessaire

### Tri et recherche
- Déjà implémentés via `ListQueryDto`
- Vérifier que tous les modules les utilisent
- Améliorer la recherche si nécessaire (recherche full-text, etc.)

### Tests
- Tests unitaires pour exception filter : ✅ Fait
- Tests E2E pour endpoints PDF : À faire
- Tests E2E pour envoi emails : À faire
- Tests de validation DTOs : À faire

## Variables d'environnement à ajouter

```env
# PDF
COMPANY_NAME=Votre Entreprise
COMPANY_ADDRESS=123 Rue Example, 75000 Paris
COMPANY_SIRET=12345678901234
COMPANY_VAT=FR12345678901
LEGAL_MENTIONS=Mentions légales personnalisées

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=user@example.com
SMTP_PASS=password
MAIL_FROM=noreply@example.com
MAIL_FROM_NAME=Facturio
```

## Notes techniques

### Exception Filter
- Utilise `@Catch()` sans paramètre pour intercepter toutes les exceptions
- Logging différencié selon le code HTTP (error pour 5xx, warn pour 4xx)
- Format de réponse cohérent pour faciliter le debugging côté frontend

### PDF Service
- Utilise PDFKit (déjà dans les dépendances)
- Format A4 standard
- Marges de 50px pour lisibilité
- Gestion d'erreurs avec try/catch et logging

### Email Service
- Support mode test avec jsonTransport
- Templates HTML avec styles inline (compatibilité email)
- Gestion d'erreurs avec logging
- Formatage des montants en EUR avec Intl.NumberFormat

