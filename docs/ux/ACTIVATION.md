# Activation Facturio

Objectif mesurable : un visiteur devient **client actif** quand il a émis au moins une facture sur son compte.

## Événements GA4

| Événement | Déclencheur |
|-----------|-------------|
| `signup_started` | Début formulaire inscription |
| `signup_completed` | Compte créé |
| `onboarding_skipped` | Bouton « Configurer plus tard » sur `/installation` |
| `demo_quest_step` | Étape quête démo validée (optionnel) |
| `demo_quest_completed` | 3/3 quêtes démo |
| `signup_from_demo` | Inscription depuis CTA post-démo (à brancher sur liens `/signup?from=demo`) |
| `activation_quest_step` | Étape checklist compte réel (optionnel) |
| `activation_quest_completed` | 3/3 premiers pas dashboard |
| `first_invoice_created` | Première facture créée sur le compte |
| `first_pdf_downloaded` | Premier téléchargement PDF facture (liste ou détail) |

## Parcours signup → activation

```mermaid
flowchart LR
  A[Landing /signup] --> B[AuthBoot]
  B --> C{/installation}
  C -->|install ou skip| D{Email vérifié?}
  D -->|non| E[/inscription/confirmation]
  D -->|oui| F[Dashboard]
  E --> G[VerifyEmailPage]
  G --> F
  F --> H[ActivationWelcomeDialog]
  F --> I[AccountActivationChecklist]
  I --> J[Première facture]
  J --> K[first_invoice_created]
```

## Parcours démo → signup

```mermaid
flowchart LR
  L[/essayer preview] --> M[Entrer démo]
  M --> N[DemoExploreChecklist 3/3]
  N --> O[DemoQuestCompleteDialog]
  O --> P[/signup]
```

## Fichiers clés

- `frontend/src/config/analyticsEvents.ts` — noms d'événements
- `frontend/src/utils/accountActivationStorage.ts` — progression compte réel
- `frontend/src/components/activation/` — checklist, verify email, récap
- `server/src/onboarding/onboarding.controller.ts` — `POST /onboarding/skip`
