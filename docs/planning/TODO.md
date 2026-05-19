# TODO - Liste complète des tâches restantes

Liste exhaustive de tout ce qu'il reste à faire dans le projet Facturio, organisée par priorité et domaine.

**Positionnement produit** : prestations de services numériques (dev web, logiciel, automatisation, maintenance, IA) — [POSITIONNEMENT_PRESTATIONS_SERVICES.md](./POSITIONNEMENT_PRESTATIONS_SERVICES.md).

## 💰 Monétisation (bootstrap)

> Plan : [MONETISATION.md](./MONETISATION.md)

- [ ] Dogfooding : 100 % facturation DanielCraft via Facturio
- [ ] Paliers Stripe Billing : Free / Pro (9–15 €) / Pro+e-facture (19–29 €) / Agence (49–79 €)
- [ ] Page tarifs + CTA depuis danielcraft.fr
- [ ] Limites techniques plan Free (quota factures/mois)
- [ ] Packs catalogue premium (import seed métier)
- [ ] Accord commission ou bundle avec PA partenaire
- [ ] Contenu SEO : réforme 2026 + facturation prestation dev
- [ ] Branding optionnel PDF / page publique (« Propulsé par Facturio »)

---

## 🟣 Vertical prestations services (métier)

> Plan : [POSITIONNEMENT_PRESTATIONS_SERVICES.md](./POSITIONNEMENT_PRESTATIONS_SERVICES.md) · Coupler avec la conformité e-facture (SIREN, libellés lignes, missions).

### Catalogue & devis
- [ ] Modèles de devis par offre (site vitrine, intégration API, maintenance, pack IA)
- [ ] Descriptions de lignes structurées (périmètre, livrables, hors périmètre)
- [ ] Catalogue personnalisable par organisation (clone du modèle DanielCraft)
- [ ] Packs / options en lignes liées

### Facturation services
- [ ] Parcours acompte + solde lié au devis / mission
- [ ] Unités métier : heure, forfait, mois (affichage + export)
- [ ] Référence devis / mission sur chaque facture
- [ ] Mentions légales prestations + modèles clauses PI

### Clients & missions
- [ ] Fiche client : SIREN, TVA intracom, contacts facturation vs technique
- [ ] Vue mission : devis → factures → paiements par projet
- [ ] Notes internes projet (hors document fiscal)

### Conformité couplée (ne pas découpler du métier)
- [ ] Champs catalogue → mapping Factur-X (libellé, unité, TVA)
- [ ] Blocage envoi e-facture si client B2B sans SIREN
- [ ] E-reporting paiements pour maintenance récurrente et Stripe

---

## 🔴 Facturation électronique (réforme 2026–2027)

> Plan détaillé : [FACTURATION_ELECTRONIQUE_2026.md](./FACTURATION_ELECTRONIQUE_2026.md)  
> Jalon critique : **réception** pour toutes les entreprises au **1er sept. 2026** ; **émission** ETI/GE même date, PME au **1er sept. 2027**.

### Phase 0 — Cadrage (Q2 2026)
- [ ] Décision stratégique : PA partenaire (solution compatible) vs immatriculation PA Facturio
- [ ] Sélection et contrat avec une Plateforme Agréée partenaire
- [x] Dossier candidature PA : [accreditation-pa/](../accreditation-pa/README.md)
- [ ] Audit des champs manquants restants (mentions légales PDF, adresses normalisées)

### Phase 1 — Fondations (Q2–Q3 2026)
- [x] Étendre modèle `Client` (SIREN) ; profil org (SIRET/SIREN)
- [ ] Mentions obligatoires réforme sur factures (modèle + PDF)
- [x] Stockage empreinte XML + statuts `eInvoiceStatus`

### Phase 2 — Formats structurés (Q3 2026)
- [x] Module backend `e-invoicing`
- [x] Génération XML simplifié (pré-Factur-X) depuis une facture
- [ ] Factur-X complet PDF/A-3 + validation schéma
- [x] Export / téléchargement XML côté frontend

### Phase 3 — Intégration PA (Q3–Q4 2026)
- [ ] Client API PA (sandbox + production)
- [ ] Émission : envoi facture + suivi statuts
- [ ] Annuaire SIREN / routage destinataire
- [ ] Paramètres organisation + UI envoi électronique

