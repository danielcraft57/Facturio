export function unwrapApi<T>(response: unknown): T {
  const raw = (response as { data?: unknown })?.data ?? response
  if (raw && typeof raw === 'object' && 'data' in (raw as object)) {
    return (raw as { data: T }).data
  }
  return raw as T
}

export function getApiBaseUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_URL?.trim()
  if (url) return url.replace(/\/$/, '')
  return 'http://localhost:3000/api'
}
