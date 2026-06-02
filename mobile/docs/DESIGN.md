# Charte visuelle — Facturio Mobile

Référence : maquettes dashboard (teal/navy) et liste factures (bleu navy).

## Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `navy` | `#002D3D` | Sidebar, headers marketing, CTA secondaire |
| `navyDark` | `#001A24` | Fond sidebar profond |
| `teal` | `#00C2A8` | Actions primaires, tendances positives, segment « Payées » |
| `primary` | `#2563EB` | Boutons « + Nouvelle facture », onglet actif (variante liste) |
| `background` | `#F1F5F9` | Fond écran |
| `surface` | `#FFFFFF` | Cartes, contenu principal |
| `text` | `#0F172A` | Titres, montants |
| `textMuted` | `#64748B` | Labels, sous-titres |
| `success` | `#10B981` | Statut Payée, +% |
| `warning` | `#F59E0B` | Brouillon |
| `error` | `#EF4444` | En retard, -% |
| `info` | `#3B82F6` | Envoyée / En attente |
| `pending` | `#BFDBFE` | Fond badge En attente |

## Typographie

- Famille : **System** (SF Pro / Roboto) — équivalent web Inter
- Titres écran : 28 px, weight 700
- KPI montant : 24 px, weight 700
- Corps : 15–16 px, weight 400
- Labels badge : 12 px, weight 600

## Rayons & ombres

- Cartes : `borderRadius: 16`, ombre légère (`shadowOpacity: 0.06`, `elevation: 2`)
- Boutons : `borderRadius: 12`
- Badges statut : `borderRadius: 999` (pill)

## Composants

### MetricCard

Icône dans cercle pastel, label gris, montant bold, chip tendance (+/- %).

### StatusBadge

| Statut API | Label FR | Couleur fond | Couleur texte |
|------------|----------|--------------|---------------|
| `paid` | Payée | `#D1FAE5` | `#047857` |
| `sent` | Envoyée | `#DBEAFE` | `#1D4ED8` |
| `overdue` | En retard | `#FEE2E2` | `#B91C1C` |
| `draft` | Brouillon | `#F3F4F6` | `#4B5563` |

### Navigation

| Breakpoint | Comportement |
|------------|--------------|
| `< 768 px` | Bottom tabs : Accueil, Factures, Devis, Plus |
| `≥ 768 px` | Drawer / sidebar navy fixe à gauche (240 px) |

## Écrans de référence

### Connexion (marketing split — tablette)

- Panneau gauche navy : logo, accroche, 3 points forts, CTA
- Panneau droit : formulaire email / mot de passe

### Tableau de bord

- Grille 2×2 KPI (1 colonne sur phone)
- Graphique ligne « Évolution CA » + donut « Répartition factures »
- Liste « Factures récentes » + fil « Activité récente »

### Factures

- Header + onglets Tous / Non lus
- Barre recherche + bouton Filtres + FAB « Nouvelle facture »
- **Mobile** : cartes empilées (pas de tableau horizontal)
- **Tablette** : lignes type table avec colonnes visibles

## Assets

- Logo : texte « Facturio » + pastille teal « F » (composant `Logo` SVG/texte en v0.1)
- Icônes : `@expo/vector-icons` (Feather / Ionicons)
