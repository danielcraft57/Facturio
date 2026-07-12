# Principes UX TikTok → Facturio

Synthèse des transcripts `Videos/tiktokUX/transcripts` appliquée à l'espace démo, aux popins et à la palette Cmd+K.

## Priorité haute (implémenté ou en cours)

| Principe | Source transcript | Action Facturio |
|----------|-------------------|-----------------|
| Dashboard pré-rempli | Welcome state / time to value | Données démo seed + copy « facture prête à envoyer » |
| Règle des 2 minutes | 4 tips time to value | Première quête = consulter une facture, pas configurer |
| Faire accomplir | Onboarding skippé | Welcome : CTA unique « Première victoire » |
| Call to Value | CTV vs CTA | Boutons orientés résultat (facture conforme, pas « configurer ») |
| Cmd+K copilote | Barre de recherche copilote | Actions populaires à l'ouverture, suggestions si zéro résultat |
| Empty + CTA | Plus voir en 2026 | `FinanceFolderEmptyState` (déjà en place) |
| Erreur qui guide | Blocage sans explication | Toasts démo + guards avec lien signup |
| Aha moment Factur-X | Onboarding s'arrête à l'inscription | Quêtes démo → facture + score conformité |

## Priorité moyenne (backlog)

- Onboarding adaptatif par profil (freelance déjà client / démarre / conformité seule)
- Tooltips contextuels après skip welcome (Cmd+K, score conformité)
- Toast succès avec prochaine étape systématique (facture → envoyer PDF)
- Fil d'Ariane émotionnel sur quêtes activation compte réel
- Recherche proactive Cmd+K (clients, factures par numéro)

## Priorité basse

- Micro-feedback abandon modale création (« qu'est-ce qui t'a bloqué ? »)

## Captures marketing

Après chaque lot UX démo, relancer :

```bash
npm run ensure-demo --prefix server
npm run start:all
npm run demo:capture
```

Nouvelles captures : `demo-command-palette`, `demo-quest-complete-dialog`.
