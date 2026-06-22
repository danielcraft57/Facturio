# DanielCraft — Descriptif technique émission et réception des factures électroniques

**Éditeur** : Loïc DANIEL — DanielCraft  
**Service** : PrestaFacture — https://prestafacture.com  
**Version** : 1.0 — juin 2026  
**PDF signé** : `DanielCraft – Descriptif emission reception – 202606.pdf`

---

## 1. Objet

Description du processus d'**envoi** et de **réception** des factures électroniques, de réception des données de facturation, de transaction et de paiement, pour la demande d'immatriculation en Plateforme Agréée.

## 2. Architecture générale

```
Utilisateur PrestaFacture (émetteur / destinataire métier)
        │
        ▼
PrestaFacture SaaS (contrôle conformité, Factur-X, archivage)
        │
        ▼
Passerelle réseau PA (émission, réception, annuaire, e-reporting)
        │
        ▼
Portail Public de Facturation (PPF) / réseau PA / administration
```

**État juin 2026** : module métier et génération XML EN 16931 opérationnels ; passerelle PPF en développement.

## 3. Formats supportés

| Format | Émission | Réception | Statut |
|--------|----------|-----------|--------|
| **Factur-X** (PDF/A-3 + XML EN 16931) | Cible prioritaire | Oui | XML simplifié livré ; PDF/A-3 en cours |
| **UBL** | Selon interop PPF | Oui | Planifié |
| **CII** | Selon interop PPF | Oui | Planifié |

## 4. Processus d'émission (flux sortant)

1. L'utilisateur finalise une facture B2B dans PrestaFacture (statut envoyée, lignes, client entreprise).
2. **Contrôle de conformité** automatique : SIRET/SIREN émetteur, SIREN client B2B, adresses, lignes, mentions.
3. **Génération** du fichier structuré Factur-X (XML ; PDF/A-3 à terme).
4. Calcul de l'**empreinte** (hash) et horodatage en base.
5. **Consultation annuaire** (SIREN destinataire → routage plateforme destinataire).
6. **Transmission** via API PPF / réseau PA.
7. Mise à jour des **statuts** : `PENDING_PA` → `SENT` → `DELIVERED` ou `ERROR`.
8. **Archivage** : PDF + XML + métadonnées conservés pour la durée légale.

### Mesures d'authenticité, intégrité et lisibilité

- Numérotation séquentielle des factures par organisation
- Hash XML stocké ; horodatage de génération
- Facture non modifiable après émission conforme (traçabilité ISCA côté produit)
- Conservation des formats lisibles (PDF + XML structuré)

## 5. Processus de réception (flux entrant)

1. Réception d'une facture fournisseur via **webhook / polling** PPF.
2. Vérification authentique du message (signature / canal sécurisé PPF).
3. **Parsing** Factur-X / UBL / CII entrant.
4. Enregistrement en **boîte de réception fournisseurs** PrestaFacture.
5. Proposition d'import en compta achats (module accounting).
6. Notification utilisateur.

**Statut** : en développement (cible Q4 2026 — Q1 2027).

## 6. Données de facturation, transaction et paiement

- **E-reporting** : agrégation des flux B2C, export, paiements enregistrés (`Payment`, Stripe) — transmission vers PPF selon calendrier réglementaire.
- Lien avec les paiements Stripe prestataire (encaissement factures clients).

## 7. Sécurisation des flux

- HTTPS TLS pour toutes les API
- Authentification API PPF (mécanisme défini par spécifications AIFE — en cours d'intégration)
- Journal d'audit des transmissions (en cours)
- Idempotence des soumissions (`Idempotency-Key`)

## 8. Module logiciel

- Backend : `server/src/e-invoicing/` (NestJS)
- Contrôle conformité : `EInvoicingComplianceService`
- Génération : `FacturXGeneratorService`
- Passerelle réseau : en remplacement du connecteur partenaire mock actuel

---

**Loïc DANIEL** — DanielCraft  
Metz, le _______________
