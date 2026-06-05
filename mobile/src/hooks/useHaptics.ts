import * as Haptics from 'expo-haptics'
import { Platform } from 'react-native'

export function useHaptics() {
  const impactLight = async () => {
    if (Platform.OS === 'web') return
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }

  const impactMedium = async () => {
    if (Platform.OS === 'web') return
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  }

  const notifySuccess = async () => {
    if (Platform.OS === 'web') return
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }

  const notifyError = async () => {
    if (Platform.OS === 'web') return
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
  }

  return {
    impactLight,
    impactMedium,
    notifySuccess,
    notifyError,
  }
}
