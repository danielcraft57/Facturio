# Registre des actifs informationnels — Facturio

**Version** : 0.1  
**Dernière mise à jour** : _À compléter_  
**Responsable** : Loïc DANIEL — RSSI

---

## Actifs logiciels

| ID | Actif | Description | Propriétaire | Criticité | Localisation |
|----|-------|-------------|--------------|-----------|--------------|
| A-SW-001 | API Facturio | NestJS, port 3000 prod | Loïc DANIEL | Haute | node10.lan |
| A-SW-002 | Frontend Facturio | React / Vite `dist` | Loïc DANIEL | Haute | node10.lan (Nginx) |
| A-SW-003 | Dépôt Git | Code source | Loïc DANIEL | Haute | _À compléter (GitHub ?)_ |
| A-SW-004 | Module e-invoicing | `server/src/e-invoicing/` | Loïc DANIEL | Haute | Git + prod |
| A-SW-005 | App mobile | Expo / React Native | Loïc DANIEL | Moyenne | Stores / builds |

## Actifs données

| ID | Actif | Description | Criticité | Rétention | Sauvegarde |
|----|-------|-------------|-----------|-----------|------------|
| A-DA-001 | PostgreSQL `facturio` | Données métier prod | Haute | _À définir_ | _À compléter_ |
| A-DA-002 | Secrets chiffrés org | Clés Stripe prestataire | Haute | Durée compte | Inclus BDD |
| A-DA-003 | Logs applicatifs | journalctl / fichiers | Moyenne | _À définir_ | _À compléter_ |
| A-DA-004 | Sauvegardes BDD | dumps pg_dump | Haute | _À définir (30 j min.)_ | Hors prod |

## Actifs matériels / infra

| ID | Actif | Rôle | Localisation | Criticité |
|----|-------|------|--------------|-----------|
| A-HW-001 | node10.lan | App + BDD | _UE — à confirmer_ | Haute |
| A-HW-002 | node12.lan | Reverse proxy HTTPS | _UE — à confirmer_ | Haute |

## Comptes et accès privilégiés

| ID | Compte / accès | Usage | MFA | Dernière revue |
|----|----------------|-------|-----|----------------|
| A-AC-001 | SSH node10 | Admin prod | _À compléter_ | _À compléter_ |
| A-AC-002 | SSH node12 | Admin proxy | _À compléter_ | _À compléter_ |
| A-AC-003 | GitHub org/repo | Code, CI | _À compléter_ | _À compléter_ |
| A-AC-004 | Stripe Dashboard | Paiements plateforme | _À compléter_ | _À compléter_ |
| A-AC-005 | Comptes admin Facturio | Support / debug | _À compléter_ | _À compléter_ |

## Services tiers (sous-traitants)

| ID | Fournisseur | Service | Données concernées | DPA |
|----|-------------|---------|---------------------|-----|
| A-ST-001 | Stripe | Paiements | Email, abonnement, factures | ☐ |
| A-ST-002 | _Fournisseur SMTP_ | Email | Email clients, contenu factures | ☐ |
| A-ST-003 | ProspectLab | Prospection | Données prospects | ☐ |
| A-ST-004 | _Hébergeur si tiers_ | Hébergement | Toutes données prod | ☐ |
