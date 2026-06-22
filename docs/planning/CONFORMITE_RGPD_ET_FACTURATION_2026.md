# Conformité RGPD et réforme facturation 2026

Audit fonctionnel de PrestaFacture (mai 2026) : devis, factures, clients, emails, paiements Stripe, prospection, et alignement avec la **réforme de facturation électronique B2B** (sept. 2026 / sept. 2027).

**Statut global** : partiellement conforme pour un usage interne / beta ; **écarts importants** avant commercialisation large ou traitement de données clients tiers à grande échelle.

**Voir aussi** : [FACTURATION_ELECTRONIQUE_2026.md](./FACTURATION_ELECTRONIQUE_2026.md), [MONETISATION.md](./MONETISATION.md), pages légales site `/privacy`, `/terms`.

---

## Synthèse exécutive

| Domaine | État | Priorité |
|---------|------|----------|
| Séparation Stripe plateforme / prestataire | Implémenté (mai 2026) | — |
| Registre / politique confidentialité produit | Pages marketing, pas registre technique | Haute |
| Droits des personnes (accès, effacement, portabilité) | Non automatisés dans l’app | Haute |
| Facturation électronique 2026 (Factur-X, PA) | Non implémenté | Haute (calendrier légal) |
| Mentions légales PDF / emails | Partiel (profil org + env) | Moyenne |
| Conservation / suppression données | Non documentée ni automatisée | Moyenne |
| Chiffrement secrets Stripe en BDD | Implémenté (`SECRETS_ENCRYPTION_KEY`, préfixe `enc:v1:`) | Moyenne (rotation clé) |
| Sous-traitants (Stripe, SMTP, ProspectLab) | DPA à formaliser | Haute |

---

## 1. Rôles RGPD

| Acteur | Rôle typique | Données concernées |
|--------|--------------|-------------------|
| **DanielCraft / éditeur PrestaFacture** | Responsable de traitement pour les comptes utilisateurs PrestaFacture ; sous-traitant possible pour les données que les prestataires saisissent sur leurs clients | Compte, org, logs, abonnement SaaS |
| **Prestataire utilisateur PrestaFacture** | Responsable de traitement pour **ses** clients finaux (factures, devis, emails) | Clients, factures, devis, paiements |
| **Stripe (prestataire)** | Sous-traitant du **prestataire** pour le paiement des factures | Données carte, IP, métadonnées facture |
| **Stripe (plateforme)** | Sous-traitant de **PrestaFacture** pour l’abonnement Pro | Email, customer id, abonnement |

**Principe retenu (mai 2026)** : deux circuits Stripe distincts :

1. **`.env` (STRIPE_* )** → abonnement PrestaFacture (Pro / Pro+e-facture) uniquement. Webhook : `POST /api/webhooks/stripe/platform`.
2. **BDD `Organization.invoiceStripe*`** → paiement des factures par les clients du prestataire. Webhook : `POST /api/webhooks/stripe/invoices/:organizationId`.

Cela limite le mélange des flux et clarifie qui est responsable vis-à-vis du payeur final.

---

## 2. Fonctionnalités auditées

### 2.1 Comptes et organisations

| Point | Conforme ? | Détail |
|-------|------------|--------|
| Données minimales à l’inscription | Oui | Cases CGU + confidentialité obligatoires ; horodatage `termsAcceptedAt` / `privacyConsentAt` |
| Isolation multi-tenant | Oui | `organizationId` sur les entités métier |
| Export / suppression compte | Partiel | `GET /gdpr/export` + `POST /gdpr/delete-account` (Paramètres) |
| Clés Stripe org en BDD | Partiel | Stockées par org ; **chiffrées** si `SECRETS_ENCRYPTION_KEY` défini (sk_/whsec_) ; publishable en clair |

**Actions** : définir `SECRETS_ENCRYPTION_KEY` en production ; endpoint export + suppression avec délai de grâce ; journal des accès admin.

### 2.2 Clients (CRM)

