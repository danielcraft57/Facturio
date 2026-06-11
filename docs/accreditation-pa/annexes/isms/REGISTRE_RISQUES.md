# Registre des risques — ISMS Facturio

**Version** : 0.1  
**Dernière mise à jour** : _À compléter_  
**Responsable** : Loïc DANIEL — RSSI

---

## Légende

| Probabilité / Impact | 1 | 2 | 3 | 4 | 5 |
|----------------------|---|---|---|---|---|
| **1** — Très faible | | | | | |
| **5** — Très élevé | | | | | |

**Criticité** = Probabilité × Impact. Traitement : **Réduire** · **Transférer** · **Accepter** · **Éviter**

---

## Registre

| ID | Menace / risque | Actif concerné | P | I | Crit. | Mesures existantes | Traitement | Actions | Responsable | Échéance | Statut |
|----|-----------------|----------------|---|---|-------|-------------------|------------|---------|-------------|----------|--------|
| R-001 | Fuite données clients / factures | BDD PostgreSQL | _ | _ | _ | Multi-tenant, auth JWT | Réduire | Pentest, chiffrement au repos BDD si besoin | Loïc DANIEL | _ | ☐ |
| R-002 | Compromission compte admin | Comptes utilisateurs | _ | _ | _ | bcrypt, HTTP-only cookie | Réduire | 2FA admin, journal accès | Loïc DANIEL | _ | ☐ |
| R-003 | Perte données (panne disque) | BDD prod | _ | _ | _ | Sauvegardes manuelles doc | Réduire | Sauvegardes auto + test restauration | Loïc DANIEL | _ | ☐ |
| R-004 | Indisponibilité service | node10 / API | _ | _ | _ | Monitoring basique | Réduire | PRA documenté, alerting | Loïc DANIEL | _ | ☐ |
| R-005 | Vulnérabilité dépendances (npm) | Code applicatif | _ | _ | _ | CI tests | Réduire | Dependabot + npm audit CI | Loïc DANIEL | _ | ☐ |
| R-006 | Fuite clés Stripe org | Secrets BDD | _ | _ | _ | AES-256-GCM si clé définie | Réduire | Vérifier `SECRETS_ENCRYPTION_KEY` prod | Loïc DANIEL | _ | ☐ |
| R-007 | Non-conformité e-facture / rejet PA | Flux e-invoicing | _ | _ | _ | Score conformité, XML | Réduire | Factur-X officiel, tests interop PPF | Loïc DANIEL | _ | ☐ |
| R-008 | Sous-traitant non conforme RGPD | Stripe, SMTP, etc. | _ | _ | _ | Pages légales | Transférer | DPA signés | Loïc DANIEL | _ | ☐ |
| R-009 | Ransomware / intrusion SSH | Serveur prod | _ | _ | _ | _À documenter_ | Réduire | Durcissement SSH, clés, pare-feu | Loïc DANIEL | _ | ☐ |
| R-010 | Défaillance immatriculation PA | Projet PA | _ | _ | _ | Dossier en préparation | Réduire | ISO 27001 + interop sandbox | Loïc DANIEL | _ | ☐ |
| R-011 | _À ajouter_ | | | | | | | | | | ☐ |

---

## Revues du registre

| Date | Participants | Synthèse | Prochaine revue |
|------|--------------|----------|-----------------|
| _À compléter_ | Loïc DANIEL | Création v0.1 | _À compléter_ |
