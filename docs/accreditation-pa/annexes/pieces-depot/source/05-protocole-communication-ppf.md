# DanielCraft — Protocole de communication sécurisé avec le PPF

**Éditeur** : Loïc DANIEL — DanielCraft  
**Service** : PrestaFacture  
**Version** : 1.0 — juin 2026 (brouillon)  
**PDF signé** : `DanielCraft – Protocole communication PPF – 202606.pdf`

---

## 1. Objet

Description du protocole de communication sécurisé permettant de transmettre les factures électroniques et les données de facturation, de transaction et de paiement au **Portail Public de Facturation (PPF)**, conformément à l'arrêté du 7 octobre 2022.

> **Note** : ce document sera finalisé à l'issue de l'intégration technique avec les spécifications officielles AIFE/DGFiP (environnement sandbox puis production).

## 2. Principes généraux

| Principe | Mise en œuvre prévue |
|----------|---------------------|
| Confidentialité | HTTPS TLS 1.2+ ; chiffrement des secrets API |
| Intégrité | Hash des payloads ; validation schémas XML |
| Authentification | Mécanisme défini par le PPF (certificats / tokens — selon documentation AIFE) |
| Non-répudiation | Journal horodaté des envois et accusés de réception PPF |
| Disponibilité | Retry, file d'attente, monitoring |

## 3. Architecture de connexion

```
PrestaFacture (node10.lan, France, UE)
    │
    │ HTTPS (TLS)
    ▼
API Portail Public de Facturation (AIFE)
    │
    ▼
Réseau Plateformes Agréées / Administration
```

## 4. Flux protocolaires (cible)

| Flux | Direction | Description |
|------|-----------|-------------|
| Soumission facture | Sortant | Envoi Factur-X / UBL vers PPF |
| Statut lifecycle | Entrant | Webhook ou polling statuts |
| Réception facture | Entrant | Facture fournisseur reçue |
| Annuaire SIREN | Sortant | Consultation routage destinataire |
| E-reporting | Sortant | Transmission agrégats transaction / paiement |

## 5. Formats de messages

- **Factur-X** (priorité France) — profil EN 16931
- **UBL** / **CII** — selon exigences interop
- Encapsulation et métadonnées selon **spécifications PPF** (version à référencer lors de l'intégration sandbox)

## 6. Gestion des erreurs

- Codes HTTP / codes métier PPF journalisés
- Rejet facture : motif transmis à l'utilisateur, statut `ERROR`
- Nouvelle soumission possible après correction (nouvelle idempotence si contenu modifié)

## 7. Environnements

| Environnement | Usage |
|---------------|-------|
| Sandbox PPF | Tests d'interopérabilité (obligatoires avant production) |
| Production PPF | Exploitation après immatriculation |

## 8. Tests d'interopérabilité

Comptes rendus à transmettre au SIM sous **3 mois** après validation du dossier :

- Émission / réception / transmission avec PPF
- Échanges avec une autre PA

---

**Loïc DANIEL** — DanielCraft  
Metz, le _______________

**Annexe à compléter** : référence exacte des endpoints et schémas PPF (document AIFE).
