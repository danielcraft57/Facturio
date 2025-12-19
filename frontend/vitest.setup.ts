import '@testing-library/jest-dom'

// Polyfill simple de localStorage pour les tests.
// On force une implémentation en mémoire pour éviter les surprises liées
// à l'environnement (node + jsdom).
if (typeof globalThis !== 'undefined') {
  const store = new Map<string, string>()

  const localStorageMock = {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, String(value))
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    clear: () => {
      store.clear()
    },
  }

  // Attacher sur globalThis et window pour couvrir tous les cas.
  Object.defineProperty(globalThis as any, 'localStorage', {
    value: localStorageMock,
    writable: true,
    configurable: true,
  })

  if (typeof window !== 'undefined') {
    Object.defineProperty(window as any, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true,
    })
  }
}




