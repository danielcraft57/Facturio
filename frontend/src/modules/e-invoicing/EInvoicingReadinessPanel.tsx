import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import DownloadIcon from '@mui/icons-material/Download'
import SendIcon from '@mui/icons-material/Send'
import {
  eInvoicingService,
  type InvoiceReadiness,
  type OrganizationReadiness,
  type SubmitInvoiceToPaResult,
} from '../../services/eInvoicing'

type Props = {
  invoiceId?: number
  compact?: boolean
}

export function EInvoicingReadinessPanel({ invoiceId, compact }: Props) {
  const [org, setOrg] = useState<OrganizationReadiness | null>(null)
  const [inv, setInv] = useState<InvoiceReadiness | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<SubmitInvoiceToPaResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    setLoading(true)
    setError(null)
    const loadOrg = eInvoicingService.getOrganizationReadiness()
    const loadInv = invoiceId
      ? eInvoicingService.getInvoiceReadiness(invoiceId)
      : Promise.resolve(null)
    try {
      const [orgData, invData] = await Promise.all([loadOrg, loadInv])
      setOrg(orgData)
      if (invData) setInv(invData)
    } catch (err) {
      setError((err as Error)?.message ?? 'Chargement impossible')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    void refresh().catch(() => {})
    return () => {
      cancelled = true
    }
  }, [invoiceId])

  const handleDownload = async () => {
    if (!invoiceId) return
    setDownloading(true)
    setError(null)
    try {
      await eInvoicingService.downloadFacturX(invoiceId)
    } catch (err) {
      setError((err as Error)?.message ?? 'Erreur')
    } finally {
      setDownloading(false)
    }
  }

  const handleSubmitPa = async () => {
    if (!invoiceId) return
    setSubmitting(true)
    setError(null)
    setSubmitResult(null)
    try {
      const res = await eInvoicingService.submitInvoiceToPa(invoiceId)
      setSubmitResult(res)
      await refresh()
    } catch (err) {
      setError((err as Error)?.message ?? 'Soumission PA impossible')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Card variant="outlined" sx={{ mb: compact ? 0 : 3 }}>
        <CardContent>
          <LinearProgress sx={{ mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Analyse conformité réforme 2026…
          </Typography>
        </CardContent>
      </Card>
    )
  }

  const score = inv?.score ?? org?.score ?? 0
  const checks = inv?.checks ?? org?.checks ?? []

  const paConfigured = org?.paConnected === true
  const canSubmitToPa =
    !!invoiceId &&
    !!inv?.canGenerateFacturX &&
    !!org?.planAllowsEInvoicing &&
    paConfigured &&
    inv?.status !== 'PENDING_PA' &&
    inv?.status !== 'SENT' &&
    inv?.status !== 'DELIVERED'

  return (
    <Card variant="outlined" sx={{ mb: compact ? 0 : 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Typography variant="h6" fontWeight={600}>
            Facturation électronique 2026
          </Typography>
          <Chip
            label={`${score} % prêt`}
            size="small"
            color={score >= 100 ? 'success' : score >= 60 ? 'warning' : 'default'}
          />
          {invoiceId && inv?.status && (
            <Chip
              label={`Statut: ${inv.status}`}
              size="small"
              variant="outlined"
              color={
                inv.status === 'DELIVERED'
                  ? 'success'
                  : inv.status === 'ERROR'
                    ? 'error'
                    : inv.status === 'PENDING_PA'
                      ? 'warning'
                      : 'default'
              }
            />
          )}
          {!org?.planAllowsEInvoicing && (
            <Chip label="Plan Pro + e-facture requis" size="small" color="warning" variant="outlined" />
          )}
          {org?.planAllowsEInvoicing && !paConfigured && (
            <Chip label="PA non configurée (mock)" size="small" variant="outlined" />
          )}
        </Box>

        {org?.message && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {org.message}
          </Typography>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {submitResult && (
          <Alert severity={submitResult.pa.status === 'accepted' ? 'success' : 'error'} sx={{ mb: 2 }}>
            {submitResult.pa.message}
          </Alert>
        )}

        <List dense disablePadding>
          {checks.map((c) => (
            <ListItem key={c.id} disableGutters sx={{ py: 0.25 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                {c.ok ? (
                  <CheckCircleIcon color="success" fontSize="small" />
                ) : (
                  <CancelIcon color="disabled" fontSize="small" />
                )}
              </ListItemIcon>
              <ListItemText
                primary={c.label}
                secondary={!c.ok ? c.hint : undefined}
                primaryTypographyProps={{ variant: 'body2' }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItem>
          ))}
        </List>

        {invoiceId && inv?.canGenerateFacturX && org?.planAllowsEInvoicing && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
            <Button
              variant="contained"
              startIcon={downloading ? <CircularProgress size={18} color="inherit" /> : <DownloadIcon />}
              disabled={downloading}
              onClick={handleDownload}
            >
              Télécharger Factur-X (XML)
            </Button>
            <Button
              variant="contained"
              color="warning"
              startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
              disabled={!canSubmitToPa || submitting}
              onClick={handleSubmitPa}
            >
              Envoyer à la PA
            </Button>
          </Box>
        )}

        <Alert severity="info" sx={{ mt: 2 }}>
          Envoi via Plateforme Agréée : disponible depuis la fiche facture (action « Envoyer à la PA ») lorsque le
          plan e-facture est actif et la facture prête.
        </Alert>
      </CardContent>
    </Card>
  )
}
