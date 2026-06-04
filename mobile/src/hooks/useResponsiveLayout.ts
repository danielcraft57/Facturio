import { useWindowDimensions } from 'react-native'
import { resolveResponsiveLayout } from '../utils/responsiveLayout'

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions()
  return { width, height, ...resolveResponsiveLayout(width, height) }
}
