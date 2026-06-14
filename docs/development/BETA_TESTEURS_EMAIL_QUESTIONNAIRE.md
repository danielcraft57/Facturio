# Beta testeurs — email de remerciement et questionnaire

Com' opérée sous **Valentine Coubertain**. L'email de bienvenue part via **SMTP Facturio** (pas Gmail manuel) : template `EmailService.sendBetaTesterWelcome`, déclenché à l'activation du code beta.

Variables serveur (`.env` / prod) :

| Variable | Rôle |
|----------|------|
| `BETA_TESTER_SURVEY_URL` | Lien **public** Google Form (voir ci-dessous) |
| `BETA_TESTER_REPLY_EMAIL` | Reply-to (Gmail Valentine) — sinon `COMPANY_EMAIL` |
| `FRONTEND_URL` | Liens « Ouvrir Facturio » / profil émetteur |

Envoi aux testeurs déjà inscrits : `cd server` → `npm run beta:welcome-emails` (`--dry-run`, `--force`).

## Google Form — rendre le lien public (obligatoire)

**Ne jamais partager de cookies Google** (session, SAPISID, OSID…) : accès complet au compte.

Formulaire édition :  
`https://docs.google.com/forms/d/1J-LBVSTDO-S90EjCgYmZcDvllbH649_E7tFnZ5mU94M/edit`

1. Ouvrir le Form → **Paramètres** (engrenage) → onglet **Réponses**
2. Désactiver « Limiter à 1 réponse » si tu veux des réponses anonymes sans compte Google
3. **Publier** / **Envoyer** → icône lien → s'assurer que **Toute personne disposant du lien** peut répondre (pas « Restreint »)
4. Copier l'URL **viewform** (pas `/edit`) dans `.env` :

```env
BETA_TESTER_SURVEY_URL=https://docs.google.com/forms/d/1J-LBVSTDO-S90EjCgYmZcDvllbH649_E7tFnZ5mU94M/viewform
```

Test : ouvrir l'URL en navigation privée — le formulaire doit s'afficher **sans** demander de connexion Google.

