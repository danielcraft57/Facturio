import { Typography, Link } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

type Props = {
  issuerName?: string
  privacyPolicyUrl?: string | null
  /** Surcharge du motif de traitement (ex. reconnaissance de dette). */
  processingPurpose?: string
}

/** Mention RGPD sur les pages publiques facture / devis. */
export function PublicDataProcessingNotice({
  issuerName,
  privacyPolicyUrl,
  processingPurpose,
}: Props) {
  const controller = issuerName?.trim() || 'le prestataire émetteur'
  const purpose =
    processingPurpose?.trim() ||
    'la gestion de ce document et, le cas échéant, l’encaissement via Stripe (prestataire de paiement du prestataire)'
  return (
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3, lineHeight: 1.6 }}>
      Données personnelles : les informations affichées sont traitées par {controller} pour {purpose}.
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
