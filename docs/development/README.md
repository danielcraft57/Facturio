# Guides de développement

Documentation pour les développeurs contribuant à PrestaFacture.

## 📚 Contenu

- [Architecture](./ARCHITECTURE.md) - Vue d'ensemble de l'architecture
- [Guide de développement](./DEVELOPMENT.md) - Workflow et bonnes pratiques
- [CI/CD](./CI_CD.md) - Intégration continue et déploiement
- [E-invoicing](./E_INVOICING.md) - Module conformité réforme 2026
- [Abonnements Stripe](./BILLING_STRIPE.md) - Checkout Pro, webhooks, portail client
- [Beta testeurs](./BETA_TESTEURS.md) - Codes d'invitation, CLI, parcours testeur
- [Optimisation](./OPTIMIZATION.md) - Optimisation des performances

## 🛠️ Stack technique

- **Backend** : NestJS + TypeScript + Prisma
- **Frontend** : React + TypeScript + Material UI
- **Base de données** : SQLite (dev) / Postgres (prod)

## 📝 Workflow

1. Créer une branche depuis `main`
2. Développer la fonctionnalité
3. Écrire les tests
4. Créer une PR

Pour plus de détails, voir [Guide de développement](./DEVELOPMENT.md).

