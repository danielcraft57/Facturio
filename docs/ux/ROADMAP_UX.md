# Roadmap UX Facturio

Référence : transcripts TikTok UX (`Videos/tiktokUX/transcripts`) + captures démo (`docs/marketing/demo/captures/`) + synthèse `docs/ux/TIKTOK_UX_PRINCIPES.md`.

Légende : `[ ]` à faire · `[~]` en cours · `[x]` fait

---

## Phase 0 — Quick wins (1–2 semaines) `[x]`

### Démo
- [x] Re-capturer `demo-factures-create-vitrine` et `demo-produits-modifier-modal` (script renforcé)
- [x] Fix capture toast (sélecteurs `[role="status"]` + sidebar)
- [x] Popin welcome : progression 0/3 live (`demoExploreStorage`)
- [x] Messages démo alignés (bandeau, toast, tooltip, API 403)
- [x] Blocage démo unifié (`demoCreateGuard` : top nav, mega-menu, `?create=1`, clients, produits)
- [x] Afficher `demoMessage` après `/essayer` (`DemoEntryMessageNotifier`)

### Erreurs et toasts
- [x] Validation visible (`CreateInvoiceDialog`, `CreateQuoteDialog`)
- [x] Toasts démo : une seule action + dédoublonnage 2,5 s
- [x] Pas de double toast API sur création devis (`isLifecycleHandledApiError`)
- [x] Fix double bouton fermer (`Toast.tsx` — déjà OK)
- [x] Grouper toasts quota au premier chargement

### Landing et conversion
- [x] CTA « Essayer la démo » hero + footer landing
- [x] Alléger le texte hero (`LANDING_HERO` : titre + sous-titre courts)
- [x] 3 zones de contraste landing (hero vert, preuve sombre, tarifs accentué)
- [x] Lien démo sur `SignupPage`
- [x] Event GA `cta_demo` (`analyticsEvents.ts`)

---

## Phase 1 — Activation et onboarding (2–4 semaines) `[x]`

- [x] Définir action d'activation mesurable (`first_invoice_created` / `first_pdf_downloaded`) — voir `docs/ux/ACTIVATION.md`
- [x] Cartographier parcours signup → install → email → dashboard — `ACTIVATION.md`
- [x] Option « passer l'installation » (`POST /onboarding/skip` + bouton étape 0)
- [x] `AuthBootPage` : messages selon destination
- [x] Corriger fail-open `OnboardingRoute`
- [x] Message succès `VerifyEmailPage` sur dashboard (`VerifyEmailSuccessNotifier`)
- [x] Copy onboarding multi-profils (pas « dev only »)
- [x] Onboarding adaptatif selon profil (layout + stack filtrée)
- [x] Micro-victoires par étape install (toasts progression)
- [x] Welcome compte neuf (0 facture) — `ActivationWelcomeDialog`
- [x] Checklist quêtes version compte réel — `AccountActivationChecklist`
- [x] Fin parcours démo 3/3 : écran récap + CTA signup — `DemoQuestCompleteDialog`
- [x] Page `/essayer` : preview avant entrée (`?auto=1` pour auto-login)

---

## Phase 2 — Navigation et parcours (2–3 semaines) `[x]`

- [x] Clarifier drawer mobile vs `AppMobileNav` (label « Menu principal » + tooltip dossiers module)
- [x] Features Pro en vitrine (aperçu + upgrade) — carte Finance mega-menu + `PlanUpgradePanel`
- [x] Réduire icônes par ligne facture (menu « … »)
- [x] Séparer actions destructives des actions principales
- [x] Breadcrumb / titre explicite détail facture-devis
- [x] Empty state sidebar + bouton (mobile) — `FinanceFolderEmptyState`
- [x] Sidebars regroupées par intention (`GroupedFolderSidebar`)
- [x] Reprise : « Reprendre votre brouillon » — `DraftResumeBanner`

---

## Phase 3 — Empty states et recherche (2 semaines) `[x]`

- [x] Dashboard vide : parcours guidé (`AccountActivationChecklist` + `DashboardRecentEmptyState`)
- [x] Empty states factures, devis, clients avec CTA
- [x] Produits : lien install catalogue (`FinanceFolderEmptyState` + header)
- [x] Compta : liens sync / créer facture (`AccountingEmptyPanel`)
- [x] Variante démo dans empty states (`FinanceFolderEmptyState`, dashboard récents)
- [x] Recherche produits alignée sur `FinanceDocumentSearch`
- [x] État « aucun résultat » riche (produits + autocomplete hints)
- [x] (V2) Palette globale Cmd+K (`CommandPalette`, raccourci + barre recherche)

---

## Phase 4 — Formulaires et création (2–3 semaines) `[x]`

- [x] Placeholders guides signup / mot de passe
- [x] Critères mot de passe visibles avant submit (`SignupPasswordCriteria`)
- [x] Indicateur progression inscription (`SignupProgressIndicator`)
- [x] Mode création facture rapide (`CreateInvoiceDialog` + `CreateQuoteDialog`)
- [x] Quantité éditable vs forcée à 1 (mode avancé facture + devis)
- [x] Édition inline (fantôme) champs fréquents — clients (email/tél), tarif produit
- [x] Toast succès + prochaine étape après création (`documentCreateSuccessToast` — factures, devis, clients)
- [x] Vitrine Pro (compta, finance, conformité) — `ProFeatureVitrinePreview` + `EInvoicingUpgradeVitrine`

---

## Phase 5 — Notifications et lifecycle (1–2 semaines)

- [x] Matrice notification (quoi, quand, 1 CTA, segment)
- [x] Centre notif : empty state explicatif
- [x] Notifications contextuelles dans les pages métier
- [x] Emails win-back selon étape d'abandon

---

## Phase 6 — Marketing et crédibilité (continu)

- [x] Hero cible freelance dev / micro-agence
- [x] Positionnement honnête vs Indy/Pennylane
- [x] Preuves réelles uniquement
- [x] Workflow landing aligné captures démo
- [x] Tarifs : CTA démo secondaire
- [x] Tests mobile landing + essayer

---

## Phase 7 — UX futuriste / gamification

- [x] Étendre `demoTheme.ts` au produit (progress, badges, CTA)
- [x] HUD quêtes dashboard compte neuf
- [x] Animations micro (étape validée, level up)
- [x] Déblocage capacité après 1er client / 1ère facture
- [x] Historique progression personnelle
- [x] Mega-menus accent emerald
- [x] Transitions « mission complete »

---

## Phase 8 — Mesure `[x]`

- [x] Events GA4 : quêtes démo, signup depuis démo, 1ère facture (`analyticsEvents.ts`)
- [x] Events aperçu démo : `demo_form_preview`, `demo_persist_blocked` (`demoAnalytics.ts`)
- [x] Entonnoir landing → essayer → quête → signup → facture — voir `docs/ux/GA4_FUNNEL.md`
- [x] Playwright parcours démo stable (helpers, seed org-scoped, modales aperçu)
- [x] Captures marketing en CI — workflow manuel `.github/workflows/demo-captures.yml`
