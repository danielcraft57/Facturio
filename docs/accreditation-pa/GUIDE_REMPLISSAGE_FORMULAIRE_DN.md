# Guide de remplissage — formulaire Démarches Numériques (PA)

**Dernière mise à jour** : juin 2026  
**Produit** : PrestaFacture — https://prestafacture.com  
**Démarche officielle PA DGFiP** : https://demarche.numerique.gouv.fr/commencer/immatpdp

---

## ALERTE — Vérifie que tu es sur la bonne démarche

### Bonne démarche (Plateforme Agréée e-facture DGFiP)

Titre attendu : **« Facturation électronique — demande d'immatriculation pour agir en qualité de plateforme agréée »**

Pièces typiques demandées :

- Attestation **ISO/IEC 27001** (obligatoire, pas « en cours »)
- Documentation **RGPD**
- Descriptifs techniques (émission, réception, auth, extraction données, protocole PPF)
- Déclarations engagement **UE** et **annuaire central**
- Kbis / SIREN
- Attestation **régularité fiscale** (< 3 mois)
- SecNumCloud (si hébergeur cloud)

### Signaux d'alerte (probable mauvaise démarche)

Si tu vois en priorité :

- « Plateforme de **mise en relation** électronique » (VTC, livraison, travailleurs indépendants)
- **Charte de déontologie** + homologation DGT
- **Attestation de vigilance URSSAF** comme pièce centrale
- **Déclaration de chiffre d'affaires** + **RC Pro** dans un dossier « social »

→ Ce n'est **probablement pas** l'immatriculation PA facturation électronique. **Ne dépose pas** avant d'avoir vérifié l'URL et le titre de la démarche.

---

## Faut-il un autre SIRET pour prestafacture.com ?

**Non.** `prestafacture.com` est l'**URL du service**, pas une entreprise séparée.

| Élément | Valeur |
|---------|--------|
| Entité immatriculée | **Loïc DANIEL** — micro-entreprise **DanielCraft** |
| SIREN | **823 417 050** |
| SIRET | **823 417 050 000 23** |
| Site produit | **https://prestafacture.com** |
| Site éditeur | **https://danielcraft.fr** |

Une micro-entreprise = **un seul SIRET**. Pas de SIRET distinct pour le sous-domaine PrestaFacture.

### SIRET affiché 842 541 129 00018 sur ta capture

Ce SIREN (**842 541 129**) et l'adresse **La Guerche-de-Bretagne** ne correspondent **pas** aux données PrestaFacture / DanielCraft du dépôt (`823 417 050`, Metz).

**Action immédiate** : vérifier sur [avis-situation-sirene.insee.fr](https://avis-situation-sirene.insee.fr/) quel est ton établissement **actif** :

- Si tu es bien à **Metz** → corriger le formulaire avec **823 417 050 000 23**
- Si tu as **déménagé** et l'INSEE affiche la Guerche → utiliser le SIRET INSEE **à jour**, et **aligner** partout (site PrestaFacture, mentions légales, Kbis)

---

## Partie 1 — Identification entreprise (valeurs cibles)

| Champ formulaire | Valeur à renseigner | Notes |
|------------------|---------------------|-------|
| Entreprise établie en France | **Oui** | |
| **SIREN** | **823417050** | 9 chiffres, sans espaces si le champ l'exige |
| **SIRET** | **82341705000023** | 14 chiffres |
| Dénomination / nom | **Loïc DANIEL** | Repris sur Kbis micro-entreprise |
| Nom commercial | **DanielCraft** | Enseigne |
| Forme juridique | Micro-entreprise / entreprise individuelle | |
| Adresse siège | **57000 Metz, France** | **À confirmer sur Kbis INSEE actuel** |
| Code APE | Vérifier INSEE (souvent **6201Z** dev/logiciel, pas 7311Z pub) | Corriger si INSEE différent |
| **Email entreprise** (contact public, publié impots.gouv.fr) | **contact@prestafacture.com** si la boîte existe, sinon **contact@danielcraft.fr** | Générique, pas un prénom |
| **Email authentification PPF** | **ppf-auth@prestafacture.com** (ou `@danielcraft.fr`) | **Différent** du contact public ; **sans** nom/prénom ; confidentiel |
| Téléphone | **03 87 78 09 16** | Aligné mentions légales PrestaFacture |
| **URL site / service** | **https://prestafacture.com** | URL du SaaS PA |
| URL éditeur (si champ séparé) | **https://danielcraft.fr** | |

---

## Partie 2 — Représentant légal

| Champ | Valeur |
|-------|--------|
| Qualité | **Représentant légal** (pas mandataire sauf si délégation) |
| Nom | **DANIEL** |
| Prénom | **Loïc** |
| Email | **contact@danielcraft.fr** ou **loic@danielcraft.fr** |
| Téléphone | **03 87 78 09 16** |
| Pièce d'identité | CNI ou passeport (scan PDF) |

Si mandataire : pouvoir signé + CNI mandataire.

---

## Partie 3 — Pièces à joindre (immatpdp DGFiP)

Fichiers prêts dans [`annexes/pieces-depot/`](./annexes/pieces-depot/README.md).

| Pièce | Fichier source | Statut |
|-------|----------------|--------|
| Kbis < 3 mois | INSEE / Infogreffe | **À télécharger toi-même** |
| Attestation régularité fiscale | impots.gouv.fr espace pro | **À télécharger** |
| ISO 27001 | Certificateur | **Bloquant — pas encore obtenue** |
| Sécurité RGPD art. 32 | `01-securite-donnees-personnelles-rgpd.md` | Brouillon à signer PDF |
| Descriptif émission / réception | `02-descriptif-emission-reception.md` | Brouillon |
| Descriptif authentification | `03-descriptif-authentification.md` | Brouillon |
| Extraction / transmission données | `04-descriptif-extraction-transmission.md` | Brouillon |
| Protocole communication sécurisé | `05-protocole-communication-ppf.md` | Brouillon — à finaliser avec specs PPF |
| Engagement hébergement UE | `06-declaration-hebergement-ue.md` | À signer |
| Déclaration annuaire central | `07-declaration-annuaire-central.md` | À signer |
| SecNumCloud | ANSSI / hébergeur | Si cloud ; sinon justifier infra on-prem UE |
| Tests interop PPF | — | **Après** validation dossier (3 mois) |
| Rapport audit conformité | — | **Sous 1 an** après immatriculation |

### Convention de nommage (guide DGFiP déc. 2025)

`DanielCraft – Nom de la pièce – AAAAMM.pdf`  
Ex. : `DanielCraft – Descriptif emission reception – 202606.pdf`

Tous les PDF : **français**, **signés électroniquement** (niveau **avancé 2** minimum).

---

## Cohérence avec le site prestafacture.com

Ce que le site dit aujourd'hui (juin 2026) :

- PrestaFacture = facturation dev, conformité 2026, export Factur-X XML
- **PA partenaire en déploiement** — pas encore PA immatriculée
- Pas de promesse de transmission PA active

C'est **cohérent** pour un dossier en préparation. Après immatriculation, mettre à jour les textes marketing.

---

## Checklist avant clic « Déposer »

- [ ] URL = `demarche.numerique.gouv.fr/commencer/immatpdp`
- [ ] SIRET = celui de l'**INSEE à jour** (vérifier 823… vs 842…)
- [ ] Deux emails distincts (contact public + auth PPF)
- [ ] Certificat ISO 27001 **valide** joint
- [ ] Tous les PDF signés électroniquement
- [ ] Kbis et attestation fiscale < 3 mois
