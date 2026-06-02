export type EmailEngagement = {
  emailSent: boolean
  sentAt?: string | null
  opened: boolean
  openedAt?: string | null
  clicked: boolean
  clickedAt?: string | null
  clickAction?: string | null
  clickLabel?: string | null
}

export function formatEmailEngagementAt(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Engagement minimal pour la liste (flags API sans horodatage). */
export function emailEngagementFromListFlags(item: {
  emailSent?: boolean
  emailOpened?: boolean
  emailClicked?: boolean
}): EmailEngagement | null {
  if (!item.emailSent) return null
  return {
    emailSent: true,
    sentAt: null,
    opened: Boolean(item.emailOpened),
    openedAt: null,
    clicked: Boolean(item.emailClicked),
    clickedAt: null,
    clickAction: null,
    clickLabel: null,
  }
}
