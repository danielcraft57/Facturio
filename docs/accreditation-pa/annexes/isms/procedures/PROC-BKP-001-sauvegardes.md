# PROC-BKP-001 — Sauvegardes et restauration

**Version** : 0.1  
**Propriétaire** : Loïc DANIEL — RSSI  
**Référence PRA** : [PLAN-PRA-001.md](../PLAN-PRA-001.md)

---

## 1. Objectif

Garantir la récupérabilité des données Facturio en cas de perte ou corruption.

## 2. Périmètre

- Base PostgreSQL production `facturio`
- Fichiers uploadés (si applicable — _À inventorier_)
- Configurations critiques (Nginx, systemd unit)

## 3. Sauvegarde PostgreSQL

### Manuelle (existant — doc déploiement)

```bash
sudo -u postgres pg_dump facturio > /opt/facturio/backup_$(date +%Y%m%d_%H%M%S).sql
```

### Automatisée (à mettre en place)

| Paramètre | Valeur cible |
|-----------|--------------|
| Fréquence | Quotidienne (ex. 03:00) |
| Rétention | 30 jours minimum |
| Emplacement | `/opt/facturio/backups/` (hors disque système si possible) |
| Notification échec | Email / log alerte |

**Script cible** : `scripts/deploy/backup-facturio-db.sh` — ☐ À créer  
**Cron** : node10 — ☐ À configurer

## 4. Test de restauration

| Fréquence | Responsable | Preuve |
|-----------|-------------|--------|
| Au moins **1 fois par an** (recommandé trimestriel) | Loïc DANIEL | CR dans `revues/` |

Étapes : voir PLAN-PRA-001 §4.

## 5. Vérifications périodiques

- [ ] Taille backup cohérente (non vide)
- [ ] Dernier backup < 25 h
- [ ] Espace disque suffisant
- [ ] Test restauration sur instance de test (idéal)

## 6. Historique

| Date | Action | Résultat | Opérateur |
|------|--------|----------|-----------|
| _À compléter_ | Premier test restauration | | Loïc DANIEL |
