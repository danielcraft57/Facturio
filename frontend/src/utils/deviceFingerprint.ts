const STORAGE_KEY = 'facturio_device_fp'

/**
 * Empreinte stable du navigateur (non biométrique) pour lier les sessions serveur.
 */
export async function getDeviceFingerprint(): Promise<string> {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && stored.length >= 16) return stored

  const parts = [
    navigator.userAgent,
    navigator.language,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    String(screen.width),
    String(screen.height),
    String(screen.colorDepth),
    navigator.platform,
  ]

  const raw = parts.join('|')
  const digest = await sha256Hex(raw)
  const fp = `fp_${digest.slice(0, 40)}`
  localStorage.setItem(STORAGE_KEY, fp)
  return fp
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
