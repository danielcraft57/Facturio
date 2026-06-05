import { Box, Typography } from '@mui/material'

type Props = {
  name: string
  companyName?: string | null
  email?: string | null
  /** Email sous le nom (écrans sans colonne Contact). */
  showEmail?: boolean
}

/** Nom client en liste — texte simple, sans avatar ni lien. */
export function ClientFolderRowIdentity({
  name,
  companyName,
  email,
  showEmail = false,
}: Props) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="body2" fontWeight={600} noWrap color="text.primary">
        {name}
      </Typography>
      {companyName && (
        <Typography variant="caption" color="text.secondary" noWrap display="block">
          {companyName}
        </Typography>
      )}
      {showEmail && email && (
        <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ mt: 0.15 }}>
          {email}
        </Typography>
      )}
    </Box>
  )
}
