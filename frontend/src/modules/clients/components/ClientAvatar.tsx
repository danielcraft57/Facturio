import { Avatar } from '@mui/material'

type Props = {
  id?: string
  name?: string
  email?: string
  size?: number
}

const CLIENT_AVATAR_STYLES = [
  { bg: '#0f766e', fg: '#ecfeff' },
  { bg: '#1d4ed8', fg: '#eff6ff' },
  { bg: '#7c3aed', fg: '#f5f3ff' },
  { bg: '#be123c', fg: '#fff1f2' },
  { bg: '#a16207', fg: '#fefce8' },
  { bg: '#065f46', fg: '#ecfdf5' },
  { bg: '#0f172a', fg: '#f8fafc' },
]

function hashString(input: string): number {
  let h = 0
  for (let i = 0; i < input.length; i += 1) h = (h * 31 + input.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function ClientAvatar({ id, name, email, size = 28 }: Props) {
  const key = `${id ?? ''}|${name ?? ''}|${email ?? ''}`.trim() || 'client'
  const style = CLIENT_AVATAR_STYLES[hashString(key) % CLIENT_AVATAR_STYLES.length]
  const label = (name?.trim()?.[0] || email?.trim()?.[0] || '?').toUpperCase()

  return (
    <Avatar
      sx={{
        width: size,
        height: size,
        fontSize: Math.max(11, Math.round(size * 0.44)),
        fontWeight: 800,
        bgcolor: style.bg,
        color: style.fg,
      }}
    >
      {label}
    </Avatar>
  )
}

