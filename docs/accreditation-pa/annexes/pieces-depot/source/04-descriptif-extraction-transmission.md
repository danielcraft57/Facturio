# DanielCraft — Extraction et transmission des données de facturation, transaction et paiement

**Éditeur** : Loïc DANIEL — DanielCraft  
**Service** : PrestaFacture  
**Version** : 1.0 — juin 2026  
**PDF signé** : `DanielCraft – Descriptif extraction transmission – 202606.pdf`

---

## 1. Objet

Description des **modalités d'extraction** et de **transmission** des données de facturation, de transaction et de paiement vers l'administration fiscale (via PPF), et des **garanties** sur les délais réglementaires.

## 2. Données concernées

| Catégorie | Exemples de données | Source PrestaFacture |
|-----------|-------------------|-----------------|
| Facturation B2B | Numéro facture, dates, montants HT/TVA/TTC, SIREN émetteur/destinataire | `Invoice`, `InvoiceLine`, `Client`, `Organization` |
| Facturation B2C / export | Agrégats e-reporting | Factures + typologie client |
| Transaction | Ventes hors facture électronique obligatoire | Module e-reporting (en cours) |
| Paiement | Encaissements, dates, montants, modes | `Payment`, webhooks Stripe |

## 3. Extraction

### 3.1 Depuis les factures électroniques

1. Génération XML **EN 16931** / Factur-X à partir du modèle métier validé
2. Mapping champs obligatoires : émetteur, destinataire, lignes, TVA, totaux, devise
3. Validation métier avant extraction (score conformité 100 %)
4. Calcul hash d'intégrité avant transmission

### 3.2 Depuis les paiements et transactions

1. Identification des flux soumis à **e-reporting** (B2C France, export, etc.)
2. Agrégation par période calendaire
3. Format de sortie selon spécifications PPF / DGFiP (en cours d'implémentation)

## 4. Transmission

| Canal | Usage |
|-------|-------|
| API **PPF** | Factures électroniques + flux e-reporting |
| Réseau **PA** | Échanges inter-plateformes B2B |
| Webhooks entrants | Statuts lifecycle, factures reçues |

### Garanties de transmission

- **Retry** avec backoff sur erreurs réseau temporaires
- **Idempotence** (`Idempotency-Key`) pour éviter les doublons
- **Journal des transmissions** : horodatage, statut, identifiant externe PPF, motif de rejet
- Surveillance des échecs et alertes opérateur

## 5. Délais

- Transmission des factures électroniques : **immédiate** après validation utilisateur et acceptation réseau
- E-reporting : selon **calendrier réglementaire** publié par l'administration (périodicité mensuelle / événementielle selon flux)
- File d'attente et reprise automatique en cas d'indisponibilité PPF

## 6. Conservation et archivage

- Conservation des factures et preuves de transmission pour la durée légale (**10 ans** — obligation métier)
- Empreintes XML et horodatages conservés en base
- Sauvegardes PostgreSQL quotidiennes (procédure ISMS)

## 7. Sécurité des transmissions

- TLS mutuel / authentification selon protocole PPF
- Pas de transfert des données hébergées hors **Union européenne** (engagement séparé)
- Accès restreint aux identifiants API PPF (secrets chiffrés)

## 8. État d'avancement

| Composant | Statut juin 2026 |
|-----------|------------------|
| Extraction XML factures | Opérationnel (profil simplifié) |
| Transmission PPF production | En développement |
| E-reporting automatisé | Planifié Q1 2027 |
| Journal audit transmissions | En développement |

---

**Loïc DANIEL** — DanielCraft  
Metz, le _______________
