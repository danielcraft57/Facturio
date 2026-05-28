import { useEffect, useState } from 'react'
import { Box, Button, Card, CardContent, Grid, Stack, Typography, alpha, useTheme } from '@mui/material'
import LocalAtmIcon from '@mui/icons-material/LocalAtm'
import GavelIcon from '@mui/icons-material/Gavel'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { Link as RouterLink } from 'react-router-dom'
import { PageHeader } from '../../components/finance/PageHeader'
import { financeCardSx, financeKpiGradients, financePagePadding, financePrimaryButtonSx } from '../../components/finance/financeStyles'
import { accountingService, type FinanceSummary } from '../../services/accounting'
import { unwrapApiPayload } from '../../services/clients'
import { formatCurrency } from '../../utils/formatters'

const shortcuts = [
  {
    title: 'Déclarations',
    description: 'TVA, obligations légales et échéances fiscales',
    to: '/declarations',
    icon: <GavelIcon />,
    accent: financeKpiGradients.unpaid,
  },
  {
    title: 'Comptabilité',
    description: 'Plan comptable, balance et grand livre',
    to: '/comptabilite',
    icon: <AccountBalanceIcon />,
    accent: financeKpiGradients.revenue,
  },
] as const

export function TaxesPage() {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const [summary, setSummary] = useState<FinanceSummary | null>(null)

  useEffect(() => {
    const start = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
    const end = new Date().toISOString().split('T')[0]
    accountingService
      .getSummary(start, end)
      .then((res) => setSummary(unwrapApiPayload(res)))
      .catch(() => setSummary(null))
  }, [])

  return (
    <Box sx={{ p: financePagePadding }}>
      <PageHeader
        title="Taxes"
        subtitle="TVA, obligations fiscales et liens vers vos déclarations"
      />

      <Card
        sx={{
          mb: 3,
          ...financeCardSx,
          background: isDark ? alpha('#1e3a5f', 0.35) : alpha('#1e40af', 0.04),
        }}
      >
        <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: isDark ? alpha('#3b82f6', 0.2) : alpha('#1e40af', 0.1),
              color: 'primary.main',
            }}
          >
            <LocalAtmIcon />
          </Box>
          <Box sx={{ flex: 1, minWidth: 240 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Centre fiscal
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 560 }}>
              Indicateurs issus de vos factures payées sur l&apos;année en cours. La TVA collectée
              (compte 44571) alimente vos déclarations et la comptabilité.
            </Typography>
            {summary && (
              <Grid container spacing={1.5} sx={{ mb: 2, maxWidth: 640 }}>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <Typography variant="caption" color="text.secondary">
                    CA HT payé
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {formatCurrency(summary.revenueHt)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <Typography variant="caption" color="text.secondary">
                    TVA collectée
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {formatCurrency(summary.vatCollected)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" color="text.secondary">
                    Factures payées
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {summary.paidInvoicesCount}
                  </Typography>
                </Grid>
              </Grid>
            )}
            <Button
              component={RouterLink}
              to="/declarations"
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              sx={financePrimaryButtonSx}
            >
              Voir les déclarations
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: '0.12em', mb: 1.5, display: 'block' }}>
        Accès rapide
      </Typography>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        {shortcuts.map((item) => (
          <Card
            key={item.to}
            component={RouterLink}
            to={item.to}
            sx={{
              flex: 1,
              textDecoration: 'none',
              color: 'inherit',
              ...financeCardSx,
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              '&:hover': { transform: 'translateY(-2px)' },
            }}
          >
            <Box
              sx={{
                height: 6,
                background: item.accent,
              }}
            />
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Box sx={{ color: 'primary.main' }}>{item.icon}</Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  {item.title}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {item.description}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  )
}
