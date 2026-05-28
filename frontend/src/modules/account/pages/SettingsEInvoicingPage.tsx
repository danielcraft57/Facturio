import { Alert, Box, Button, Chip, CircularProgress, Stack, Typography, alpha } from '@mui/material'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { EInvoicingReadinessPanel } from '../../e-invoicing/EInvoicingReadinessPanel'
import { eInvoicingService, type PaConnectionStatus, type PaConnectionTestResult } from '../../../services/eInvoicing'

export function SettingsEInvoicingPage() {
  const [paStatus, setPaStatus] = useState<PaConnectionStatus | null>(null)
  const [paTest, setPaTest] = useState<PaConnectionTestResult | null>(null)
  const [loadingPa, setLoadingPa] = useState(false)
  const [testingPa, setTestingPa] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoadingPa(true)
    void eInvoicingService
      .getPaStatus()
      .then((s) => {
        if (!cancelled) setPaStatus(s)
      })
      .catch(() => {
        if (!cancelled) setError('Impossible de charger le statut PA')
      })
      .finally(() => {
        if (!cancelled) setLoadingPa(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleTestPa = async () => {
    setTestingPa(true)
    setError(null)
    setPaTest(null)
    try {
      const res = await eInvoicingService.testPaConnection()
      setPaTest(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Test PA impossible')
    } finally {
      setTestingPa(false)
    }
  }

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
        Facturation électronique 2026
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Préparez la réforme B2B : SIRET, SIREN clients, export Factur-X et suivi de conformité.
      </Typography>

      <Box
        sx={{
          mb: 3,
          p: 2,
          borderRadius: 2,
          border: 1,
          borderColor: 'divider',
          bgcolor: (t) => alpha(t.palette.warning.main, 0.06),
        }}
      >
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
          Plateforme Agréée partenaire
        </Typography>
        {error && (
          <Alert severity="warning" sx={{ mb: 1.5 }}>
            {error}
          </Alert>
        )}
        <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 1.5, alignItems: 'center' }}>
          <Chip
            label={
              loadingPa
                ? 'Chargement…'
                : paStatus?.configured
                  ? `Configurée (${paStatus.mode})`
                  : 'Non configurée (mock)'
            }
            color={paStatus?.configured ? 'success' : 'default'}
            variant={paStatus?.configured ? 'filled' : 'outlined'}
            size="small"
          />
          {paStatus?.provider && <Chip label={`Provider: ${paStatus.provider}`} size="small" variant="outlined" />}
          {paStatus?.baseUrl && <Chip label={paStatus.baseUrl} size="small" variant="outlined" />}
        </Stack>
        {paTest && (
          <Alert severity={paTest.ok ? 'success' : 'error'} sx={{ mb: 1.5 }}>
            {paTest.message}
          </Alert>
        )}
        <Button
          onClick={() => void handleTestPa()}
          size="small"
          variant="contained"
          color="warning"
          startIcon={testingPa ? <CircularProgress size={16} color="inherit" /> : undefined}
          disabled={testingPa}
        >
          Tester la connexion PA
        </Button>
      </Box>

      <EInvoicingReadinessPanel />
      <Box
        sx={{
          mt: 3,
          p: 2,
          borderRadius: 2,
          border: 1,
          borderColor: 'divider',
          bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Calendrier réglementaire, obligations et feuille de route détaillée.
        </Typography>
        <Button component={RouterLink} to="/facturation-electronique" size="small" endIcon={<OpenInNewIcon />}>
          Guide réforme 2026
        </Button>
      </Box>
    </Box>
  )
}
