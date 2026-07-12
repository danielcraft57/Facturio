import type { ReactNode } from 'react'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import DescriptionIcon from '@mui/icons-material/Description'
import PeopleIcon from '@mui/icons-material/People'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import {
  navDashboard,
  type NavGroup,
  type NavItem,
} from './navConfig'
import { userMenuLinks } from './userMenuConfig'

/** Type d'entrée affichée dans la palette globale. */
export type CommandPaletteItemKind = 'navigation' | 'action' | 'account'

/**
 * Entrée de la palette Cmd+K (navigation, action rapide ou compte).
 */
export type CommandPaletteItem = {
  id: string
  label: string
  description?: string
  keywords?: string[]
  to: string
  icon?: ReactNode
  badge?: string
  planLocked?: boolean
  kind: CommandPaletteItemKind
  groupLabel: string
}

const QUICK_ACTIONS: CommandPaletteItem[] = [
  {
    id: 'action-new-invoice',
    label: 'Nouvelle facture',
    description: 'Ouvrir le formulaire de création',
    keywords: ['facture', 'créer', 'émettre'],
    to: '/factures/inbox?create=1',
    icon: <AddCircleOutlineIcon fontSize="small" />,
    kind: 'action',
    groupLabel: 'Actions rapides',
  },
  {
    id: 'action-new-quote',
    label: 'Nouveau devis',
    description: 'Proposition commerciale',
    keywords: ['devis', 'proposition', 'créer'],
    to: '/devis/inbox?create=1',
    icon: <DescriptionIcon fontSize="small" />,
    kind: 'action',
    groupLabel: 'Actions rapides',
  },
  {
    id: 'action-new-client',
    label: 'Nouveau client',
    description: 'Ajouter un acheteur',
    keywords: ['client', 'contact', 'créer'],
    to: '/clients/inbox?create=1',
    icon: <PeopleIcon fontSize="small" />,
    kind: 'action',
    groupLabel: 'Actions rapides',
  },
  {
    id: 'action-products',
    label: 'Catalogue produits',
    description: 'Gérer tarifs et prestations',
    keywords: ['produit', 'catalogue', 'tarif'],
    to: '/produits',
    icon: <Inventory2Icon fontSize="small" />,
    kind: 'action',
    groupLabel: 'Actions rapides',
  },
]

/**
 * Convertit une entrée de navigation en item palette.
 *
 * @param item - Entrée nav
 * @param groupLabel - Libellé de section affiché
 * @param idPrefix - Préfixe d'id unique
 */
function navItemToPaletteItem(item: NavItem, groupLabel: string, idPrefix: string): CommandPaletteItem {
  return {
    id: `${idPrefix}-${item.to}`,
    label: item.label,
    description: item.description,
    to: item.to,
    icon: item.icon,
    badge: item.badge,
    planLocked: item.planLocked,
    kind: 'navigation',
    groupLabel,
  }
}

/**
 * Fusionne les items en évitant les doublons de destination (priorité action > navigation > compte).
 *
 * @param items - Liste brute
 */
function dedupePaletteItems(items: CommandPaletteItem[]): CommandPaletteItem[] {
  const priority: Record<CommandPaletteItemKind, number> = {
    action: 3,
    navigation: 2,
    account: 1,
  }
  const byTo = new Map<string, CommandPaletteItem>()

  for (const item of items) {
    const existing = byTo.get(item.to)
    if (!existing || priority[item.kind] > priority[existing.kind]) {
      byTo.set(item.to, item)
    }
  }

  return Array.from(byTo.values())
}

/**
 * Construit la liste complète des entrées palette à partir de la navigation filtrée.
 *
 * @param options.navGroups - Groupes commerciaux / finance (déjà filtrés plan)
 * @param options.settingsGroup - Groupe paramètres filtré
 * @returns Items dédupliqués, prêts pour la recherche textuelle
 *
 * @example
 * const items = buildCommandPaletteItems({ navGroups, settingsGroup })
 */
export function buildCommandPaletteItems(options: {
  navGroups: NavGroup[]
  settingsGroup: NavGroup
}): CommandPaletteItem[] {
  const { navGroups, settingsGroup } = options
  const raw: CommandPaletteItem[] = [...QUICK_ACTIONS]

  raw.push(navItemToPaletteItem(navDashboard, 'Navigation', 'nav'))

  for (const group of navGroups) {
    if (group.overviewCta) {
      raw.push({
        id: `overview-${group.id}`,
        label: group.overviewCta.label,
        description: group.overview,
        to: group.overviewCta.to,
        icon: group.featured.icon,
        kind: 'navigation',
        groupLabel: group.label,
      })
    }

    raw.push({
      id: `featured-${group.id}`,
      label: group.featured.title,
      description: group.featured.description,
      to: group.featured.to,
      icon: group.featured.icon,
      badge: group.items.find((item) => item.to === group.featured.to)?.badge,
      planLocked: group.items.find((item) => item.to === group.featured.to)?.planLocked,
      kind: 'navigation',
      groupLabel: group.label,
    })

    for (const item of group.items) {
      raw.push(navItemToPaletteItem(item, group.label, group.id))
    }
  }

  for (const item of settingsGroup.items) {
    raw.push(navItemToPaletteItem(item, 'Paramètres', 'settings'))
  }

  for (const link of userMenuLinks) {
    raw.push({
      id: `account-${link.to}`,
      label: link.label,
      description: link.description,
      to: link.to,
      icon: link.icon,
      kind: 'account',
      groupLabel: 'Compte',
    })
  }

  return dedupePaletteItems(raw)
}

/**
 * Normalise une chaîne pour la recherche (minuscules, sans accents).
 *
 * @param value - Texte source
 */
function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

/**
 * Filtre les entrées palette selon la requête utilisateur.
 *
 * @param items - Liste complète
 * @param query - Texte saisi dans la palette
 * @returns Sous-ensemble trié par pertinence (label puis description)
 */
export function filterCommandPaletteItems(items: CommandPaletteItem[], query: string): CommandPaletteItem[] {
  const trimmed = query.trim()
  if (!trimmed) return items

  const tokens = normalizeSearchText(trimmed).split(/\s+/).filter(Boolean)

  return items
    .map((item) => {
      const haystack = normalizeSearchText(
        [item.label, item.description, item.groupLabel, ...(item.keywords ?? [])].filter(Boolean).join(' '),
      )
      const score = tokens.reduce((acc, token) => (haystack.includes(token) ? acc + 1 : acc), 0)
      return { item, score }
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label, 'fr'))
    .map(({ item }) => item)
}

/**
 * Regroupe les items filtrés par libellé de section (ordre d'apparition conservé).
 *
 * @param items - Items filtrés
 */
export function groupCommandPaletteItems(
  items: CommandPaletteItem[],
): { groupLabel: string; items: CommandPaletteItem[] }[] {
  const groups: { groupLabel: string; items: CommandPaletteItem[] }[] = []
  const indexByLabel = new Map<string, number>()

  for (const item of items) {
    const existingIndex = indexByLabel.get(item.groupLabel)
    if (existingIndex == null) {
      indexByLabel.set(item.groupLabel, groups.length)
      groups.push({ groupLabel: item.groupLabel, items: [item] })
    } else {
      groups[existingIndex].items.push(item)
    }
  }

  return groups
}
