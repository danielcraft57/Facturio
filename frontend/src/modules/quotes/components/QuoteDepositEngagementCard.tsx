import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from '@mui/material'
import { MoneyOff, OpenInNew } from '@mui/icons-material'
import { quoteService } from '../../../services/quoteService'
import { unwrapApiPayload } from '../../../services/clients'
import { refundsService } from '../../../services/refunds'
import { formatCurrency } from '../../../utils/formatters'
import { CancelDepositDialog } from '../../invoices/components/CancelDepositDialog'
import { useToast } from '../../../components/useToast'

type DepositContext = {
  hasSplit: boolean
  deposit: {
    id: string
    number: string
    status: string
    total: number
    balance: number
    netPaid: number
    depositRefunded: boolean
  } | null
  remainder: { id: string; number: string; status: string; total: number; balance: number } | null
}

interface QuoteDepositEngagementCardProps {
  quoteId: string
}

export function QuoteDepositEngagementCard({ quoteId }: QuoteDepositEngagementCardProps) {
  const navigate = useNavigate()
  const toast = useToast()
  const [ctx, setCtx] = useState<DepositContext | null>(null)
  const [cancelOpen, setCancelOpen] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await quoteService.getDepositContext(quoteId)
      setCtx(unwrapApiPayload<DepositContext>(res))
    } catch {
      setCtx(null)
    }
  }, [quoteId])

  useEffect(() => {
    void load()
  }, [load])

  if (!ctx?.hasSplit || !ctx.deposit) return null

  const { deposit, remainder } = ctx
  const canCancel =
    !deposit.depositRefunded && deposit.netPaid > 0.01 && deposit.status !== 'CANCELLED'

  return (
    <>
      <Card variant="outlined" sx={{ mb: 2, borderColor: deposit.depositRefunded ? 'success.light' : 'warning.light' }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Contrat d&apos;engagement — acompte 10 %
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Facture d&apos;acompte et facture de solde liées à ce devis.
              </Typography>
            </Box>
            {deposit.depositRefunded ? (
              <Chip label="Acompte remboursé" color="success" />
            ) : deposit.netPaid > 0 ? (
              <Chip label="Acompte encaissé" color="success" variant="outlined" />
            ) : (
              <Chip label="Acompte en attente" color="warning" variant="outlined" />
            )}
          </Stack>

          <Stack spacing={1} sx={{ mt: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Typography variant="body2" fontWeight={700}>
                Acompte {deposit.number}
              </Typography>
              <Typography variant="body2">{formatCurrency(deposit.total)}</Typography>
              <Button
                size="small"
                endIcon={<OpenInNew />}
                onClick={() => navigate(`/factures/${deposit.id}`)}
              >
                Ouvrir
              </Button>
            </Stack>
            {remainder && (
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Typography variant="body2" fontWeight={700}>
                  Solde {remainder.number}
                </Typography>
                <Chip
                  size="small"
                  label={remainder.status === 'CANCELLED' ? 'Annulé' : remainder.status}
                  color={remainder.status === 'CANCELLED' ? 'default' : 'primary'}
                  variant="outlined"
                />
                <Button
                  size="small"
                  endIcon={<OpenInNew />}
                  onClick={() => navigate(`/factures/${remainder.id}`)}
                >
                  Ouvrir
                </Button>
              </Stack>
            )}
          </Stack>

          {canCancel && (
            <Alert severity="warning" sx={{ mt: 2 }} action={
              <Button color="inherit" size="small" onClick={() => setCancelOpen(true)}>
                Annuler
              </Button>
            }>
              Remboursement possible : annule le contrat, crée l&apos;avoir comptable et annule le solde.
            </Alert>
          )}

          {canCancel && (
            <Button
              sx={{ mt: 2 }}
              variant="outlined"
              color="error"
              startIcon={<MoneyOff />}
              onClick={() => setCancelOpen(true)}
            >
              Annuler le contrat et rembourser l&apos;acompte
            </Button>
          )}
        </CardContent>
      </Card>

      <CancelDepositDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        invoiceNumber={deposit.number}
        hasStripePayments={false}
        onSubmit={async (payload) => {
          const result = await refundsService.cancelDeposit(deposit.id, payload)
          toast.success(`Contrat annulé — avoir ${result.avoir.number}`)
          await load()
        }}
      />
    </>
  )
}