| Point | Conforme ? | Détail |
|-------|------------|--------|
| Base légale | À documenter | Le prestataire doit avoir une base légale (contrat, intérêt légitime) pour traiter ses clients |
| Champs sensibles | OK si limité | Nom, email, adresse, SIRET — pas de catégories particulières prévues |
| Prospection / ProspectLab | Attention | Import externe : le prestataire doit avoir un fondement (opt-in B2B, intérêt légitime encadré) ; PrestaFacture ne vérifie pas la licéité de la source |
| Droit d’accès / rectification | Manuel | Possible via UI client ; pas de portail « demande RGPD » |

**Actions** : mention dans l’UI prospection « vous êtes responsable de la licéité de vos listes » ; API export client CSV ; lien politique confidentialité du prestataire sur emails (champ org optionnel).

### 2.3 Devis

| Point | Conforme ? | Détail |
|-------|------------|--------|
| Contenu PDF / email | Partiel | Mentions via profil org ; pas de bloc « données personnelles » dédié |
| Lien public / token | Partiel | Accès par token opaque ; pas d’expiration configurable documentée |
| E-facture 2026 | Non | Les devis ne sont pas des factures électroniques ; pas d’impact PA direct, mais conservation 10 ans recommandée côté métier |
| Quota plan Free | Non appliqué aux devis | Seules les **factures** sont quotaées aujourd’hui |

**Actions** : expiration token configurable ; horodatage envoi ; archivage ; aligner quotas si abus (option produit).

### 2.4 Factures

| Point | Conforme ? | Détail |
|-------|------------|--------|
| Mentions légales FR | Partiel | SIRET, TVA, adresse via profil org — l’utilisateur doit compléter |
| Numérotation / chronologie | À auditer code | Vérifier unicité et continuité (obligation comptable) |
| Envoi email | Partiel | Tracking ouverture possible — informer dans privacy |
| Page publique `/facture/:token` | Partiel | Expose montants et identité client ; token = secret partagé — OK si HTTPS |
| Paiement Stripe org | Oui (architecture) | Clé publishable renvoyée au front ; secret jamais exposé ; webhook par org |
| Facturation électronique B2B | **Partiel** | Rapport conformité + XML pré-Factur-X ; pas de transmission PA — réseau réglementaire non couvert seul |

**Actions** : voir [FACTURATION_ELECTRONIQUE_2026.md](./FACTURATION_ELECTRONIQUE_2026.md) ; jusqu’à intégration PA, afficher avertissement « PDF + email ne suffisent pas pour toutes les obligations sept. 2026 ».

### 2.5 Paiements et Stripe

| Circuit | Données | RGPD |
|---------|---------|------|
| Abonnement PrestaFacture | Email org, customer Stripe plateforme | DPA Stripe + privacy PrestaFacture |
| Paiement facture client | Métadonnées facture, montant ; carte chez Stripe | DPA entre **prestataire** et Stripe ; PrestaFacture = outil |

**Points conformes** :
- Secrets prestataire masqués dans l’API profil (`invoiceStripeSecretKeySet`, preview pk_…).
- Webhooks séparés plateforme / organisation.

**Écarts** :
- Sans `SECRETS_ENCRYPTION_KEY`, les secrets restent en clair (dev).
- Pas d’UI pour informer le payeur final du sous-traitant Stripe (mention légale checkout).
- Logs serveur peuvent contenir IDs Stripe — politique de rétention logs à définir.

### 2.6 Emails (SMTP)

| Point | Conforme ? | Détail |
|-------|------------|--------|
| Contenu facture/devis | Données personnelles du destinataire | Le prestataire est responsable ; PrestaFacture envoie en son nom (MAIL_FROM_*) |
| Liens tracking | Si activé | Mentionner dans privacy prestataire + PrestaFacture |
| Conservation logs SMTP | Hors app | Dépend de l’hébergeur mail |

### 2.7 Prospection (ProspectLab)

