import { usesNativeNotifications } from '../notificationService'

describe('notificationService', () => {
  it('désactive les notifications natives sur web', () => {
    expect(usesNativeNotifications('web')).toBe(false)
    expect(usesNativeNotifications('ios')).toBe(true)
    expect(usesNativeNotifications('android')).toBe(true)
  })
})
