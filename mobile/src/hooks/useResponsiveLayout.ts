import { useWindowDimensions } from 'react-native'
import { layout } from '../theme'

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions()
  const isTablet = width >= layout.tabletBreakpoint
  const isLandscape = width > height

  return { width, height, isTablet, isLandscape }
}
