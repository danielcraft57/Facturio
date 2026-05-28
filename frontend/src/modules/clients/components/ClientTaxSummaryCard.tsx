import { Card, CardContent, Typography, Stack, Box, Divider } from '@mui/material'
import type { ClientFinanceTaxes } from '../../../services/clientFinance'
import { formatCurrency } from '../../../utils/formatters'

type Props = {
  taxes: ClientFinanceTaxes
}

export function ClientTaxSummaryCard({ taxes }: Props) {
  return (
    <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          TVA (vue client)
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
          TVA collectée sur factures réglées ; TVA créditée via avoirs émis pour ce client.
        </Typography>
        <Stack spacing={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              CA HT (factures soldées)
            </Typography>
            <Typography variant="body2">{formatCurrency(taxes.revenueHt)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              TVA collectée
            </Typography>
            <Typography variant="body2">{formatCurrency(taxes.vatCollected)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              TVA créditée (avoirs)
            </Typography>
            <Typography variant="body2" color="info.main">
              −{formatCurrency(taxes.vatCredited)}
            </Typography>
          </Box>
          <Divider />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" fontWeight={700}>
              TVA nette
            </Typography>
            <Typography variant="body2" fontWeight={700}>
              {formatCurrency(taxes.netVat)}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}