### Phase 4 — Réception fournisseurs (Q4 2026 – Q1 2027)
- [ ] Webhook / sync factures entrantes via PA
- [ ] Import entrant → brouillon achat / compta
- [ ] UI boîte de réception fournisseurs

### Phase 5 — E-reporting (Q1 2027)
- [ ] Flux B2C / export / paiements → transmission PA
- [ ] Dashboard statuts e-reporting

### Phase 6 — PME & finition (avant sept. 2027)
- [ ] Activation par défaut PME, tests E2E, doc utilisateur
- [ ] DPA / conformité RGPD avec sous-traitant PA

---

## 🔴 Priorité haute (Court terme - 1-2 mois)

### Backend - Qualité API (v0.2)
- [x] Implémenter DTOs avec `class-validator` sur tous les endpoints (✅ Products, Prospects, Packs faits - reste Quotes)
- [x] Ajouter pagination sur les listes (clients, factures, produits, devis) (✅ Products, Prospects, Packs faits)
- [x] Ajouter tri (par date, montant, nom, etc.) (✅ Products, Prospects, Packs faits)
- [x] Ajouter recherche textuelle (nom, email, référence) (✅ Products, Prospects, Packs faits)
- [x] Normaliser les erreurs avec exception filter global (✅ Fait)
- [x] Améliorer les messages d'erreur (codes HTTP appropriés) (✅ Fait)

