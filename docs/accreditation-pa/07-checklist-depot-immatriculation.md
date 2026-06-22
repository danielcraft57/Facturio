# Checklist — dépôt immatriculation Plateforme Agréée

Référence : [demarche.numerique.gouv.fr/commencer/immatpdp](https://demarche.numerique.gouv.fr/commencer/immatpdp)  
Guide : [PDF impots.gouv.fr](https://www.impots.gouv.fr/sites/default/files/media/1_metier/2_professionnel/EV/2_gestion/290_facturation_electronique/guide_utilisateur_fe_ds_immatriculation_pdp.pdf)

## Avant de commencer

- [ ] Décision formelle : immatriculation **PA DanielCraft** validée (vs PA partenaire uniquement)
- [ ] Budget et délai acceptés (12–24 mois, ISO 27001, audits)
- [ ] **Certificat ISO/IEC 27001** obtenu (non négociable pour dépôt)

## Identité et administratif

- [ ] Kbis / extrait INSEE **&lt; 3 mois**
- [ ] SIRET : 823 417 050 000 23
- [ ] Identité représentant légal (Loïc DANIEL)
- [ ] Coordonnées : contact@danielcraft.fr, 03 87 78 09 16
- [ ] Adresse : 57000 Metz, France

## Juridique & RGPD

- [ ] Politique de confidentialité à jour (PrestaFacture + danielcraft.fr)
- [ ] Mentions légales et CGU/CGV
- [ ] Registre des activités de traitement
- [ ] Analyse d’impact (AIPD) si traitements à risque
- [ ] DPA sous-traitants (hébergeur, Stripe, PA test…)

## Technique

- [ ] Description des services d’**émission** et de **réception** ([04-dossier-technique-facturio.md](./04-dossier-technique-facturio.md))
- [ ] Schéma d’architecture ([03-architecture-solution-compatible.md](./03-architecture-solution-compatible.md))
- [ ] Protocoles d’authentification et chiffrement (HTTPS TLS 1.2+, secrets chiffrés)
- [ ] Procédure d’extraction des données pour l’administration
- [ ] Plan de tests d’**interopérabilité PPF**
- [ ] Plan de tests avec **une autre PA**

## Hébergement

- [ ] Nom et adresse de l’hébergeur PrestaFacture production
- [ ] Localisation des datacenters (**UE**)
- [ ] Engagement non-transfert hors UE (ou clauses types)
- [ ] **SecNumCloud** si hébergement cloud tiers requis

## Sécurité

- [ ] Certificat **ISO 27001** (copie PDF)
- [ ] Rapport d’audit de conformité (sous 12 mois post-immatriculation si demandé après)
- [ ] Procédure gestion des incidents
- [ ] PRA / sauvegardes documentés

## Après dépôt

- [ ] Suivi dossier DGFiP
- [ ] Tests interop PPF (sandbox)
- [ ] Tests interop PA tierce
- [ ] Immatriculation valable **3 ans** — calendrier renouvellement

## Pièces produites dans ce dépôt

- [x] Synthèse exécutive
- [x] Identité DanielCraft
- [x] Architecture & technique PrestaFacture
- [x] Sécurité / RGPD
- [x] Plan ISO 27001
- [ ] Kbis, ISO, contrats hébergeur — **à ajouter dans `annexes/pieces-jointes/`** (non versionnées si sensibles)

> Créer le dossier `annexes/pieces-jointes/` localement pour les PDF officiels ; ne pas committer de documents confidentiels sans chiffrement.
