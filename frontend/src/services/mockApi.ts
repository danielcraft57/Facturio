// Service pour simuler les APIs avec des fichiers JSON
export class MockApiService {
  private baseUrl = '/api'

  async get<T>(endpoint: string): Promise<T> {
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200))

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}.json`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data as T
    } catch (error) {
      console.error(`Erreur lors du chargement de ${endpoint}:`, error)
      throw error
    }
  }

  async post<T>(_endpoint: string, data: any): Promise<T> {
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 300))

    // Pour les POST, on simule juste une réponse de succès
    return {
      success: true,
      data: {
        id: Math.random().toString(36).substr(2, 9),
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    } as T
  }

  async put<T>(_endpoint: string, data: any): Promise<T> {
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 200))

    // Pour les PUT, on simule une mise à jour
    return {
      success: true,
      data: {
        ...data,
        updatedAt: new Date().toISOString()
      }
    } as T
  }

  async delete<T>(_endpoint: string): Promise<T> {
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 100))

    // Pour les DELETE, on simule une suppression réussie
    return {
      success: true,
      data: null
    } as T
  }
}

// Instance singleton
export const mockApi = new MockApiService()
