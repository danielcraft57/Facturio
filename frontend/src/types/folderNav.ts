/** Configuration réutilisable d’un menu latéral par dossiers groupés (sous-menus repliables). */
export type FolderNavGroup<F extends string = string> = {
  id: string
  label: string
  folders: F[]
  /** Groupe repliable (défaut : true). */
  collapsible?: boolean
  /** État initial replié (défaut : false). */
  defaultCollapsed?: boolean
}

export type FolderNavTrailingItem<F extends string = string> = {
  id: F | string
  label: string
  to: string
  icon?: import('react').ReactNode
}

export type FolderNavConfig<F extends string = string> = {
  /** Entrées toujours visibles en tête (ex. Tous, Non lus). */
  primaryFolders?: F[]
  groups: FolderNavGroup<F>[]
  trailing?: FolderNavTrailingItem<F>[]
}

/** Tous les dossiers déclarés dans une config (ordre d’affichage). */
export function flattenFolderNavFolders<F extends string>(config: FolderNavConfig<F>): F[] {
  return [...(config.primaryFolders ?? []), ...config.groups.flatMap((g) => g.folders)]
}
