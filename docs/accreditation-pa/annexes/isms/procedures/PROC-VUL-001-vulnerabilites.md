# PROC-VUL-001 — Gestion des vulnérabilités

**Version** : 0.1  
**Propriétaire** : Loïc DANIEL — RSSI

---

## 1. Sources

| Source | Fréquence | Action |
|--------|-----------|--------|
| Dependabot (GitHub) | Continue | ☐ À activer `.github/dependabot.yml` |
| `npm audit` (CI) | Chaque PR | ☐ À ajouter job CI |
| Advisories GitHub | Notifications | Traiter critiques |
| Pentest externe | Avant prod PA | Rapport archivé |

## 2. Classification et délais

| Sévérité | Délai correction cible |
|----------|------------------------|
| Critique (exploit active) | < 48 h |
| Haute | < 7 jours |
| Moyenne | < 30 jours |
| Basse | Prochain sprint |

## 3. Processus

1. Détection (Dependabot, audit, signalement)
2. Évaluation impact sur Facturio
3. Correctif (upgrade dep, patch code)
4. CI verte
5. Déploiement prod (PROC-CHG-001)
6. Clôture ticket / note dans registre risques si récurrent

## 4. État actuel CI

- Tests unitaires et e2e : ✅ `.github/workflows/ci.yml`
- `npm audit` bloquant : ☐ Non
- Dependabot : ☐ Non configuré

## 5. Actions prioritaires

| Action | Fichier | Statut |
|--------|---------|--------|
| Créer `dependabot.yml` | `.github/dependabot.yml` | ☐ |
| Job `npm audit` server + frontend | `.github/workflows/ci.yml` | ☐ |
| Documenter politique versions Node | `server/package.json` engines | ☐ |
