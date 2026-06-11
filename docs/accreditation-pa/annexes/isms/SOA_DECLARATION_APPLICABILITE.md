# Déclaration d'applicabilité (SoA) — ISO/IEC 27001:2022

**Version** : 0.1 (brouillon)  
**Périmètre** : [PERIMETRE_ISMS.md](./PERIMETRE_ISMS.md)  
**Dernière mise à jour** : _À compléter_

> Référence contrôles : ISO/IEC 27002:2022 (Annexe A de la 27001).  
> Compléter chaque ligne avec : **Applicable** (Oui/Non), **Justification**, **Mesure / procédure**, **Statut**.

---

## Contrôles organisationnels (extrait — à compléter avec consultant)

| Réf. | Thème | Applicable | Justification | Mesure Facturio | Statut |
|------|-------|------------|---------------|-----------------|--------|
| 5.1 | Politiques sécurité | Oui | Exigence ISMS | [POLITIQUE_SECURITE.md](./POLITIQUE_SECURITE.md) | 🔄 Brouillon |
| 5.2 | Rôles sécurité | Oui | RSSI nommé | Politique §5 | 🔄 |
| 5.9 | Inventaire actifs | Oui | ISO + PA | [REGISTRE_ACTIFS.md](./REGISTRE_ACTIFS.md) | 🔄 |
| 5.10 | Usage acceptable | Oui | CGU Facturio | Pages légales site | 🔄 |
| 5.15 | Contrôle d'accès | Oui | Multi-tenant | [PROC-ACC-001](./procedures/PROC-ACC-001-gestion-acces.md) | ☐ |
| 5.16 | Gestion identités | Oui | Comptes utilisateurs | Auth JWT + bcrypt | ✅ Partiel |
| 5.17 | Auth | Oui | Connexion sécurisée | [PROC-IAM-001](./procedures/PROC-IAM-001-mots-de-passe.md) | 🔄 |
| 5.23 | Sécurité cloud | _À évaluer_ | Infra on-prem | Fiche infra | ☐ |
| 5.24 | Plan incident | Oui | RGPD 72 h | [PROC-INC-001](./procedures/PROC-INC-001-incidents.md) | ☐ |
| 5.26 | Réponse incident | Oui | Idem | PROC-INC-001 | ☐ |
| 5.28 | Collecte preuves | Oui | PA + litiges | Logs à renforcer | ☐ |
| 5.29 | Continuité TI | Oui | SLA clients | [PLAN-PRA-001.md](./PLAN-PRA-001.md) | ☐ |
| 5.30 | ICT readiness BC | Oui | PRA | PLAN-PRA-001 | ☐ |
| 5.31 | Exigences légales | Oui | RGPD, e-facture | Registre RGPD | 🔄 |
| 5.34 | Protection enregistrements | Oui | Factures 10 ans | Archivage PDF/XML | 🔄 |
| 5.35 | Revue indépendante | Oui | Certification ISO | Audit certificateur | ☐ |
| 8.8 | Gestion vulnérabilités | Oui | npm, deps | [PROC-VUL-001](./procedures/PROC-VUL-001-vulnerabilites.md) | ☐ |
| 8.9 | Gestion config | Oui | Déploiements | [PROC-CHG-001](./procedures/PROC-CHG-001-changements.md) | ☐ |
| 8.13 | Sauvegarde | Oui | BDD prod | [PROC-BKP-001](./procedures/PROC-BKP-001-sauvegardes.md) | ☐ |
| 8.24 | Chiffrement | Oui | TLS + secrets | SecretsCryptoService | ✅ Partiel |

---

## Contrôles non retenus (justifier)

| Réf. | Raison exclusion |
|------|------------------|
| _Exemple : 5.6 Contact autorités_ | _À compléter si non applicable_ |

---

## Validation

| Rôle | Nom | Date | Signature |
|------|-----|------|-----------|
| RSSI | Loïc DANIEL | _À compléter_ | _À compléter_ |
