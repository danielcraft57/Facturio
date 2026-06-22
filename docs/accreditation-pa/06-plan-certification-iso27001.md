# Plan de certification ISO/IEC 27001

> Prérequis **obligatoire** pour une immatriculation en Plateforme Agréée (certificat valide ; certification « en cours » non recevable selon le guide DGFiP).

## Objectif

Obtenir une certification **ISO/IEC 27001** couvrant le périmètre :

- Développement et exploitation de **PrestaFacture** (SaaS).
- Traitement des données de facturation et des flux e-invoicing.

## Phases indicatives

| Phase | Durée | Actions |
|-------|-------|---------|
| **0. Cadrage** | 1–2 mois | Périmètre ISMS, analyse de risques, politique sécurité |
| **1. Mise en place** | 3–6 mois | Procédures, contrôle d’accès, sauvegardes, gestion incidents |
| **2. Audit interne** | 1 mois | Écarts, plan d’action |
| **3. Certification** | 2–3 mois | Organisme accrédité (AFNOR, Bureau Veritas, etc.) |
| **4. Maintien** | Annuel | Surveillance, renouvellement |

## Budget indicatif (ordre de grandeur)

| Poste | Fourchette |
|-------|------------|
| Accompagnement consultant | 15–40 k€ |
| Audit certification initial | 8–20 k€ |
| Outils (SIEM, pentest) | 2–10 k€/an |
| **Total première année** | **25–70 k€** |

## Actions court terme (sans attendre ISO)

1. Registre des traitements RGPD (modèle CNIL).
2. Politique de mots de passe et accès admin.
3. Sauvegardes automatisées PostgreSQL production.
4. Pentest applicatif avant connexion PA production.
5. Procédure gestion des vulnérabilités (Dependabot, npm audit en CI).

## Alternative

Tant que la certification n’est pas obtenue : **ne pas déposer** de candidature PA propre ; privilégier [08-piste-pa-partenaire.md](./08-piste-pa-partenaire.md).

## Suivi

| Jalon | Date cible | Statut |
|-------|------------|--------|
| Choix organisme certificateur | _À planifier_ | ☐ |
| Analyse de risques v1 | _À planifier_ | ☐ |
| Audit blanc | _À planifier_ | ☐ |
| Certification ISO 27001 | _À planifier_ | ☐ |
