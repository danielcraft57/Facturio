import { apiClient } from './api'
import { unwrapApiPayload } from './clients'

export const gdprService = {
  async downloadExport(): Promise<void> {
    const base =
      import.meta.env.DEV || import.meta.env.MODE === 'development'
        ? '/api'
        : import.meta.env.VITE_API_URL || '/api'
    const res = await fetch(`${base}/gdpr/export`, { credentials: 'include' })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error((err as { message?: string }).message || 'Export impossible')
    }
    const blob = await res.blob()
    const disposition = res.headers.get('Content-Disposition')
    const match = disposition?.match(/filename="([^"]+)"/)
    const filename = match?.[1] || `facturio-export-${new Date().toISOString().slice(0, 10)}.json`
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  },

  async deleteAccount(confirmEmail: string): Promise<{ deleted: boolean; message: string }> {
    const res = await apiClient.post<{ deleted: boolean; message: string }>('/gdpr/delete-account', {
      confirmEmail,
    })
    return unwrapApiPayload<{ deleted: boolean; message: string }>(res)
  },
}
