# Politique de sécurité de l'information — DanielCraft / Facturio

**Version** : 0.1 (brouillon)  
**Date d'approbation** : _À compléter_  
**Signataire** : Loïc DANIEL — Dirigeant / RSSI  
**Diffusion** : interne DanielCraft  
**Prochaine revue** : _À compléter (annuelle)_

---

## 1. Engagement de la direction

Loïc DANIEL, en tant que dirigeant de DanielCraft, s'engage à :

- protéger la confidentialité, l'intégrité et la disponibilité des informations traitées par Facturio ;
- respecter les obligations légales (RGPD, réforme facturation électronique) ;
- maintenir et améliorer en continu le ISMS conforme à **ISO/IEC 27001:2022** ;
- allouer les ressources nécessaires à la sécurité (temps, budget formation, outils).

## 2. Objectifs de sécurité (indicateurs à préciser)

| Objectif | Indicateur cible | Échéance |
|----------|------------------|----------|
| Disponibilité service Facturio | Uptime _À définir_ % | _À compléter_ |
| Sauvegardes BDD | Quotidienne + 1 test restauration / an | _À compléter_ |
| Incidents sécurité majeurs | Notification CNIL si requis < 72 h | Permanent |
| Vulnérabilités critiques | Correction < _X_ jours | _À compléter_ |
| Accès privilégiés | Revue trimestrielle documentée | Trimestriel |

## 3. Périmètre

Voir [PERIMETRE_ISMS.md](./PERIMETRE_ISMS.md).

## 4. Principes

1. **Minimisation** : ne collecter que les données nécessaires à la facturation et au service.
2. **Isolation** : séparation multi-tenant par organisation (`organizationId`).
3. **Chiffrement** : TLS en transit ; secrets sensibles chiffrés au repos (`SECRETS_ENCRYPTION_KEY`).
4. **Traçabilité** : journalisation des actions sensibles et des flux e-facture (à renforcer).
5. **Défense en profondeur** : auth forte, validation entrées, rate limiting, sauvegardes.
6. **Amélioration continue** : revues, audits internes, actions correctives.

## 5. Rôles et responsabilités

| Rôle | Responsable | Missions |
|------|-------------|----------|
| RSSI | Loïc DANIEL | ISMS, risques, incidents, relation certificateur |
| DPO (contact) | Loïc DANIEL | RGPD, registre, DPIA si besoin |
| Exploitation | Loïc DANIEL | Prod, sauvegardes, déploiements |
| Développement | Loïc DANIEL | Code sécurisé, revues, CI |

## 6. Référentiel documentaire

| Document | Référence |
|----------|-----------|
| Registre des risques | [REGISTRE_RISQUES.md](./REGISTRE_RISQUES.md) |
| Déclaration d'applicabilité | [SOA_DECLARATION_APPLICABILITE.md](./SOA_DECLARATION_APPLICABILITE.md) |
| Procédures | [procedures/](./procedures/) |
| Plan PRA | [PLAN-PRA-001.md](./PLAN-PRA-001.md) |
| Registre RGPD | [REGISTRE_TRAITEMENTS_RGPD.md](./REGISTRE_TRAITEMENTS_RGPD.md) |

## 7. Non-conformités et sanctions

Toute violation de cette politique fait l'objet d'une analyse d'incident ([PROC-INC-001](./procedures/PROC-INC-001-incidents.md)) et de mesures correctives.

## 8. Approbation

| Nom | Fonction | Date | Signature |
|-----|----------|------|-----------|
| Loïc DANIEL | Dirigeant / RSSI | _À compléter_ | _À compléter_ |
