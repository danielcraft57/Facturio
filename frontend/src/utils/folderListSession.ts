/** Modules déjà ouverts dans la session (évite la popin à chaque dossier). */
const warmedModules = new Set<string>()

export function isFolderListSessionWarmed(moduleKey: string): boolean {
  return warmedModules.has(moduleKey)
}

export function markFolderListSessionWarmed(moduleKey: string): void {
  warmedModules.add(moduleKey)
}
