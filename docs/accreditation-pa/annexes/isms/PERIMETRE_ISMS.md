# Périmètre ISMS — DanielCraft / Facturio

**Version** : 0.1 (brouillon)  
**Date** : _À compléter_  
**Approuvé par** : Loïc DANIEL — RSSI  
**Prochaine revue** : _À compléter (annuelle)_

---

## 1. Objet

Ce document définit le périmètre du **Système de Management de la Sécurité de l'Information (ISMS)** visé par la certification ISO/IEC 27001.

## 2. Organisation

| Élément | Valeur |
|---------|--------|
| Raison sociale | Loïc DANIEL — DanielCraft |
| SIRET | 823 417 050 000 23 |
| Siège | 57000 Metz, France |
| Responsable sécurité (RSSI) | Loïc DANIEL — contact@danielcraft.fr |
| Contact incidents | contact@danielcraft.fr |

## 3. Périmètre inclus

| Domaine | Description |
|---------|-------------|
| Produit | Application SaaS **Facturio** (devis, factures, clients, compta, e-invoicing) |
| Développement | Dépôt Git Facturio (`server/`, `frontend/`, `mobile/` si données prod partagées) |
| Exploitation | Environnement production (node10.lan, PostgreSQL, Nginx, déploiement `scripts/deploy/`) |
| Données | Comptes utilisateurs, organisations, clients, devis, factures, paiements, flux e-facture |
| Services support | Authentification, API REST, webhooks Stripe, envoi email |

## 4. Périmètre exclu (v1)

| Domaine | Justification exclusion |
|---------|-------------------------|
| Prestations clients DanielCraft hors Facturio | Hors périmètre produit |
| Poste de travail personnel | Traité par bonnes pratiques, non audité formellement en v1 |
| _Autre : _ | _À compléter_ |

## 5. Localisation des données

| Type | Localisation |
|------|--------------|
| Base de données production | _À compléter (ex. node10.lan, UE)_ |
| Sauvegardes | _À compléter_ |
| Code source | _À compléter (ex. GitHub, UE/US selon hébergeur)_ |

## 6. Parties prenantes

| Rôle | Nom / entité |
|------|--------------|
| Direction | Loïc DANIEL |
| RSSI | Loïc DANIEL |
| DPO (contact) | Loïc DANIEL — contact@danielcraft.fr |
| Sous-traitants critiques | _Voir REGISTRE_ACTIFS.md et REGISTRE_TRAITEMENTS_RGPD.md_ |

## 7. Interfaces externes

| Interface | Finalité |
|-----------|----------|
| Stripe | Abonnement Facturio + paiement factures clients |
| SMTP | Envoi emails transactionnels |
| ProspectLab | Prospection (plan Pro) |
| PPF / réseau PA | _À venir — immatriculation PA DanielCraft_ |

## 8. Historique des versions

| Version | Date | Auteur | Changement |
|---------|------|--------|------------|
| 0.1 | juin 2026 | Loïc DANIEL | Création brouillon |
