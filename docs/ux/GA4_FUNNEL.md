# Entonnoir GA4 — acquisition et activation

Événements déjà instrumentés dans `frontend/src/config/analyticsEvents.ts`. À configurer dans GA4 (Exploration > Entonnoir) une fois la propriété reliée.

## Parcours démo

| Étape | Événement GA4 | Déclencheur |
|-------|---------------|-------------|
| 1. Landing | `page_view` | `/` |
| 2. Clic démo | `cta_demo` | Hero, tarifs, footer |
| 3. Entrée démo | `page_view` | `/essayer` puis app |
| 4. Aperçu formulaire | `demo_form_preview` | Ouverture modale création (facture, devis, client, produit) |
| 5. Tentative enregistrement | `demo_persist_blocked` | Clic « enregistrer » en démo |
| 6. Quête terminée | `demo_quest_completed` | 3/3 étapes démo |
| 7. Inscription depuis démo | `signup_from_demo` | `/signup?from=demo` |

## Parcours compte réel

| Étape | Événement GA4 | Déclencheur |
|-------|---------------|-------------|
| 1. Clic inscription | `cta_signup` ou `cta_signup_hero` | Landing / signup |
| 2. Formulaire démarré | `signup_started` | SignupPage mount |
| 3. Compte créé | `signup_completed` | POST signup OK |
| 4. Quête activation | `activation_quest_completed` | 3/3 étapes dashboard |
| 5. Première facture | `first_invoice_created` | Création facture |
| 6. Premier PDF | `first_pdf_downloaded` | Téléchargement PDF |

## Filtres recommandés

- Segment **démo** : utilisateurs avec `demo_quest_completed` sans `signup_completed` (exploration).
- Segment **activé** : `first_invoice_created` dans les 7 jours après `signup_completed`.

## Engagement produit (app connectée)

| Action | Événement GA4 | Déclencheur |
|--------|---------------|-------------|
| Palette ouverte | `command_palette_open` | Ctrl+K / Cmd+K ou bouton recherche |
| Navigation palette | `command_palette_select` | Entrée sur un résultat |

## Limites

Pas de volume garanti sans trafic. Ne pas inventer de taux de conversion dans la com' — juger sur la tendance mois après mois.
