# PROC-ACC-001 — Gestion des accès

**Version** : 0.1  
**Propriétaire** : Loïc DANIEL — RSSI  
**Fréquence revue** : Trimestrielle

---

## 1. Objectif

Contrôler les accès aux systèmes Facturio (application, serveurs, code, données) selon le principe du moindre privilège.

## 2. Périmètre

- Comptes utilisateurs Facturio (application)
- Accès SSH node10 / node12
- Comptes GitHub, Stripe, fournisseurs
- Comptes administrateur applicatif (si rôle admin existe)

## 3. Création d'accès

| Type | Qui demande | Qui valide | Délai max. |
|------|-------------|------------|------------|
| Utilisateur Facturio | Auto-inscription | CGU acceptées | Immédiat |
| Admin prod SSH | Loïc DANIEL | Loïc DANIEL | Avant besoin |
| Accès GitHub | Collaborateur | Loïc DANIEL | Avant merge |

## 4. Révocation

- Départ / fin de mission : révocation **immédiate** des accès.
- Compte utilisateur : suppression via `POST /gdpr/delete-account` ou désactivation manuelle.

## 5. Revue trimestrielle

Checklist :

- [ ] Liste comptes SSH prod encore nécessaires
- [ ] Collaborateurs GitHub actifs
- [ ] Comptes admin Facturio (si applicable)
- [ ] Clés API Stripe / PA / ProspectLab rotées si besoin

**Compte-rendu** : `revues/REVUE_ACCES_YYYY-MM.md`

## 6. Journalisation

| Action | Journal actuel | Cible PA / ISO |
|--------|----------------|----------------|
| Login utilisateur | _À vérifier_ | Conserver _X_ mois |
| Actions admin | ☐ Non automatisé | Table `AuditLog` à prévoir |
| Déploiement prod | Git + manuel | PROC-CHG-001 |

## 7. Écarts connus / actions

| Écart | Action | Échéance | Statut |
|-------|--------|----------|--------|
| Pas de journal admin centralisé | Modèle Prisma + middleware | _À planifier_ | ☐ |
| MFA admin non activé | Évaluer 2FA comptes critiques | _À planifier_ | ☐ |
