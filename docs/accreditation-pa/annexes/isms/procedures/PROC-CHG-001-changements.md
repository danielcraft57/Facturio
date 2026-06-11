# PROC-CHG-001 — Gestion des changements (production)

**Version** : 0.1  
**Propriétaire** : Loïc DANIEL

---

## 1. Objectif

Maîtriser les déploiements et modifications en production pour limiter les incidents.

## 2. Flux standard Facturio

Référence : `scripts/deploy/facturio-update.sh`, `AGENTS.md`

1. Développement sur branche feature
2. PR + CI verte (`server-unit`, `server-e2e`, `frontend`)
3. Merge `main`
4. Déploiement node10 : `git pull` → `migrate:prod` → `build:prod` → restart
5. Vérification : `journalctl -u facturio`, smoke test login

## 3. Changements urgents (hotfix)

1. Branche hotfix depuis `main`
2. CI minimale (tests ciblés)
3. Déploiement hors heures si possible
4. Backup BDD **avant** migration (`PROC-BKP-001`)

## 4. Traçabilité

| Élément | Outil |
|---------|-------|
| Code | Git / GitHub |
| Migrations BDD | `prisma/migrations/` |
| Déploiements | _À noter dans revues ou changelog_ |

## 5. Rollback

1. Restaurer version précédente Git (`git checkout` tag/commit)
2. Rebuild + restart
3. Si migration irréversible : restaurer backup BDD (PROC-BKP-001)

## 6. Checklist pré-déploiement majeur (e-facture / PA)

- [ ] Backup BDD récent
- [ ] Tests e2e e-invoicing verts
- [ ] Variables env `E_INVOICING_*` / PPF documentées
- [ ] Communication utilisateurs si changement visible
