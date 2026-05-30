# Roadmap marketing — landing pages & publicité 2026

**Branche cible** : `feature/marketing-landing-ad-2026`  
**Références** : [STRATEGIE_ACQUISITION_INSCRIPTIONS_2026.md](../planning/STRATEGIE_ACQUISITION_INSCRIPTIONS_2026.md) · `frontend/src/modules/marketing/`

---

## Objectifs

1. **Landing pages** plus crédibles avec de vrais écrans produit (overflow animé) au lieu de la seule maquette CSS `HeroDashboardMock`.
2. **Kit pub réseaux** (Reels / LinkedIn / Meta) : script TTS + storyboard aligné sur les 3 messages acquisition.
3. **Pipeline assets** reproductible (captures Playwright → cadres JS → export vidéo).

---

## Phase 0 — Préparation (fait / en cours)

| Tâche | Statut |
|-------|--------|
| Archiver 13 screenshots session dans `docs/marketing/screenshots-temp/raw/` | ✅ |
| Manifeste scènes + visuels générés maquette | ✅ |
| Script captures UX Playwright | ✅ `scripts/capture-marketing-screenshots.mjs` |
| Démo animée création/envoi | ✅ `scripts/record-workflow-demo.mjs` + `MarketingWorkflowDemo` |
| Grille écrans landing | ✅ `MarketingScreensShowcase` |
| Démo cadre overflow JS | ✅ `scripts/overflow-frame-demo.html` |
| Script pub TTS | ✅ `scripts/PUBLICITE_TTS_SCRIPT.md` |
| Branche Git dédiée | ✅ `feature/marketing-landing-ad-2026` |

---

## Phase 1 — Assets & capture (1–2 j)

- [ ] Installer Playwright en dev : `cd frontend && npm i -D playwright && npx playwright install chromium`
- [ ] Variables : `FACTURIO_BASE_URL`, `FACTURIO_TEST_EMAIL`, `FACTURIO_TEST_PASSWORD`
- [ ] Lancer `npm run marketing:capture` puis `npm run marketing:workflow`
- [ ] Retoucher / flouter emails et noms clients si export public
- [ ] Copier sélection finale → `frontend/public/images/marketing/overflow/`
- [ ] Exporter 3–5 loops MP4/WebM (OBS ou `ffmpeg` sur démo HTML) pour pub

**Routes prioritaires** : `/dashboard`, `/factures/inbox`, `/devis/inbox`, `/clients/inbox`, `/parametres`, détail facture/devis (IDs de démo).

---

## Phase 2 — Composants landing (3–5 j)

- [ ] Créer `OverflowScreenshotFrame.tsx` dans `marketing/components/` (port depuis démo HTML)
- [ ] Remplacer `HeroDashboardMock` sur `LandingPage` par overflow réel + fallback mock
- [x] Section showcase 8 écrans + démo animée devis/facture (onglets)
- [ ] Affiner hero avec capture `dashboard` après `marketing:capture`
- [ ] Page `/fonctionnalites` : 2 colonnes texte + overflow factures / clients
- [ ] Page `/facturation-electronique` : capture paramètres + score conformité dashboard
- [ ] Mettre à jour `siteContent.ts` si nouveaux accroches validées en pub
- [ ] SEO : `alt` descriptifs, `loading="lazy"`, poids WebP < 200 Ko par frame

---

## Phase 3 — Publicité & TTS (2–3 j)

- [ ] Enregistrer voix TTS (ElevenLabs / Azure / Play.ht) depuis `PUBLICITE_TTS_SCRIPT.md`
- [ ] Montage 30 s + 15 s (CapCut / DaVinci) — formats 9:16 et 1:1
- [ ] Variantes A/B hooks : « septembre 2026 » vs « facturation dev »
- [ ] UTM + lien `facturio.danielcraft.fr/signup?utm_campaign=...`
- [ ] Publier LinkedIn + Meta ; mesurer CTR inscription (objectif doc stratégie)

---

## Phase 4 — Mesure & itération (continu)

- [ ] Plausible / GA4 événements : `cta_signup_hero`, `cta_efacture`, scroll 50 %
- [ ] A/B hero mock vs overflow réel (2 semaines)
- [ ] Feedback 5 utilisateurs freelances dev sur lisibilité mobile

---

## Décisions produit à trancher

| Sujet | Option A | Option B |
|-------|----------|----------|
| Hero accueil | 1 grand overflow dashboard | Split : liste factures + KPI |
| Données captures | Compte démo anonymisé | Floutage post-prod sur compte réel |
| Vidéo pub | Screen recording app réelle | Montage cadres HTML + musique |

---

## Hors scope (cette branche)

- Refonte complète charte graphique
- Traduction EN
- Nouveau simulateur réforme (déjà partiel sur `/facturation-electronique`)

---

## Livrables fin de branche

1. PR `feature/marketing-landing-ad-2026` → `main` avec composant overflow + images `public/`
2. Dossier `docs/marketing/scripts/` versionné (sans secrets)
3. 2 exports vidéo dans `docs/marketing/exports/` (gitignored) ou lien Drive
4. Checklist test : Lighthouse landing, mobile 375px, pas de PII en clair
