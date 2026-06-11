# PROC-INC-001 — Gestion des incidents de sécurité

**Version** : 0.1  
**Propriétaire** : Loïc DANIEL — RSSI  
**Contact** : contact@danielcraft.fr

---

## 1. Définition

Incident de sécurité : tout événement compromettant ou menaçant la confidentialité, l'intégrité ou la disponibilité des données ou services Facturio.

Exemples : fuite de données, compromission compte admin, ransomware, faille exploitée, perte de backups.

## 2. Classification

| Niveau | Critères | Délai réponse |
|--------|----------|---------------|
| **Critique** | Fuite données perso, service down prod, accès non autorisé confirmé | < 1 h |
| **Majeur** | Vulnérabilité critique non exploitée, dégradation service | < 4 h |
| **Mineur** | Tentative bloquée, anomalie sans impact | < 24 h |

## 3. Procédure

1. **Détection** : monitoring, utilisateur, audit, alerte CI.
2. **Containment** : isoler système, révoquer accès, couper exposition si besoin.
3. **Analyse** : cause, périmètre, données affectées.
4. **Correction** : patch, restauration backup, rotation secrets.
5. **Notification** :
   - Utilisateurs affectés si risque pour leurs données
   - **CNIL** sous 72 h si violation données personnelles à risque
6. **Clôture** : rapport incident, actions correctives, mise à jour registre risques.

## 4. Modèle rapport incident

| Champ | Valeur |
|-------|--------|
| ID incident | INC-YYYY-MM-DD-NN |
| Date détection | |
| Niveau | |
| Description | |
| Données concernées | |
| Actions prises | |
| Notification CNIL (Oui/Non) | |
| Date clôture | |
| Leçons apprises | |

## 5. Registre incidents

| ID | Date | Niveau | Résumé | Statut |
|----|------|--------|--------|--------|
| _Aucun à ce jour_ | | | | |
