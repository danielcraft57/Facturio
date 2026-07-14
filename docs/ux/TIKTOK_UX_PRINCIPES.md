# Principes UX TikTok → Facturio

Synthèse des transcripts `Videos/tiktokUX/transcripts` appliquée à l'espace démo, aux popins et à la palette Cmd+K.

## Priorité haute (implémenté)

| Principe | Source transcript | Action Facturio |
|----------|-------------------|-----------------|
| Dashboard pré-rempli | Welcome state / time to value | Données démo seed + copy « facture prête à envoyer » |
| Règle des 2 minutes | 4 tips time to value | Première quête = consulter une facture, pas configurer |
| Faire accomplir | Onboarding skippé | Welcome : CTA unique « Première victoire » |
| Call to Value | CTV vs CTA | Boutons orientés résultat (facture conforme, pas « configurer ») |
| Cmd+K copilote | Barre de recherche copilote | Actions populaires à l'ouverture, suggestions si zéro résultat |
| Welcome deep-link | Time to value | CTA adaptatif si atterrissage sur facture (`demoHeroPaths`) |
| Toasts quête + CTA | Notification = 1 action | `questCelebration` avec lien prochaine étape |
| Zeigarnik orienté bénéfice | Effet Zeigarnik | Copy checklist + welcome (ce qu'on obtient, pas juste 1/3) |
| Empty + CTA | Plus voir en 2026 | `FinanceFolderEmptyState` (déjà en place) |
| Erreur qui guide | Blocage sans explication | Toasts démo + guards avec lien signup |
| Aha moment Factur-X | Onboarding s'arrête à l'inscription | Quêtes démo → facture + score conformité |

## Priorité moyenne (implémenté)

| Principe | Action Facturio |
|----------|-----------------|
| Onboarding adaptatif par profil | `/essayer` : 3 parcours (`demoIntent.ts` + cartes sur `DemoEnterPage`) |
| Tooltips contextuels après skip welcome | `DemoContextualHints` (Cmd+K, score conformité sur facture) |
| Toast succès avec prochaine étape | `DemoEntryMessageNotifier` CTA selon intent / landing |
| Recherche proactive Cmd+K | `useCommandPaletteEntitySearch` (n° facture, nom client) |
| Suite logique Cmd+K | `buildContextualPaletteItems` (quête démo + page courante) |

## Priorité moyenne (backlog)

- Fil d'Ariane émotionnel sur quêtes activation compte réel

## Priorité basse

- Micro-feedback abandon modale création (« qu'est-ce qui t'a bloqué ? »)
- Vitrine Pro dans Cmd+K pour items `planLocked`

## Captures marketing

Après chaque lot UX démo, relancer :

```bash
npm run ensure-demo --prefix server
npm run start:all
npm run demo:capture
```

Nouvelles captures : `demo-command-palette`, `demo-quest-complete-dialog`.
