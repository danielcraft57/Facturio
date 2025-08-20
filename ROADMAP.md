## Roadmap Facturio

Vue d'ensemble des étapes à venir. On part simple, on itère vite.

### v0.1 - API minimale (terminer le socle)
- [x] NestJS + structure de base
- [x] Prisma + SQLite + migration initiale
- [x] Clients CRUD (B2B/B2C de base)
- [x] Factures CRUD (lignes, totaux)
- [x] CORS activé

### v0.2 - Qualité d'API
- [ ] DTOs `class-validator`
- [ ] Pagination + tri + recherche (clients, factures, produits)
- [ ] Normaliser les erreurs (exception filter)

### v0.3 - Métier facture
- [x] Numérotation automatique des factures par année
- [x] Paiements et solde facture
- [x] TVA auto: FR défaut 20%, UE B2B autoliquidation 0%, export 0%, exonération client
- [ ] Mentions légales dynamiques et export PDF
- [ ] Avoirs

### v0.4 - Authentification
- [ ] Auth JWT (login simple)
- [ ] Séparation utilisateur/organisation (multi-tenant simple)
- [ ] Rôles basiques (admin, user)

### v0.5 - Génération PDF et envoi
- [ ] Modèle PDF (logo, entête, pied de page, conditions)
- [ ] Export PDF depuis une facture
- [ ] Envoi par email (nodemailer)

### v0.6 - UI Web
- [ ] App web (liste clients/factures/produits/abos)
- [ ] Aperçu facture + téléchargement PDF
- [ ] Thème clair/sombre

### v0.7 - Import/Export & intégrations
- [ ] Import CSV/Excel de clients
- [ ] Export CSV (factures, lignes)
- [ ] Intégration paiement (Stripe) optionnelle

### v0.8 - Comptabilité
- [x] Plan comptable minimal seedé (comptes clés + journaux VE/BQ/OD)
- [x] Écritures auto ventes (411/706/44571) et paiements (512/411)
- [ ] Export FEC (format officiel)
- [ ] Rapports: Balance, Grand livre
- [ ] Verrouillage de périodes et contre-passations

### Technique & Ops
- [x] Script de seed Prisma (TVA FR)
- [ ] Tests e2e sur endpoints critiques
- [ ] CI simple (lint, build)

### Idées à explorer
- [x] Devis -> conversion en facture
- [ ] Multi-devises
- [ ] Webhooks
- [ ] OSS (TVA B2C UE par pays) et logique pays du client
- [ ] Comptabilité: export FEC simplifié


