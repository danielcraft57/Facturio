# Script publicité réseaux — PrestaFacture (TTS)

**Formats cibles** : Reels/TikTok/Shorts 9:16 (30 s) · LinkedIn 1:1 (30 s) · Teaser 15 s  
**Ton voix TTS** : française, dynamique mais pro, débit ~150 mots/min, pauses sur les dates et chiffres  
**Musique** : lo-fi corporate légère, -18 LUFS sous la voix

---

## Version 30 secondes (principale)

| Time | Visuel (storyboard) | Voix (TTS) |
|------|---------------------|------------|
| 0:00–0:02 | Logo PrestaFacture + accroche texte | « Vous codez. Vous facturez encore à la main ? » |
| 0:02–0:06 | Overflow liste factures (tags, statuts) | « PrestaFacture, la facturation pensée pour les devs et intégrateurs. » |
| 0:06–0:10 | Modal nouveau devis + client | « Devis, clients SIREN, factures : tout au même endroit. » |
| 0:10–0:14 | Devis accepté + acompte 10 % | « Acomptes, soldes, paiement Stripe : le cycle commercial est bouclé. » |
| 0:14–0:18 | Dashboard KPI | « Tableau de bord, encaissements, conversion devis-factures. » |
| 0:18–0:22 | Bandeau réforme 2026 / paramètres | « Et la réforme e-facture 2026 ? Réception obligatoire dès septembre. PrestaFacture vous prépare. » |
| 0:22–0:26 | Menu Finance + score conformité | « Score de conformité, export Factur-X : anticipez sans changer de métier. » |
| 0:26–0:30 | CTA écran inscription | « Compte gratuit sur prestafacture point com. Votre premier devis en dix minutes. » |

### Texte voix continu (copier-coller TTS)

```
Vous codez. Vous facturez encore à la main ?
PrestaFacture, la facturation pensée pour les devs et intégrateurs.
Devis, clients SIREN, factures : tout au même endroit.
Acomptes, soldes, paiement Stripe : le cycle commercial est bouclé.
Tableau de bord, encaissements, conversion devis-factures.
Et la réforme e-facture 2026 ? Réception obligatoire dès septembre. PrestaFacture vous prépare.
Score de conformité, export Factur-X : anticipez sans changer de métier.
Compte gratuit sur prestafacture point com. Votre premier devis en dix minutes.
```

---

## Version 15 secondes (teaser)

| Time | Visuel | Voix |
|------|--------|------|
| 0:00–0:03 | Liste factures animée | « Facturation dev, sans tableur. » |
| 0:03–0:08 | Devis → acompte | « Devis, acomptes, Stripe. » |
| 0:08–0:12 | Réforme 2026 | « Prêt pour septembre 2026. » |
| 0:12–0:15 | CTA | « Essai gratuit — lien en bio. » |

```
Facturation dev, sans tableur.
Devis, acomptes, Stripe.
Prêt pour septembre 2026.
Essai gratuit — lien en bio.
```

---

## Variante A/B — Hook urgence réglementaire

Remplacer les 2 premières lignes par :

```
Septembre 2026 : vous devrez recevoir des factures électroniques.
Même en micro-entreprise. PrestaFacture vous met en conformité sans usine à gaz comptable.
```

---

## Variante A/B — Hook métier vertical

```
Indy, c’est la compta pour tout le monde.
PrestaFacture, c’est comment vous facturez vos missions React, API et maintenance IA.
```

---

## Sous-titres & accessibilité

- Brûler les sous-titres (gros, fond semi-transparent).
- Afficher « sept. 2026 » en plus de la voix sur la mention réforme.
- Hashtags description : `#facturation #freelance #developpeur #efacture2026 #saas`

---

## Paramètres TTS suggérés

| Plateforme | Voix | Notes |
|------------|------|-------|
| ElevenLabs | « Charlotte » ou voix FR pro | Stability 0.45, similarity 0.75 |
| Azure Neural | `fr-FR-DeniseNeural` | Style « cheerful » léger |
| Google Cloud | `fr-FR-Neural2-A` | Speaking rate 1.05 |

**SSML pause** (exemple) :

```xml
<speak>
  Vous codez. <break time="400ms"/>
  Vous facturez encore à la main ?
  <break time="600ms"/>
  PrestaFacture, la facturation pensée pour les <emphasis>devs</emphasis> et intégrateurs.
</speak>
```

---

## Checklist montage

- [ ] Flouter emails / noms clients sur captures réelles
- [ ] Logo PrestaFacture coin supérieur dès 0:01
- [ ] Son « whoosh » discret aux transitions de cadre overflow
- [ ] Dernière frame 2 s : URL + QR signup
- [ ] Export 1080×1920 (30 fps) + 1080×1080 déclinaison LinkedIn

---

## Lien avec la roadmap

Voir [ROADMAP_MARKETING_2026.md](../ROADMAP_MARKETING_2026.md) phases 2–3 pour intégration landing et mesure UTM.
