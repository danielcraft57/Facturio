import { Platform } from 'react-native'
import {
  __resetNetworkServiceForTests,
  isOnline,
  onNetworkChange,
  readNavigatorOnline,
  startNetworkWatcher,
  stopNetworkWatcher,
} from '../networkService'

describe('networkService', () => {
  const originalOs = Platform.OS
  const browserListeners = new Map<string, Set<() => void>>()

  beforeEach(() => {
    __resetNetworkServiceForTests()
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' })
    browserListeners.clear()
    ;(window as Window & { addEventListener: typeof window.addEventListener }).addEventListener = (
      type: string,
      listener: () => void,
    ) => {
      if (!browserListeners.has(type)) browserListeners.set(type, new Set())
      browserListeners.get(type)!.add(listener)
    }
    ;(window as Window & { removeEventListener: typeof window.removeEventListener }).removeEventListener =
      (type: string, listener: () => void) => {
        browserListeners.get(type)?.delete(listener)
      }
    ;(window as Window & { dispatchEvent: typeof window.dispatchEvent }).dispatchEvent = (event: Event) => {
      browserListeners.get(event.type)?.forEach((listener) => listener())
      return true
    }
  })

  afterEach(() => {
    stopNetworkWatcher()
    __resetNetworkServiceForTests()
    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOs })
  })

  it('lit navigator.onLine sur web', () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false, writable: true })
    expect(readNavigatorOnline()).toBe(false)
    expect(isOnline()).toBe(false)
  })

  it('notifie les abonnés lors du retour en ligne', () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false, writable: true })
    const listener = jest.fn()

    startNetworkWatcher()
    onNetworkChange(listener)

    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true, writable: true })
    window.dispatchEvent(new Event('online'))

    expect(listener).toHaveBeenCalledWith(true)
  })
})
