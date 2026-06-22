import { Box, Typography, Link, Stack } from '@mui/material'
import { DANIELCRAFT_PUBLISHER, PRESTAFACTURE_SERVICE } from './danielcraftPublisher'

type Props = {
  showPrestaFacture?: boolean
}

/** Encart récapitulatif éditeur (données danielcraft.fr). */
export function LegalPublisherCard({ showPrestaFacture = true }: Props) {
  const p = DANIELCRAFT_PUBLISHER
  return (
    <Box
      sx={{
        p: 2.5,
        mb: 4,
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'action.hover',
      }}
    >
      {showPrestaFacture && (
        <Typography variant="subtitle2" fontWeight={700} color="primary.main" gutterBottom>
          {PRESTAFACTURE_SERVICE.name}
        </Typography>
      )}
      <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 1.5 }}>
        Éditeur : {p.legalName} — {p.tradeName} ({p.legalForm})
      </Typography>
      <Stack spacing={0.5} component="ul" sx={{ m: 0, pl: 2.5 }}>
        <Typography component="li" variant="body2" color="text.secondary">
          Adresse : {p.address}
        </Typography>
        <Typography component="li" variant="body2" color="text.secondary">
          Email :{' '}
          <Link href={`mailto:${p.email}`} underline="hover">
            {p.email}
          </Link>
        </Typography>
        <Typography component="li" variant="body2" color="text.secondary">
          Téléphone :{' '}
          <Link href={p.phoneHref} underline="hover">
            {p.phone}
          </Link>
        </Typography>
        <Typography component="li" variant="body2" color="text.secondary">
          SIRET : {p.siret} · SIREN : {p.siren}
        </Typography>
        <Typography component="li" variant="body2" color="text.secondary">
          TVA : {p.vatMention}
        </Typography>
        <Typography component="li" variant="body2" color="text.secondary">
          Site :{' '}
          <Link href={p.website} target="_blank" rel="noopener noreferrer" underline="hover">
            {p.websiteLabel}
          </Link>
        </Typography>
      </Stack>
    </Box>
  )
}
