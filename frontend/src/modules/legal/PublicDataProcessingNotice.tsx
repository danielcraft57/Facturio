import { Typography, Link } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

type Props = {
  issuerName?: string
  privacyPolicyUrl?: string | null
}

/** Mention RGPD sur les pages publiques facture / devis. */
export function PublicDataProcessingNotice({ issuerName, privacyPolicyUrl }: Props) {
  const controller = issuerName?.trim() || 'le prestataire émetteur'
  return (
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3, lineHeight: 1.6 }}>
      Données personnelles : les informations affichées sont traitées par {controller} pour la gestion de
      ce document et, le cas échéant, l’encaissement via Stripe (prestataire de paiement du prestataire).
      {privacyPolicyUrl ? (
        <>
          {' '}
          <Link href={privacyPolicyUrl} target="_blank" rel="noopener noreferrer">
            Politique de confidentialité du prestataire
          </Link>
        </>
      ) : (
        <>
          {' '}
          Pour exercer vos droits, contactez directement {controller}.
        </>
      )}{' '}
      <Link component={RouterLink} to="/privacy" underline="hover">
        Confidentialité Facturio
      </Link>
    </Typography>
  )
}