| Point | Conforme ? | Détail |
|-------|------------|--------|
| Transfert vers API tierce | Oui | Clé `PROSPECTLAB_API_KEY` — sous-traitant à déclarer |
| Données entreprises | Souvent B2B | Moins sensible que particuliers ; email dirigeant = donnée perso si identifiant personne physique |

**Actions** : DPA ProspectLab ; garde plan FREE sur prospection (prévu MONETISATION).

### 2.8 Site marketing / légal

| Page | État |
|------|------|
| `/privacy` | Contenu structuré (sous-traitants, droits, sécurité) — validation juriste recommandée |
| `/terms` | Présente |
| `/legal` | Mentions légales éditeur |

**Écart** : les pages ne décrivent pas encore explicitement la **double Stripe** ni la liste des sous-traitants à jour.

---

## 3. Réforme facturation électronique 2026–2027

Référence complète : [FACTURATION_ELECTRONIQUE_2026.md](./FACTURATION_ELECTRONIQUE_2026.md).

| Exigence | PrestaFacture aujourd’hui | Cible |
|----------|----------------------|-------|
| Réception factures électroniques (sept. 2026) | Non | Intégration PA partenaire |
| Émission ETI/GE (sept. 2026) | Non | Factur-X + envoi PA |
| Émission PME/micro (sept. 2027) | Non | Idem |
| E-reporting | Non | Via PA |
| Conservation 10 ans | PDF local / BDD | Archivage + horodatage + export |
| Piste d’audit | Partielle (events facture) | Journal immuable |

**Plan produit** : palier **Pro + e-facture** (Stripe plateforme) débloque le module PA quand disponible ; ne pas promettre conformité totale sur le site tant que le module n’est pas livré.

---

## 4. Plan d’action priorisé

### Court terme (avant beta publique)

1. Mettre à jour `/privacy` : sous-traitants (Stripe×2, SMTP, hébergeur, ProspectLab), durées conservation, contact DPO.
2. ~~Chiffrer `invoiceStripeSecretKey` / webhook~~ → fait ; activer la clé en prod.
3. Webhooks Stripe documentés dans `server/env.example` et UI Paramètres.
4. Avertissement in-app si org FR assujettie TVA et pas de module e-facture (bannière settings).

### Moyen terme

5. ~~Endpoints RGPD export / suppression~~ → fait ; ajouter registre des traitements interne.
6. Expiration / révocation tokens publics facture/devis.
7. Registre des traitements (document interne DanielCraft).
8. Garde-fous plan FREE (prospection, exports).

### Long terme (conformité réforme)

9. Intégration PA partenaire (solution compatible).
10. Génération Factur-X / statuts lifecycle facture électronique.
11. E-reporting selon périmètre utilisateur.

---

## 5. Configuration technique (rappel)

### Stripe plateforme (`.env`)

```env
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...   # webhook /api/webhooks/stripe/platform
```

### Stripe prestataire (Paramètres → Stripe factures)

- `invoiceStripePublishableKey`, `invoiceStripeSecretKey`, `invoiceStripeWebhookSecret`
- URL webhook affichée : `/api/webhooks/stripe/invoices/{organizationId}`

### Abonnement Pro

- `POST /api/billing/checkout` → Checkout Stripe plateforme
- Webhook met à jour `saasPlan`, `stripeCustomerId`, `stripeSubscriptionId`

---

## 6. Checklist développeur (PR)

- [ ] Aucune clé secrète prestataire dans les logs ou réponses API
- [ ] Paiement facture n’utilise **pas** `STRIPE_SECRET_KEY` du `.env`
- [ ] Abonnement PrestaFacture n’utilise **pas** `invoiceStripeSecretKey` org
- [ ] Nouvelle donnée perso : filtrage par `organizationId`
- [ ] Mention réforme 2026 si feature « e-facture » affichée au marketing

---

*Document vivant — dernière mise à jour : mai 2026. Ne constitue pas un avis juridique ; faire valider par un conseil si commercialisation.*
