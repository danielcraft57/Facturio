# Production pub 2026 — dossier unique

Tous les assets marketing (captures, vidéos, audio TTS, sous-titres, exports finaux) vivent ici.

```
pub-2026/
  storyboard.json      # voix + slug capture par plan
  captures/            # PNG (marketing:capture)
  videos/              # clips WebM (marketing:clips + workflow)
  workflow/            # PNG pas-à-pas démo
  audio/<variant>/     # TTS segment_*.mp3 + full.mp3
  subtitles/           # <variant>.srt
  exports/             # MP4 montés (marketing:video)
  manifest.json        # index généré
```

## Configuration Playwright

Variables dans `docs/marketing/.env` (modèle : `env.marketing.example`) — viewport, timeouts, JPEG, scroll vidéo, etc.

```bash
# Profil viewport : desktop | tablet | mobile
MARKETING_SCREENSHOT_PROFILE=desktop
WEBSITE_SCREENSHOT_SCROLL_ENABLED=true
```

## Commandes (racine Facturio)

```bash
npm run seed:playwright --prefix server
npm run start:all

npm run marketing:capture    # PNG → captures/
npm run marketing:clips      # vidéos courtes par plan → videos/
npm run marketing:workflow   # démo devis/facture → workflow/ + videos/
pip install edge-tts pydub
npm run marketing:tts        # audio/ + subtitles/

# Montage MP4 (ffmpeg requis)
npm run marketing:video -- --variant 30s-main

# Ménage anciens dossiers éparpillés
npm run marketing:clean

# Copier aussi vers la landing Vite
npm run marketing:capture -- --sync-public
```

## Prérequis montage vidéo

- [ffmpeg](https://ffmpeg.org/) dans le `PATH` (déjà requis pour pydub)
