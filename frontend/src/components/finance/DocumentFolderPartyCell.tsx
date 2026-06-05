import { Box, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

type Props = {
  name: string
  email?: string | null
  href?: string
  emphasize?: boolean
}

/** Nom + email (client ou créancier) en liste dossier. */
export function DocumentFolderPartyCell({ name, email, href, emphasize = false }: Props) {
  const nameSx = {
    fontWeight: emphasize ? 700 : 500,
    color: 'text.primary',
    textDecoration: 'none',
    display: 'block',
  } as const

  return (
    <Box sx={{ minWidth: 0 }}>
      {href ? (
        <Typography
          component={RouterLink}
          to={href}
          variant="body2"
          noWrap
          sx={{ ...nameSx, '&:hover': { textDecoration: 'underline' } }}
        >
          {name}
        </Typography>
      ) : (
        <Typography variant="body2" noWrap sx={nameSx}>
          {name}
        </Typography>
      )}
      <Typography
        variant="caption"
        color="text.secondary"
        noWrap
        display="block"
        sx={{ mt: 0.2, lineHeight: 1.35, opacity: 0.9 }}
      >
        {email?.trim() || '—'}
      </Typography>
    </Box>
  )
}