### Backend - PDF & Email (v0.5)
- [x] Créer modèle PDF avec logo, entête, pied de page (✅ Modèle professionnel implémenté)
- [x] Implémenter export PDF depuis une facture (✅ Fait)
- [x] Implémenter export PDF depuis un devis (✅ Fait)
- [x] Configurer nodemailer pour envoi réel d'emails (✅ Fait)
- [x] Créer templates d'emails (facture, devis, relance) (✅ Templates HTML implémentés)
- [ ] Ajouter mentions légales dynamiques dans les PDF (⚠️ Mentions statiques pour l'instant)

### Backend - Authentification & Profils (v0.4)
- [ ] Créer modèles User, Organization, OrganizationDocument dans Prisma
- [ ] Ajouter champs OAuth Google dans User (googleId, googleEmail, googlePicture)
- [ ] Modifier modèles existants pour ajouter organizationId (multi-tenant)
- [ ] Migration Prisma et script migration données existantes
- [ ] Implémenter authentification JWT (login/signup/logout)
- [ ] Créer endpoints auth (signup, login, logout, refresh, forgot-password)
- [ ] **Implémenter authentification Google OAuth** (passport-google-oauth20)
- [ ] **Créer endpoints Google OAuth** (/auth/google, /auth/google/callback)
- [ ] **Gérer liaison compte Google à compte existant**
- [ ] Ajouter guards JWT et rôles pour protéger les routes
- [ ] Créer middleware multi-tenant (filtrage par organisation)
- [ ] Implémenter service Users (profil utilisateur)
- [ ] Implémenter service Organizations (profil entreprise)
- [ ] Créer endpoints profils (GET/PATCH /auth/me, /organization/profile)
- [ ] Gestion upload documents officiels (Multer)
- [ ] Validation documents par admin
- [ ] Protéger toutes les routes API existantes
- [ ] Filtrer toutes les données par organizationId
- [ ] Voir document détaillé : `docs/planning/AUTH_AND_PROFILES.md`

### Backend - Avoirs (v0.3)
- [x] Créer modèle Avoir dans Prisma (✅ CreditNote, CreditNoteLine, CreditNoteApplication)
- [x] Implémenter CRUD pour les avoirs (✅ Service, Controller, DTOs avec validation)
- [x] Lier avoirs aux factures (✅ Relation optionnelle invoiceId)
- [x] Gérer l'imputation des avoirs sur les factures (✅ Endpoint /apply avec validation)
- [x] Créer écritures comptables pour les avoirs (✅ Écritures automatiques 411/706/44571)

### Frontend - Devis & Factures
- [ ] Implémenter conversion devis → facture
- [ ] Créer page de visualisation de facture
- [ ] Ajouter téléchargement PDF depuis le frontend
- [ ] Implémenter échéances et relances automatiques
- [ ] Ajouter gestion des paiements partiels
- [ ] Créer interface pour les avoirs

### Frontend - Clients
- [ ] Créer fiche client détaillée complète
- [ ] Afficher historique des factures/devis par client
- [ ] Ajouter notes et commentaires sur les clients
- [ ] Implémenter upload de documents attachés
- [ ] Gérer adresses multiples par client
- [ ] Créer import/export CSV des clients

## 🟡 Priorité moyenne (Moyen terme - 3-6 mois)

### Backend - Import/Export (v0.7)
- [ ] Implémenter import CSV de clients
- [ ] Implémenter import Excel de clients
- [ ] Créer export CSV des factures
- [ ] Créer export CSV des lignes de factures
- [ ] Ajouter validation des données importées
- [ ] Gérer les erreurs d'import avec rapport détaillé

### Backend - Comptabilité (v0.8)
- [ ] Implémenter verrouillage de périodes comptables
- [ ] Ajouter contre-passations avec validation
- [ ] Créer interface de visualisation des écritures (frontend)
- [ ] Améliorer export FEC (format simplifié)
- [ ] Ajouter validation des écritures avant enregistrement

### Backend - Suivi devis/factures (v0.8)
- [ ] Finaliser tous les statuts : DRAFT/SENT/VIEWED/ACCEPTED/DECLINED/OVERDUE
- [ ] Implémenter logique de transition entre statuts
- [ ] Ajouter notifications sur changements de statut

### Backend - Technique & Ops (v0.9)
- [ ] Configurer CI simple (lint, build, tests)
- [ ] Ajouter observabilité de base (logs corrélés)
- [ ] Implémenter monitoring des performances
- [ ] Créer dashboard de métriques
- [ ] Ajouter alertes sur erreurs critiques

### Frontend - Dashboard
- [ ] Ajouter widgets personnalisables
- [ ] Implémenter export PDF des rapports
- [ ] Créer graphique produits les plus vendus
- [ ] Ajouter analyse des impayés
- [ ] Implémenter prévisions de trésorerie

### Frontend - Produits
- [ ] Ajouter gestion des catégories de produits
- [ ] Implémenter upload d'images produits
- [ ] Créer système de stock (optionnel)
- [ ] Ajouter codes-barres
- [ ] Implémenter tarifs horaires
- [ ] Créer gestion des temps

### Frontend - Devis
- [ ] Créer éditeur WYSIWYG pour devis
- [ ] Implémenter templates personnalisables
- [ ] Ajouter gestion des remises
- [ ] Créer envoi par email depuis le frontend

### Frontend - Templates & Personnalisation
- [ ] Créer éditeur de templates de facture
- [ ] Implémenter variables dynamiques
- [ ] Ajouter prévisualisation en temps réel
- [ ] Créer thèmes de facture personnalisables
- [ ] Implémenter signature électronique

### Frontend - CRM
- [ ] Créer suivi des prospects avancé
- [ ] Implémenter pipeline de vente visuel
- [ ] Ajouter rappels automatiques
- [ ] Créer statistiques client détaillées
- [ ] Implémenter fusion de clients

## 🟢 Priorité basse (Long terme - 6-12 mois)

### Backend - Multi-devises
- [ ] Ajouter support multi-devises dans le schéma
- [ ] Implémenter conversion de devises
- [ ] Créer gestion des taux de change
- [ ] Ajouter sélection de devise par facture

### Backend - Webhooks
- [ ] Créer système de webhooks
- [ ] Implémenter notifications temps réel
- [ ] Ajouter synchronisation bidirectionnelle
- [ ] Créer événements personnalisés

### Backend - OSS (TVA B2C UE)
- [ ] Implémenter logique OSS (TVA B2C UE par pays)
- [ ] Ajouter détection automatique du pays du client
- [ ] Créer calcul TVA selon pays UE

### Frontend - Multi-devises
- [ ] Ajouter sélection de devise dans l'interface
- [ ] Implémenter affichage des montants en différentes devises
- [ ] Créer conversion automatique

### Frontend - Performance
- [ ] Implémenter lazy loading des routes
- [ ] Ajouter code splitting
- [ ] Optimiser les images
- [ ] Créer PWA complète

### Frontend - Accessibilité
- [ ] Améliorer navigation clavier
- [ ] Ajouter support screen readers
- [ ] Implémenter contraste adaptatif
- [ ] Respecter WCAG 2.1 AA

## 🔍 OSINT & Intelligence (v1.6.0+)

### Veille économique & concurrentielle
- [ ] Scraping des données publiques (INSEE, registres du commerce, OpenCorporates)
- [ ] Analyse des patterns de paiement (détection de difficultés financières)
- [ ] Surveillance des changements (adresse, statut légal, TVA)
- [ ] Analyse sectorielle (performance par domaine d'activité)
- [ ] Veille concurrentielle (nouveaux acteurs, évolution des prix)

### Intelligence des risques
- [ ] Scoring de risque client (probabilité de défaut de paiement)
- [ ] Détection de fraude (patterns suspects dans les factures)
- [ ] Surveillance réglementaire (changements de TVA, nouvelles obligations)
- [ ] Analyse de solvabilité (croisement avec données publiques)
- [ ] Alertes automatiques (notifications sur changements significatifs)

### Enrichissement des données
- [ ] Profils d'entreprises enrichis (CA, effectifs, secteur, statut légal)
- [ ] Corrélation données internes/externes (historique + données publiques)
- [ ] Base de connaissances (informations consolidées sur le marché)
- [ ] API d'intelligence (endpoints pour enrichir les profils clients)

### Sources de données publiques (OSINT)
- [ ] Intégration INSEE (chiffre d'affaires, effectifs, secteur)
- [ ] Intégration registre du commerce (statut légal, dirigeants, capital)
- [ ] Intégration Infogreffe (bilans, comptes de résultat, ratios)
- [ ] Intégration SIRENE (informations générales, adresses, activités)
- [ ] Intégration BDF (incidents de paiement, scoring de crédit)
- [ ] Intégration BODACC (avis de procédures collectives)
- [ ] Intégration Journal officiel (nominations, changements de statut)

### APIs & Services tiers
- [ ] Intégration OpenCorporates (données d'entreprises internationales)
- [ ] Intégration Company House (données UK)
- [ ] Intégration Dun & Bradstreet (scoring de crédit)
- [ ] Intégration Bureau van Dijk (bases de données d'entreprises)
- [ ] Intégration APIs bancaires (scoring de crédit, avec autorisation)

### Surveillance & veille
- [ ] Surveillance des sites web clients (changements de contenu)
- [ ] Scraping des équipes (photos, noms, postes)
- [ ] Analyse des organigrammes (structure organisationnelle)
- [ ] Surveillance des changements (nouveaux employés, départs)
- [ ] Intégration réseaux sociaux (LinkedIn, changements d'emploi)
- [ ] Surveillance presse locale (actualités, événements)
- [ ] Monitoring forums spécialisés (réputation, retours)
- [ ] Surveillance sites d'emploi (offres, évolution des effectifs)

### Infrastructure de collecte
- [ ] Scraping automatisé (Puppeteer/Playwright pour sites dynamiques)
- [ ] Parsing HTML (Cheerio pour sites statiques)
- [ ] Jobs programmés (surveillance continue avec Node-cron)
- [ ] APIs officielles (requêtes HTTP structurées, rate limiting)
- [ ] Webhooks & notifications (alertes temps réel)

### Scraping avancé
- [ ] Extraction des équipes (photos, noms, postes, emails)
- [ ] Analyse des organigrammes (structure hiérarchique)
- [ ] Surveillance des changements (employés, départs, promotions)
- [ ] Détection de difficultés (fermetures, réductions d'effectifs)
- [ ] Analyse du contenu (nouvelles offres, changements de services)
- [ ] Gestion des cookies/sessions (authentification sites protégés)
- [ ] Rotation des User-Agents (évitement détection anti-bot)
- [ ] Proxy rotation (IPs multiples pour éviter blocage)

## 🤖 Machine Learning & IA (v1.7.0+)

### Modèles prédictifs
- [ ] Prédiction de trésorerie (quand les clients vont payer avec TensorFlow.js)
- [ ] Scoring de risque avancé (modèles ML sur historique + données externes)
- [ ] Détection d'anomalies (factures suspectes, patterns étranges)
- [ ] Prédiction de churn (probabilité de résiliation d'abonnement)
- [ ] Forecasting des ventes (tendances et saisonnalité)

### Natural Language Processing
- [ ] Analyse des descriptions (catégorisation automatique des factures)
- [ ] Sentiment analysis (analyse des emails et interactions clients)
- [ ] Extraction d'entités (dates, montants, références automatiques)
- [ ] Génération automatique (descriptions de factures, emails de relance)
- [ ] Classification des demandes (routage automatique des tickets)

### Optimisation & Recommandations
- [ ] Pricing dynamique (ajustement des prix basé sur l'historique)
- [ ] Suggestions de produits (recommandations personnalisées)
- [ ] Optimisation des échéances (meilleurs délais de paiement)
- [ ] Segmentation client (clustering automatique des profils)
- [ ] Prédiction de besoins (anticipation des demandes clients)

## 💰 Comptabilité Frontend (v1.0.0)

### Écritures comptables
- [ ] Visualisation des écritures dans l'interface
- [ ] Affichage du plan comptable
- [ ] Imputation automatique avec interface
- [ ] Contrôles de cohérence visuels

### Rapports comptables
- [ ] Interface Balance
- [ ] Interface Grand livre
- [ ] Compte de résultat
- [ ] Bilan simplifié

### Intégrations
- [ ] Interface export FEC
- [ ] Synchronisation bancaire
- [ ] Import d'écritures depuis fichiers
- [ ] Conformité fiscale avec alertes

## 🔄 Abonnements & Récurs (v1.1.0)

### Gestion des abonnements
- [ ] Interface de création d'abonnements
- [ ] Gestion des cycles de facturation
- [ ] Suspension/résiliation depuis l'interface
- [ ] Historique des modifications

### Facturation automatique
- [ ] Génération automatique de factures
- [ ] Règlement par prélèvement
- [ ] Gestion des échecs de paiement
- [ ] Notifications automatiques

### Analytics abonnements
- [ ] Calcul et affichage MRR/ARR
- [ ] Calcul du churn rate
- [ ] LTV par client
- [ ] Métriques SaaS complètes

## 📋 Déclarations & Taxes (v1.2.0)

### TVA
- [ ] Interface de calcul automatique
- [ ] Déclarations CA3 avec formulaire
- [ ] Livre de TVA
- [ ] Récapitulatifs détaillés

### URSSAF & Statuts d'entreprises
- [ ] Ajouter statut entreprise dans modèle Client (auto-entrepreneur, micro-entreprise, etc.)
- [ ] Créer service URSSAF avec calculs selon statut
- [ ] Implémenter calcul cotisations auto-entrepreneur (taux selon activité)
- [ ] Gérer option micro-fiscal (taux réduits)
- [ ] Vérifier seuils de CA annuel
- [ ] Créer déclarations URSSAF automatiques (mensuelle/trimestrielle)
- [ ] Générer écritures comptables pour cotisations
- [ ] Interface configuration statut entreprise
- [ ] Dashboard échéances URSSAF
- [ ] Alertes échéances automatiques
- [ ] Voir document détaillé : `docs/planning/URSSAF_INTEGRATION.md`

### Autres taxes
- [ ] CVAE
- [ ] CFE
- [ ] Taxes locales
- [ ] Calendrier fiscal avec alertes

### Conformité
- [ ] Alertes de déclaration automatiques
- [ ] Archivage légal
- [ ] Traçabilité complète
- [ ] Audit trail

## 🎨 UX/UI Avancée (v1.2.0)

### Personnalisation
- [ ] Thèmes complets personnalisables
- [ ] Layouts personnalisables
- [ ] Raccourcis clavier
- [ ] Mode sombre/clair amélioré

### Performance
- [ ] Lazy loading complet
- [ ] Code splitting optimisé
- [ ] Optimisation images avancée
- [ ] PWA complète avec service worker

## 🔌 Intégrations (v1.3.0)

### APIs externes
- [ ] Intégration Stripe/PayPal
- [ ] Intégration comptabilité (Sage, Cegid)
- [ ] Intégration CRM (HubSpot, Salesforce)
- [ ] Intégration email (Mailchimp, SendGrid)

### Export/Import
- [ ] Formats multiples (PDF, Excel, CSV)
- [ ] Synchronisation cloud
- [ ] Sauvegarde automatique

## 📱 Mobile & PWA (v1.4.0)

### Application mobile
- [ ] PWA complète avec toutes les fonctionnalités
- [ ] Notifications push
- [ ] Mode hors ligne complet
- [ ] Synchronisation automatique

### Responsive design
- [ ] Adaptation mobile optimale
- [ ] Gestes tactiles
- [ ] Optimisation performance mobile
- [ ] Publication sur app stores

## 🚀 Intelligence Artificielle (v1.5.0)

### IA intégrée
- [ ] Suggestion de produits intelligente
- [ ] Détection d'anomalies avancée
- [ ] Prévisions de trésorerie avec IA
- [ ] Chatbot support

### Automatisation
- [ ] Workflows personnalisables
- [ ] Règles métier configurables
- [ ] Actions automatiques
- [ ] Machine learning intégré

## 📊 Métriques de succès

### Performance
- [ ] Temps de chargement < 2s
- [ ] Score Lighthouse > 90
- [ ] Disponibilité > 99.9%

### Utilisateur
- [ ] Taux d'adoption > 80%
- [ ] Temps de formation < 1h
- [ ] Satisfaction > 4.5/5

### Business
- [ ] Réduction temps facturation > 50%
- [ ] Diminution impayés > 30%
- [ ] ROI positif en 6 mois

### Intelligence
- [ ] Précision des prédictions > 85% pour le scoring de risque
- [ ] Détection d'anomalies < 5% de faux positifs
- [ ] Enrichissement des données > 90% des profils clients enrichis
- [ ] Réduction des impayés > 40% grâce aux alertes précoces
- [ ] ROI de l'intelligence > 300% sur les investissements ML

## 🧪 Tests & Qualité

### Backend
- [x] Augmenter couverture de tests unitaires (✅ Products: 19 tests unitaires)
- [ ] Ajouter tests d'intégration
- [x] Améliorer tests E2E (✅ Products: 11 tests E2E)
- [ ] Tests de performance
- [ ] Tests de sécurité

### Frontend
- [ ] Tests unitaires avec Vitest
- [ ] Tests E2E avec Playwright
- [ ] Tests de composants avec Testing Library
- [ ] Storybook pour documentation des composants
- [ ] Coverage > 80%

## 📚 Documentation

### Technique
- [ ] Documentation API complète (Swagger/OpenAPI)
- [ ] Guide de contribution détaillé
- [ ] Architecture decision records (ADRs)
- [ ] Diagrammes d'architecture

### Utilisateur
- [ ] Guide utilisateur complet
- [ ] Tutoriels vidéo
- [ ] FAQ exhaustive
- [ ] Changelog détaillé

## 🔧 Maintenance & Ops

### Infrastructure
- [ ] CI/CD complet
- [ ] Déploiement automatique
- [ ] Monitoring avancé
- [ ] Alertes automatiques
- [ ] Backup automatique
- [ ] Plan de reprise d'activité

### Sécurité
- [ ] Audit de sécurité
- [ ] Gestion des secrets
- [ ] Chiffrement des données sensibles
- [ ] Conformité RGPD complète
- [ ] Tests de pénétration

---

## Résumé

**Total des tâches** : ~200+ tâches identifiées

**Répartition** :
- 🔴 Priorité haute : ~30 tâches
- 🟡 Priorité moyenne : ~60 tâches
- 🟢 Priorité basse : ~110+ tâches

**Estimation globale** : 14-20 mois pour atteindre v1.5.0 avec toutes les fonctionnalités

**Focus recommandé** : Commencer par les priorités hautes (PDF, Auth, Qualité API) avant de s'attaquer aux fonctionnalités avancées (OSINT, ML).

