import { layout } from '../theme'

export interface ResponsiveLayoutFlags {
  isLandscape: boolean
  isTablet: boolean
  useSidebarLayout: boolean
}

/** Logique pure pour tablette / sidebar paysage (testable sans RN). */
export function resolveResponsiveLayout(width: number, height: number): ResponsiveLayoutFlags {
  const isLandscape = width > height
  const isTablet = width >= layout.tabletBreakpoint
  const useSidebarLayout =
    isTablet || (isLandscape && width >= layout.landscapeSidebarMinWidth)

  return { isLandscape, isTablet, useSidebarLayout }
}
