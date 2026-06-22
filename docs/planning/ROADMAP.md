## Roadmap PrestaFacture

Vue d'ensemble des étapes à venir. On part simple, on itère vite.

**Positionnement** : facturation des **prestations de services numériques** (dev web, logiciel, automatisation, maintenance, IA) — voir [POSITIONNEMENT_PRESTATIONS_SERVICES.md](./POSITIONNEMENT_PRESTATIONS_SERVICES.md).  
**Monétisation** : modèle bootstrap (freemium + e-facture 2026) — [MONETISATION.md](./MONETISATION.md).

### v0.1 - API minimale (terminer le socle)
- [x] NestJS + structure de base
- [x] Prisma + SQLite + migration initiale
- [x] Clients CRUD (B2B/B2C de base)
- [x] Factures CRUD (lignes, totaux)
- [x] CORS activé

### v0.2 - Qualité d'API
- [x] DTOs `class-validator` (phase 1 : Products/Prospects/Packs)
- [x] Pagination + tri + recherche (phase 1 : Products/Prospects/Packs)
- [x] Normaliser les erreurs (exception filter global + messages d'erreur)
- [ ] Étendre DTOs + pagination/tri/recherche à tous les modules (Clients, Invoices, Quotes, etc.)

### v0.3 - Métier facture
- [x] Numérotation automatique des factures par année
- [x] Paiements et solde facture
- [x] TVA auto: FR défaut 20%, UE B2B autoliquidation 0%, export 0%, exonération client
- [x] Avoirs (modèle complet + écritures comptables automatiques)
- [ ] Mentions légales dynamiques dans les PDF

### v0.4 - Authentification
- [ ] Auth JWT (login simple)
- [ ] Séparation utilisateur/organisation (multi-tenant simple)
- [ ] Rôles basiques (admin, user)

### v0.5 - Génération PDF et envoi
- [x] Modèle PDF (logo, entête, pied de page, conditions)
- [x] Export PDF depuis une facture
- [x] Export PDF depuis un devis
- [x] Envoi par email réel (nodemailer) avec templates HTML
- [ ] Mentions légales dynamiques dans les PDF (compléter le modèle)

### v0.6 - UI Web
- [x] App web (Dashboard, Clients, Factures, Devis, Produits, Packs, Prospects, Taxes, Abonnements, Déclarations)
- [x] Aperçu facture (liste + détail) + téléchargement PDF depuis le backend
- [x] Thème clair/sombre avec personnalisation (couleurs, densité, arrondis)
- [x] Séparation routes publiques/privées + authentification de base (ProtectedRoute)
- [ ] Boutons d'export/téléchargement PDF directement depuis tous les écrans frontend

### v0.7 - Import/Export & intégrations
- [ ] Import CSV/Excel de clients
- [ ] Export CSV (factures, lignes)
- [ ] Intégration paiement (Stripe) optionnelle

### v0.8 - Comptabilité (backend)
- [x] Plan comptable minimal seedé (comptes clés + journaux VE/BQ/OD)
- [x] Écritures auto ventes (411/706/44571) et paiements (512/411)
- [x] Achats services (622/44566/401) et paiements fournisseurs (401/512)
- [x] Devis hors-bilan + contre-passation auto
- [x] Paie (641/645/421/431) et paiement URSSAF (431/512)
- [x] Contributions micro-social (645/431) et C3S (635/447)
- [x] Rapports: Balance, Grand livre
- [x] Export FEC (première version texte)
- [ ] Verrouillage de périodes et contre-passations

### v0.9 - Tests & qualité
- [x] Tests E2E sur endpoints critiques (backend)
- [ ] Étendre les tests d'intégration backend
- [ ] Mettre en place tests frontend (Vitest + Playwright)

### v1.0 - Comptabilité frontend
- [ ] Visualisation des écritures comptables dans l'interface
- [ ] Affichage du plan comptable complet
- [ ] Interfaces Balance / Grand livre / compte de résultat
- [ ] Export FEC depuis l'interface

### v1.1 - Abonnements & facturation récurrente
- [x] Interface de gestion des abonnements (liste, statut, annulation fin de période / immédiate)
- [x] Interface de gestion des plans (création/suppression, montant, période, essai)
- [x] MRR / ARR de base sur les abonnements existants
- [ ] Génération automatique des factures récurrentes
- [ ] Gestion des échecs de paiement et notifications

### v1.2 - Déclarations & taxes
- [ ] Interface déclarations TVA (CA3/CA12) et livre de TVA
- [ ] Intégration URSSAF (statuts entreprises, cotisations, échéances)
- [ ] Dashboard des échéances fiscales et alertes automatiques

### v1.2b - Vertical prestations services (métier)
- [ ] Modèles de devis / factures par type d'offre (site, API, maintenance, IA)
- [ ] Missions : lien devis → acomptes → solde
- [ ] Catalogue personnalisable par organisation (hors seed DanielCraft seul)
- [ ] Mentions légales et clauses types prestations intellectuelles
- Voir [POSITIONNEMENT_PRESTATIONS_SERVICES.md](./POSITIONNEMENT_PRESTATIONS_SERVICES.md)

### v1.3 - Facturation électronique B2B (réforme FR 2026–2027)
- [ ] Cadrage stratégique (PA partenaire vs immatriculation PA PrestaFacture)
- [ ] Formats structurés (Factur-X prioritaire, UBL/CII)
- [ ] Intégration API Plateforme Agréée partenaire (émission, statuts, annuaire)
- [ ] Réception factures fournisseurs (entrant)
- [ ] E-reporting (transactions, paiements)
- [ ] UI : paramètres PA, envoi électronique, suivi des statuts
- Voir le plan détaillé : [FACTURATION_ELECTRONIQUE_2026.md](./FACTURATION_ELECTRONIQUE_2026.md)

### v1.4 - Intégrations
- [ ] Intégrations paiements (Stripe/PayPal)
- [ ] Connecteurs compta (Sage, Cegid, etc.)
- [ ] Intégrations CRM / emailing (HubSpot, Salesforce, Mailchimp, SendGrid)

### v1.5 - Mobile & PWA
- [ ] PWA complète (offline, sync, notifications push)
- [ ] Optimisation responsive mobile (gestes, perfs)

### v1.6 - IA & recommandations
- [ ] Scoring de risque avancé (ML)
- [ ] Prévisions de trésorerie et ventes
- [ ] Suggestions de produits et optimisation des échéances

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

---

## 🔍 OSINT d'Entreprise & Intelligence (v1.6.0)

### Veille économique & concurrentielle
- [ ] **Scraping des données publiques** : INSEE, registres du commerce, OpenCorporates
- [ ] **Analyse des patterns de paiement** : détection de difficultés financières
- [ ] **Surveillance des changements** : modification d'adresse, statut légal, TVA
- [ ] **Analyse sectorielle** : performance par domaine d'activité
- [ ] **Veille concurrentielle** : nouveaux acteurs, évolution des prix

### Intelligence des risques
- [ ] **Scoring de risque client** : probabilité de défaut de paiement
- [ ] **Détection de fraude** : patterns suspects dans les factures
- [ ] **Surveillance réglementaire** : changements de TVA, nouvelles obligations
- [ ] **Analyse de solvabilité** : croisement avec données publiques
- [ ] **Alertes automatiques** : notifications sur changements significatifs

### Enrichissement des données
- [ ] **Profils d'entreprises enrichis** : CA, effectifs, secteur, statut légal
- [ ] **Corrélation données internes/externes** : historique + données publiques
- [ ] **Base de connaissances** : informations consolidées sur le marché
- [ ] **API d'intelligence** : endpoints pour enrichir les profils clients

---

## 🤖 Machine Learning & IA Avancée (v1.7.0)

### Modèles prédictifs
- [ ] **Prédiction de trésorerie** : quand les clients vont payer (TensorFlow.js)
- [ ] **Scoring de risque avancé** : modèles ML sur historique + données externes
- [ ] **Détection d'anomalies** : factures suspectes, patterns étranges
- [ ] **Prédiction de churn** : probabilité de résiliation d'abonnement
- [ ] **Forecasting des ventes** : tendances et saisonnalité

### Natural Language Processing
- [ ] **Analyse des descriptions** : catégorisation automatique des factures
- [ ] **Sentiment analysis** : analyse des emails et interactions clients
- [ ] **Extraction d'entités** : dates, montants, références automatiques
- [ ] **Génération automatique** : descriptions de factures, emails de relance
- [ ] **Classification des demandes** : routage automatique des tickets

### Optimisation & Recommandations
- [ ] **Pricing dynamique** : ajustement des prix basé sur l'historique
- [ ] **Suggestions de produits** : recommandations personnalisées
- [ ] **Optimisation des échéances** : meilleurs délais de paiement
- [ ] **Segmentation client** : clustering automatique des profils
- [ ] **Prédiction de besoins** : anticipation des demandes clients

---

## 📊 Sources de Données & Intégrations OSINT (v1.8.0)

### Données internes PrestaFacture
- [ ] **Historique financier** : factures, paiements, échéances, statuts
- [ ] **Données d'interaction** : emails, vues de devis, utilisation plateforme
- [ ] **Comportement client** : patterns d'achat, préférences, satisfaction
- [ ] **Données transactionnelles** : produits/services, quantités, prix, remises
- [ ] **Support & réclamations** : tickets, types de problèmes, résolution

### Sources de données publiques (OSINT)
- [ ] **INSEE** : chiffre d'affaires, effectifs, secteur d'activité, évolution
- [ ] **Registre du commerce** : statut légal, dirigeants, capital social, modifications
- [ ] **Infogreffe** : bilans, comptes de résultat, ratios financiers, santé économique
- [ ] **SIRENE** : informations générales, adresses, activités, codes NAF
- [ ] **BDF (Banque de France)** : incidents de paiement, scoring de crédit
- [ ] **BODACC** : avis de procédures collectives, liquidations, difficultés
- [ ] **Journal officiel** : nominations, changements de statut, événements légaux

### APIs & Services tiers
- [ ] **OpenCorporates** : données d'entreprises internationales, liens entre sociétés
- [ ] **Company House** : données UK, informations financières détaillées
- [ ] **Dun & Bradstreet** : scoring de crédit, informations financières, risques
- [ ] **Bureau van Dijk** : bases de données d'entreprises, analyses sectorielles
- [ ] **APIs bancaires** : scoring de crédit, analyse de solvabilité (avec autorisation)

### Données sectorielles & marché
- [ ] **Chambres de commerce** : études sectorielles, tendances, difficultés
- [ ] **Fédérations professionnelles** : statistiques du secteur, évolutions
- [ ] **Presse spécialisée** : actualités, innovations, difficultés, opportunités
- [ ] **Rapports d'analystes** : études de marché, prévisions, analyses
- [ ] **Google Trends** : évolution de la notoriété, tendances de recherche

### Surveillance & veille
- [ ] **Sites web clients** : changements de contenu, nouvelles offres, difficultés
- [ ] **Scraping des équipes** : photos, noms, postes des collaborateurs et dirigeants
- [ ] **Analyse des organigrammes** : structure organisationnelle, hiérarchie
- [ ] **Surveillance des changements** : nouveaux employés, départs, promotions
- [ ] **Réseaux sociaux** : LinkedIn, changements d'emploi, croissance entreprise
- [ ] **Presse locale** : actualités, événements, difficultés, succès
- [ ] **Forums spécialisés** : réputation, retours d'expérience, signaux faibles
- [ ] **Sites d'emploi** : offres d'emploi, évolution des effectifs, recrutements

### Infrastructure de collecte
- [ ] **Scraping automatisé** : Puppeteer/Playwright pour sites dynamiques
- [ ] **Parsing HTML** : Cheerio pour sites statiques, extraction structurée
- [ ] **Jobs programmés** : surveillance continue avec Node-cron, alertes automatiques
- [ ] **APIs officielles** : requêtes HTTP structurées, rate limiting, cache intelligent
- [ ] **Webhooks & notifications** : alertes temps réel, intégrations tierces

### Scraping avancé des sites web
- [ ] **Extraction des équipes** : photos, noms, postes, emails des collaborateurs
- [ ] **Analyse des organigrammes** : structure hiérarchique, départements
- [ ] **Surveillance des changements** : nouveaux employés, départs, promotions
- [ ] **Détection de difficultés** : fermetures, réductions d'effectifs, changements d'adresse
- [ ] **Analyse du contenu** : nouvelles offres, changements de services, actualités
- [ ] **Gestion des cookies/sessions** : authentification pour sites protégés
- [ ] **Rotation des User-Agents** : évitement de la détection anti-bot
- [ ] **Proxy rotation** : IPs multiples pour éviter le blocage

---

## 🛠️ Technologies OSINT & ML

### Web Scraping & APIs
- **Puppeteer/Playwright** : sites dynamiques, JavaScript rendering
- **Cheerio** : parsing HTML statique, extraction structurée
- **Axios/Node-fetch** : APIs publiques, rate limiting
- **Node-cron** : jobs programmés, surveillance continue
- **Puppeteer-extra** : plugins anti-détection, stealth mode
- **Proxy-chain** : rotation automatique des proxies
- **User-agents** : rotation des User-Agents pour éviter la détection
- **Cookie management** : gestion des sessions et authentification

*Voir le fichier `OSINT_TOOLS.md` pour la liste complète des outils OSINT*

### Machine Learning
- **TensorFlow.js** : modèles prédictifs côté serveur
- **Natural** : traitement du langage naturel
- **Clustering algorithms** : segmentation automatique des clients
- **Feature engineering** : préparation des données pour les modèles

### Infrastructure
- **Bull/Agenda** : queues pour tâches lourdes
- **Lodash/Ramda** : manipulation des données
- **Cache intelligent** : évitement des requêtes redondantes
- **Monitoring** : performance, alertes, métriques

---

## 📈 Métriques de succès Intelligence

- [ ] **Précision des prédictions** : > 85% pour le scoring de risque
- [ ] **Détection d'anomalies** : < 5% de faux positifs
- [ ] **Enrichissement des données** : > 90% des profils clients enrichis
- [ ] **Réduction des impayés** : > 40% grâce aux alertes précoces
- [ ] **ROI de l'intelligence** : > 300% sur les investissements ML

## 🎯 Cas d'usage Scraping des Équipes

### Analyse des risques
- [ ] **Détection de départs clés** : patrons, comptables, responsables financiers
- [ ] **Surveillance des effectifs** : réduction d'équipe = signe de difficultés
- [ ] **Changements d'adresse** : déménagement = possible restructuration
- [ ] **Fermeture de sites** : fermeture de bureaux = problèmes financiers

### Intelligence commerciale
- [ ] **Nouveaux contacts** : nouveaux décideurs, nouvelles opportunités
- [ ] **Évolution des services** : nouvelles offres, changements de stratégie
- [ ] **Expansion/réduction** : ouverture/fermeture de bureaux, filiales
- [ ] **Partnerships** : nouveaux partenaires, alliances stratégiques

### Conformité & surveillance
- [ ] **Changements légaux** : nouveaux dirigeants, modifications statutaires
- [ ] **Surveillance sectorielle** : évolution du marché, nouveaux concurrents
- [ ] **Alertes précoces** : signaux faibles de difficultés financières
- [ ] **Veille concurrentielle** : stratégies des concurrents, innovations


