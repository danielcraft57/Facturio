# Registre des activités de traitement — DanielCraft / Facturio

**Version** : 0.1 (brouillon — modèle CNIL)  
**Responsable de traitement** : Loïc DANIEL — DanielCraft  
**DPO / contact** : contact@danielcraft.fr  
**Dernière mise à jour** : _À compléter_

---

## Traitement T-001 — Comptes utilisateurs Facturio

| Champ | Valeur |
|-------|--------|
| Finalité | Création et gestion des comptes SaaS Facturio |
| Base légale | Exécution du contrat (CGU/CGV) |
| Catégories de données | Identité, email, mot de passe (hash), organisation, consentements |
| Personnes concernées | Utilisateurs inscrits |
| Destinataires | DanielCraft ; Stripe (abonnement) |
| Transferts hors UE | _À vérifier (Stripe)_ |
| Durée conservation | Durée du compte + obligations légales |
| Mesures sécurité | Auth JWT, bcrypt, chiffrement secrets si clé définie |
| Sous-traitants | Stripe (plateforme), _hébergeur_, _SMTP_ |

## Traitement T-002 — Données saisies par les prestataires sur leurs clients

| Champ | Valeur |
|-------|--------|
| Finalité | Facturation (devis, factures, emails, paiements) |
| Base légale | **Responsable = l'utilisateur prestataire** ; Facturio = sous-traitant technique |
| Catégories de données | Clients finaux : nom, email, adresse, SIREN, factures |
| Personnes concernées | Clients des prestataires Facturio |
| Destinataires | Prestataire ; Stripe (paiement facture si activé) |
| Durée conservation | _À définir contractuellement + export/suppression compte_ |
| Mesures sécurité | Isolation `organizationId`, export/suppression RGPD partielle |
| DPA | À fournir aux utilisateurs (sous-traitant Facturio) |

## Traitement T-003 — Paiements abonnement Facturio

| Champ | Valeur |
|-------|--------|
| Finalité | Facturation des plans Pro / Pro+e-facture |
| Base légale | Contrat |
| Données | Email, identifiants Stripe, historique abonnement |
| Sous-traitant | Stripe (plateforme) — DPA Stripe |
| Statut DPA | ☐ À archiver |

## Traitement T-004 — Prospection (ProspectLab)

| Champ | Valeur |
|-------|--------|
| Finalité | Import prospects pour utilisateurs Pro |
| Responsable | Utilisateur prestataire (licéité des listes) |
| Sous-traitant | ProspectLab — DPA ☐ |
| Mesures | Token chiffré si `SECRETS_ENCRYPTION_KEY` |

## Traitement T-005 — Facturation électronique (futur PA)

| Champ | Valeur |
|-------|--------|
| Finalité | Émission / réception factures B2B, e-reporting |
| Base légale | Obligation légale + contrat |
| Données | Factures structurées, SIREN/SIRET, statuts PA, journaux transmission |
| Destinataires | Réseau PA / DGFiP (PPF) |
| Durée | Archivage légal factures |
| Statut | ☐ À compléter à l'immatriculation PA |

---

## Sous-traitants — suivi DPA

| Sous-traitant | Service | DPA obtenu | Date | Fichier |
|---------------|---------|------------|------|---------|
| Stripe | Paiements | ☐ | | `annexes/pieces-jointes/dpa/` |
| _SMTP_ | Email | ☐ | | |
| ProspectLab | Prospection | ☐ | | |
| _Hébergeur_ | Infra | ☐ | | |

---

## Droits des personnes

| Droit | Mise en œuvre Facturio | Statut |
|-------|------------------------|--------|
| Accès | Export compte `GET /gdpr/export` | ✅ Partiel |
| Effacement | `POST /gdpr/delete-account` | ✅ Partiel |
| Portabilité | Export JSON | ✅ Partiel |
| Rectification | UI profil / clients | ✅ |
| Opposition | _À documenter_ | ☐ |