Si tu as déjà collé des cookies dans un chat, va sur [myaccount.google.com/security](https://myaccount.google.com/security) → « Vos appareils » / « Déconnecter les sessions suspectes » par précaution.

Liens utiles à intégrer dans les mails :
- App : https://facturio.danielcraft.fr
- Inscription avec code : https://facturio.danielcraft.fr/signup?beta=CODE
- Tarifs : https://facturio.danielcraft.fr/tarifs
- Prestations / cible : https://facturio.danielcraft.fr/prestations

Remplacez `CODE` par le code campagne réel (ex. `DEV26`).

---

## 1. Email J+0 — automatique (SMTP Facturio)

Déclenché à l'activation du code beta (inscription ou Paramètres → Abonnement).  
Personnalisation : prénom admin, code campagne, plan, date de fin, boutons app + questionnaire.

**Objet :** Bienvenue dans la beta Facturio (3 mois offerts)

Le corps HTML est généré par le serveur (voir `server/src/common/email.service.ts` → `sendBetaTesterWelcome`).

**Relance manuelle** (testeurs déjà inscrits avant cette feature) :

```bash
cd server
npm run beta:welcome-emails -- --dry-run   # aperçu
npm run beta:welcome-emails                # envoi réel
```

---

## 1bis. Ancien modèle Gmail (archive / relance perso)

Si besoin d'un mail manuel depuis Gmail (hors app) :

**Corps (copier-coller Gmail) :**

```
Bonjour [Prénom],

Merci d'avoir activé le programme beta testeurs sur Facturio.

Vous avez 3 mois d'accès complet (équivalent plan Agence) pour tester l'outil en conditions réelles : devis, factures, PDF, paiements Stripe, acomptes, échéancier, exports compta (FEC), score de conformité, export Factur-X (XML).

Ce qui n'est pas encore activé dans l'app (on le dit clairement) : connecteur Plateforme Agréée (aucun envoi PA), e-reporting automatisé, sync bancaire. C'est sur la feuille de route ; la beta sert aussi à prioriser ce qui compte pour vous.

Pour démarrer vite :
1. Complétez votre profil émetteur (SIRET, coordonnées) — indispensable pour des PDF conformes.
2. Créez un devis test, puis une facture (ou acceptez le devis côté client si vous testez le parcours public).
3. Si vous facturez au forfait : testez l'acompte 10 % et, si besoin, le paiement en plusieurs fois.

Votre retour nous aide vraiment. Questionnaire court (5 à 8 min) :
→ [LIEN GOOGLE FORM]

Vous pouvez aussi répondre directement à ce mail (bug, idée, écran confus).

Merci encore,
Valentine Coubertain
Facturio — facturio.danielcraft.fr
```

**Variante si vous ne connaissez pas le prénom :** remplacer par « Bonjour, ».

---

## 2. Email J+7 — relance questionnaire (optionnel)

**Objet :** 2 min pour améliorer Facturio ? (beta testeurs)

```
Bonjour [Prénom],

Vous utilisez Facturio en beta depuis quelques jours. Un retour structuré nous aiderait beaucoup pour la suite du produit.

Questionnaire (5 à 8 min, anonyme si vous préférez) :
→ [LIEN GOOGLE FORM]

Pas le temps ? Une seule phrase par mail suffit : ce qui vous a bloqué, ou ce qui vous a le plus servi.

Merci,
Valentine Coubertain
```

---

## 3. Email fin de beta (J-14 avant expiration) — à envoyer plus tard

**Objet :** Votre accès beta Facturio se termine bientôt

```
Bonjour [Prénom],

Votre accès beta (3 mois, plan Agence) se termine vers le [DATE FIN].

Si Facturio vous a servi au quotidien, le plan Pro (12 €/mois) reprend les fonctions essentielles : https://facturio.danielcraft.fr/tarifs

Dernier retour bienvenu (questionnaire ou mail) — surtout si quelque chose vous a empêché de passer à la facturation réelle.

Merci pour votre temps de test,
Valentine Coubertain
```

---

## 4. Questionnaire Google Form — structure recommandée

**Titre du formulaire :** Facturio — retour beta testeurs (5–8 min)

**Description :**
« Merci de tester Facturio. Vos réponses orientent la roadmap (freelances dev / intégrateurs). Réponses anonymes possibles sauf si vous laissez votre email à la fin. »

**Paramètres Form :**
- Collecter les adresses e-mail : Non (sauf question finale optionnelle)
- Limiter à 1 réponse : Oui (compte Google du répondant)
- Mélanger l'ordre des questions : Non

### Section A — Vous

| # | Type | Question | Options / contraintes |
|---|------|----------|------------------------|
| A1 | Choix unique | Vous êtes plutôt… | Freelance dev / intégrateur · Micro-agence web (2–5) · Autre freelance numérique · Autre (court texte) |
| A2 | Choix unique | Depuis combien de temps utilisez-vous Facturio ? | Moins d'une semaine · 1–2 semaines · 3–4 semaines · Plus d'un mois |
| A3 | Choix unique | Comment avez-vous connu la beta ? | Réseau social · Bouche-à-oreille · DanielCraft / site perso · Recherche Google · Autre |

### Section B — Usage réel

| # | Type | Question | Options |
|---|------|----------|---------|
| B1 | Cases à cocher | Qu'avez-vous déjà fait sur Facturio ? | Compte créé seulement · Devis créé · Devis envoyé au client · Facture créée · Paiement Stripe testé · Acompte 10 % testé · Échéancier testé · Export FEC / compta · Rien de concret encore |
| B2 | Échelle 1–5 | À quel point avez-vous réussi à émettre un premier document (devis ou facture) sans aide ? | 1 = bloqué · 5 = fluide |
| B3 | Paragraphe (optionnel) | Qu'est-ce qui vous a bloqué en premier, si quelque chose vous a bloqué ? | Texte libre |

### Section C — Satisfaction

| # | Type | Question | Options |
|---|------|----------|---------|
| C1 | Échelle 0–10 | Sur une échelle de 0 à 10, recommanderiez-vous Facturio à un collègue freelance ? (NPS) | 0–10 |
| C2 | Échelle 1–5 | Clarté des PDF (devis, factures, acompte, échéancier) | 1–5 |
| C3 | Échelle 1–5 | Parcours paiement client (lien public, Stripe, acompte / mensualités) | 1–5 ou « Non testé » |
| C4 | Échelle 1–5 | Interface générale (navigation, listes, fiches) | 1–5 |

### Section D — Priorités produit

| # | Type | Question | Options |
|---|------|----------|---------|
| D1 | Cases à cocher | Quelles fonctions vous manquent le plus aujourd'hui ? | PA / facturation électronique · E-reporting · Sync bancaire · Time tracking · Mobile · Multi-utilisateurs · Relances auto · Autre |
| D2 | Paragraphe | Une fonctionnalité qui vous ferait utiliser Facturio chaque semaine ? | Texte libre |
| D3 | Choix unique | À la fin des 3 mois beta, envisagez-vous de passer au plan Pro (12 €/mois) ? | Oui · Peut-être · Non · Trop tôt pour dire |

### Section E — Contact (optionnel)

| # | Type | Question | Options |
|---|------|----------|---------|
| E1 | Choix unique | Puis-je vous recontacter pour 15 min d'entretien (visio ou mail) ? | Oui · Non |
| E2 | Courte réponse (optionnel) | Votre email si vous souhaitez un échange (sinon laissez vide) | Email |
| E3 | Paragraphe (optionnel) | Autre commentaire libre | Texte libre |

**Message de fin du formulaire :**
« Merci — votre retour est enregistré. Vous pouvez aussi écrire à Valentine sur Gmail si vous préférez le contact direct. »

---

## 5. Exploitation des réponses

| Fréquence | Action |
|-----------|--------|
| Hebdo | Export CSV Google Form → noter NPS moyen, top 3 blocages (B3), top 3 demandes (D1) |
| Mensuel | Synthèse 5 lignes : ce qui marche / ce qui bloque / 1 décision produit |
| Avant fin beta | Identifier testeurs « Oui » ou « Peut-être » Pro (D3) + NPS 8–10 pour email personnalisé |

Ne pas publier de stats inventées (« 95 % satisfaits ») sans export réel.

---

## 6. Checklist avant envoi

- [ ] Créer le Google Form et coller le lien dans les mails (`[LIEN GOOGLE FORM]`)
- [ ] Liste des inscrits beta : export org avec `betaTesterAt` renseigné (admin / SQL / script interne)
- [ ] Personnaliser `[Prénom]` si possible (sinon formule neutre)
- [ ] Vérifier que le code campagne dans les mails correspond au code actif (`npm run beta:codes -- stats`)
