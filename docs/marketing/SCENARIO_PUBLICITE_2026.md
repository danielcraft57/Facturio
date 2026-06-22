# Scénario publicité PrestaFacture — 2026

Document de production pour reels, LinkedIn, site et campagnes payantes.  
Aligné sur les captures Playwright (`npm run marketing:capture`) et le TTS (`npm run marketing:tts`).

## Message commercial clé

| Plan | Factures | Reset |
|------|----------|--------|
| **Free** | **25 max / mois calendaire** | Compteur remis à **zéro le 1er** de chaque mois |
| **Pro** | Illimité | — |

Accroche pub : *« 25 factures par mois pour tester. Le 1er du mois, vous repartez de zéro — ou passez Pro. »*

## Variante principale — 30 s (`30s-main`)

| Temps | Voix (TTS) | Visuel (capture / motion) |
|-------|------------|---------------------------|
| 0:00–0:02 | Vous codez. Vous facturez encore à la main ? | Logo + hero landing |
| 0:02–0:06 | PrestaFacture, la facturation pensée pour les devs et intégrateurs. | `menu-commercial` ou hero |
| 0:06–0:10 | Devis, clients SIREN, factures : tout au même endroit. | `devis-nouveau-modal` (formulaire rempli) |
| 0:10–0:14 | Acomptes, soldes, paiement Stripe : le cycle commercial est bouclé. | `devis-detail` ou `facture-detail` |
| 0:14–0:18 | Tableau de bord, encaissements, conversion devis-factures. | `dashboard` |
| 0:18–0:22 | Réforme e-facture 2026 ? Réception obligatoire dès septembre. PrestaFacture vous prépare. | `parametres-efacture` |
| 0:22–0:26 | Score de conformité, export Factur-X : anticipez sans changer de métier. | `parametres-entreprise` |
| 0:26–0:30 | Compte gratuit sur prestafacture point com. Votre premier devis en dix minutes. | CTA inscription |

Fichiers PNG : `docs/marketing/pub-2026/captures/<slug>.png` (option `--sync-public` pour la landing)  
Pistes voix + SRT : `docs/marketing/pub-2026/audio/30s-main/` et `pub-2026/subtitles/30s-main.srt`  
Export MP4 : `docs/marketing/pub-2026/exports/facturio-pub-30s-main.mp4` (`npm run marketing:video`).

## Teaser 15 s (`15s-teaser`)

Enchaînement rapide : `dashboard` → `factures-inbox` → `devis-nouveau-modal` → carte « 25 factures/mois » (page tarifs).

## Démo animée (workflow)

Séquence enregistrée par `npm run marketing:workflow` :

1. `quote-01-liste` → `quote-02-modal-vide` → `quote-03-modal-client` → `quote-04-modal-lignes` → envoi  
2. Idem facture : `invoice-*.png` + WebM dans `docs/marketing/pub-2026/videos/workflow/`

Utiliser en bandeau « comment ça marche » sur la landing.

## Plans produit (pub tarifs)

- **Free** : 25 factures/mois, reset mensuel, catalogue seed, pas de prospection.  
- **Pro** : illimité, ProspectLab, API — **12 €/mois** (voir `siteContent.ts`).  
- **Pro + e-facture** : conformité sept. 2026 — **24 €/mois**.

## Checklist avant diffusion

- [ ] `npm run seed:playwright --prefix server` (org Pro + catalogue + compta)  
- [ ] `npm run marketing:capture` → 25/25 OK  
- [ ] `npm run marketing:workflow`  
- [ ] `npm run marketing:tts` → écouter `full.mp3` par variante  
- [ ] Vérifier mentions légales / CGV sur landing  
- [ ] Exporter vidéo 1080×1920 (reel) et 1920×1080 (LinkedIn)

## Commandes

```bash
npm run seed:playwright --prefix server
npm run start:all
npm run marketing:capture
npm run marketing:workflow
pip install edge-tts pydub
npm run marketing:tts
```

Storyboard voix détaillé : `scripts/marketing/facturio-publicite-2026.json`  
Script Python TTS : `scripts/marketing/generate_facturio_marketing_tts.py`
