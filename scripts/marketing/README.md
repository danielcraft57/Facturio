# Scripts marketing — Facturio

## TTS publicité (`generate_facturio_marketing_tts.py`)

Génère les pistes voix à partir de `facturio-publicite-2026.json` (edge-tts, même logique que VocalGuard).

```bash
pip install edge-tts pydub
# ffmpeg dans le PATH

npm run marketing:tts
# ou :
python scripts/marketing/generate_facturio_marketing_tts.py --variant 30s-main --concat-full
python scripts/marketing/generate_facturio_marketing_tts.py --variant all --concat-full --force
```

Sortie : `docs/marketing/pub-2026/audio/<variant>/` + `pub-2026/subtitles/<variant>.srt`

Montage vidéo (ffmpeg) :

```bash
npm run marketing:video
npm run marketing:video -- --variant 15s-teaser
```

Storyboard détaillé : `docs/marketing/scripts/PUBLICITE_TTS_SCRIPT.md`  
Scénario pub (plans, timecodes, captures) : `docs/marketing/SCENARIO_PUBLICITE_2026.md`

## Captures Playwright

Voir `docs/marketing/scripts/README.md` — Playwright est installé dans **`frontend/`**, les scripts le résolvent automatiquement.

```bash
npm run seed:playwright
npm run start:all
npm run marketing:capture
npm run marketing:workflow
```
