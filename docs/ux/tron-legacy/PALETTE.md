# Palette Tron: Legacy (affiche officielle)

Source visuelle : `poster.jpg` (IMP Awards, affiche théâtrale 2010).

## Couleurs extraites

| Rôle | Hex | Usage Facturio démo |
|------|-----|---------------------|
| Void | `#000000` | Fond pages `/essayer`, bandeau démo |
| Brume teal | `#001A24` → `#004040` | Dégradés HUD, profondeur grille |
| Néon cyan | `#00E5FF` | Bordures actives, progress, liens |
| Bloom cyan | `#7DF9FF` | Reflets, texte sur fond sombre |
| Ambre cycles | `#FFB703` | Chip « MODE DÉMO », accents chauds |
| Orange Clu | `#FF8500` | Hover, alertes gamification |
| Texte grid | `#E8FAFF` | Corps sur fond sombre |
| Encre HUD | `#003B4D` | Texte sur fond clair (app light) |

## Principes visuels

- Fond noir pur + grille 48px en cyan faible (10 % opacité)
- Glow `box-shadow` sur CTA et pastilles quête
- Typo titres : bold géométrique, letter-spacing léger sur badges

## Fichiers produit

- `frontend/src/components/demo/demoTheme.ts` — tokens `DEMO_HERO_*`
- `frontend/src/components/demo/DemoPublicShell.tsx` — layout public `/essayer`
