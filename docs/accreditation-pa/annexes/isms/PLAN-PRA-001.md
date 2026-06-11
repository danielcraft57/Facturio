# Plan de reprise d'activité (PRA) — Facturio

**Référence** : PLAN-PRA-001  
**Version** : 0.1  
**Responsable** : Loïc DANIEL — RSSI  
**Dernière mise à jour** : _À compléter_  
**Prochain test** : _À planifier_

---

## 1. Objectifs

| Indicateur | Cible | Actuel |
|------------|-------|--------|
| **RPO** (perte de données max.) | _À définir (ex. 24 h)_ | _À mesurer_ |
| **RTO** (délai remise en service) | _À définir (ex. 4 h)_ | _À mesurer_ |

## 2. Scénarios

| Scénario | Impact | Procédure | Responsable |
|----------|--------|-----------|-------------|
| Panne node10 (app + BDD) | Service indisponible | Restauration BDD + restart services | Loïc DANIEL |
| Corruption BDD | Perte données récentes | Restauration dernier dump valide | Loïc DANIEL |
| Panne node12 (proxy) | Site inaccessible | Bascule / repair Nginx | Loïc DANIEL |
| Compromission serveur | Fuite / ransomware | Isolation, restauration propre, analyse incident | Loïc DANIEL |

## 3. Sauvegardes

Voir [PROC-BKP-001-sauvegardes.md](./procedures/PROC-BKP-001-sauvegardes.md).

| Élément | Fréquence cible | Emplacement | Rétention |
|---------|-----------------|-------------|-----------|
| PostgreSQL `facturio` | Quotidienne | _À compléter_ | _À compléter (30 j min.)_ |
| Config Nginx / systemd | À chaque changement | Git + _copie prod_ | Versionnée |
| Secrets | Hors Git | Gestionnaire / fichier chiffré | _À documenter_ |

## 4. Procédure de restauration (résumé)

1. Identifier le dernier backup valide (`ls -lh /opt/facturio/backup_*.sql`).
2. Arrêter le service Facturio : `sudo systemctl stop facturio`.
3. Restaurer : `sudo -u postgres psql facturio < /opt/facturio/backup_YYYYMMDD.sql`.
4. Vérifier intégrité (comptage tables, login test).
5. Redémarrer : `sudo systemctl start facturio`.
6. Documenter l'incident et la restauration.

Référence détaillée : `docs/deployment/MIGRATION_VALIDATION_EMAIL.md` (section backup).

## 5. Tests PRA

| Date test | Type | Résultat | Durée RTO mesurée | Écarts | Actions |
|-----------|------|----------|-------------------|--------|---------|
| _À compléter_ | Restauration BDD | | | | |

## 6. Communication crise

| Audience | Canal | Délai |
|----------|-------|-------|
| Utilisateurs affectés | Email / statut page | _À définir_ |
| CNIL (si données personnelles) | cnil.fr | 72 h max si risque élevé |
| contact@danielcraft.fr | Boîte incidents | Immédiat |
