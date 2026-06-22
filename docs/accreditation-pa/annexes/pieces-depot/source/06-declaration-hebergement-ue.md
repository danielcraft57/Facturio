# DanielCraft — Déclaration d'engagement : hébergement Union européenne

**Éditeur** : Loïc DANIEL — DanielCraft  
**SIRET** : 823 417 050 000 23  
**SIREN** : 823 417 050  
**Version** : 1.0 — juin 2026  
**PDF signé** : `DanielCraft – Declaration hebergement UE – 202606.pdf`

---

Metz, le _______________

**À l'attention du Service d'immatriculation des plateformes agréées — DGFiP**

Je soussigné **Loïc DANIEL**, représentant légal de l'entreprise individuelle **DanielCraft** (SIRET 823 417 050 000 23), candidat à l'immatriculation en qualité de **Plateforme Agréée** pour le service **PrestaFacture** (https://prestafacture.com),

## Déclare et m'engage à :

### 1. Exploitation depuis l'Union européenne

Exploiter le système d'information de la plateforme depuis le territoire d'un **État membre de l'Union européenne** (France).

### 2. Absence de transfert hors UE

M'assurer qu'**aucun transfert** des données hébergées par la plateforme n'est possible **en dehors de l'Union européenne**, sauf garanties conformes au RGPD si applicable.

## Justificatifs

### Localisation des serveurs

| Composant | Localisation | Hébergeur / opérateur |
|-----------|--------------|----------------------|
| Application PrestaFacture (API) | **France** — node10.lan | DanielCraft (infra propre) |
| Reverse proxy HTTPS | **France** — node12.lan | DanielCraft (infra propre) |
| Base PostgreSQL production | **France** — node10.lan | DanielCraft (infra propre) |
| Sauvegardes BDD | **France** — _chemin à préciser_ | DanielCraft |

> Si migration vers hébergeur cloud : joindre qualification **SecNumCloud** ANSSI ou courrier ANSSI (qualification en cours).

### Localisation du personnel

| Fonction | Localisation |
|----------|--------------|
| Développement, exploitation, RSSI | **France** — Metz (57000) |

### Sous-traitants intervenant sur l'activité PA

| Sous-traitant | Rôle | Localisation données |
|---------------|------|---------------------|
| Stripe | Paiements | Politique Stripe — clauses DPA |
| _Fournisseur SMTP_ | Email | _À compléter_ |

### Dispositifs empêchant le transfert hors UE

- Hébergement applicatif et BDD sur infrastructure située en **France**
- Pas de réplication BDD vers régions hors UE
- Accès SSH restreint (pare-feu, clés)
- Sous-traitants sélectionnés avec clauses contractuelles **UE** / RGPD
- Revue annuelle des sous-traitants et flux de données

---

Fait pour valoir ce que de droit.

**Loïc DANIEL**  
Représentant légal — DanielCraft  
contact@danielcraft.fr  
57000 Metz
