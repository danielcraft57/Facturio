import { useSeo } from './useSeo'

/**
 * Met à jour le titre et les métadonnées sociales pour l’étape ou la page courante.
 */
export function usePageTitle(title: string | null | undefined, description?: string) {
  useSeo(
    title
      ? {
          title,
          ...(description ? { description } : {}),
        }
      : null,
  )
}
