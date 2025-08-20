# Roadmap - Facturio Server

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
- [x] Balance basée sur le subtotal pour les paiements
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
- [x] Plan comptable minimal seedé (comptes 512/411/706/44571/44566/606/615/622/641/645/421/431/635/447; journaux VE/BQ/OD)
- [x] Écritures auto ventes (411/706/44571) et paiements (512/411)
- [x] Achats services (622/44566/401) et paiements fournisseurs (401/512)
- [x] Devis hors-bilan + contre-passation auto
- [x] Paie (641/645/421/431) et paiement URSSAF (431/512)
- [x] Contributions micro-social (645/431) et C3S (635/447)
- [x] Rapports: Balance, Grand livre
- [x] Export FEC (première version texte)
- [ ] Verrouillage de périodes et contre-passations

### v0.8 - Suivi d'envoi devis/factures
- [x] Envoi email de devis (mock) et lien public
- [x] Webhooks provider (delivered/open)
- [x] Journalisation des vues (IP, UA)
- [x] Statuts publics unifiés (lowercase dans réponses publiques)
- [ ] Statuts: DRAFT/SENT/VIEWED/ACCEPTED/DECLINED/OVERDUE

### v0.9 - Technique & Ops
- [x] Tests e2e sur endpoints critiques (clients, factures, devis, taxes, filings)
- [ ] CI simple (lint, build)
- [ ] Observabilité de base (logs corrélés)

### Idées à explorer
- [x] Devis -> conversion en facture
- [ ] Multi-devises
- [ ] Webhooks
- [ ] OSS (TVA B2C UE par pays) et logique pays du client
- [ ] Comptabilité: export FEC simplifié

## Fait récemment
- Ajustement des routes Filings: `POST /filings/:id/calculate`
- Normalisation des statuts en minuscules dans les réponses publiques Filings
- Validation stricte création devis/factures (lignes requises, prix/quantités valides)
- Seeds complets (clients, produits, plans, abonnements, factures, paiements, devis, événements, vues, déclarations)
