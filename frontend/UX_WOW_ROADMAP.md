# Roadmap UX "Wow" — Frontend Web PrestaFacture

Document de planification pour les améliorations visuelles **frontend web** à traiter après stabilisation mobile.

## Objectif

Garder la sobriété pro PrestaFacture, avec des interactions premium :
- plus de fluidité perçue,
- hiérarchie visuelle claire,
- feedback immédiat à chaque action importante.

## Phase A — Quick wins visuels (1 sprint)

- Transitions de pages légères (fade/slide 150–220ms).
- Skeletons homogènes sur listes, dashboard, formulaires.
- Empty states illustrés + CTA contextualisé.
- Micro-interactions boutons (hover/press/focus states cohérents).
- Notifications toast unifiées (success, warning, error, realtime).

## Phase B — Dashboard "premium"

- Cartes KPI animées (count-up + delta animé).
- Graphiques animés au scroll / apparition progressive.
- Widget activité en direct (vu, cliqué, payé, accepté, refusé).
- Mode "command center" desktop (widgets repositionnables léger).

## Phase C — Flux métier fluides

- Factures / devis :
  - filtres persistants,
  - transitions liste ↔ détail sans rupture,
  - actions bulk avec undo rapide.
- Formulaires:
  - autosave brouillon,
  - validation inline progressive,
  - recap sticky à droite (desktop).

## Phase D — Effets "wow" maîtrisés

- Motion tokens globaux (durations/easings standards).
- Effets de profondeur (glass léger, shadows dynamiques, gradients subtils).
- Feedback sonore optionnel pour actions critiques (paramétrable).
- “Tour produit” interactif animé (nouveaux utilisateurs).

## Performance & garde-fous

- Budget animation : maintenir 60fps sur laptop moyen.
- Préférer transform/opacity, éviter reflows coûteux.
- Feature flags pour activer progressivement.
- Respect `prefers-reduced-motion`.

## Dépendances potentielles

- `framer-motion` (transitions/micro-interactions)
- `react-spring` (animations physiques ciblées)
- `lottie-react` (illustrations de succès/états vides)

## Priorisation proposée

1. Phase A (quick wins, impact immédiat)
2. Phase B (dashboard wow)
3. Phase C (productivité métier)
4. Phase D (effets avancés)
