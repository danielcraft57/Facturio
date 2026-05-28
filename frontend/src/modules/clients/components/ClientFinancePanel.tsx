import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import { CreditScore, Receipt, Tune } from '@mui/icons-material'
import type { ClientFinanceData, ClientMovementKind } from '../../../services/clientFinance'
import { ClientTaxSummaryCard } from './ClientTaxSummaryCard'
import { ClientMovementsTimeline } from './ClientMovementsTimeline'
import { ApplyAvoirToInvoiceDialog } from './ApplyAvoirToInvoiceDialog'
import { CreateClientCreditDialog } from './CreateClientCreditDialog'
import { CreateClientMiscOperationDialog } from './CreateClientMiscOperationDialog'

const MOVEMENT_FILTERS: Array<{ value: ClientMovementKind | 'all'; label: string }> = [
  { value: 'all', label: 'Tout' },
  { value: 'invoice', label: 'Factures' },
  { value: 'payment', label: 'Paiements' },
  { value: 'refund', label: 'Remboursements' },
  { value: 'credit_note', label: 'Avoirs' },
  { value: 'credit_applied', label: 'Imputations' },
  { value: 'misc', label: 'Op. diverses' },
  { value: 'quote', label: 'Devis' },
]

const MOVEMENT_PAGE = 40

type Props = {
  clientId: string
  finance: ClientFinanceData
  onReload: () => void
  onRefreshInvoices?: () => void
}

export function ClientFinancePanel({ clientId, finance, onReload, onRefreshInvoices }: Props) {
  const [movementFilter, setMovementFilter] = useState<ClientMovementKind | 'all'>('all')
  const [movementLimit, setMovementLimit] = useState(MOVEMENT_PAGE)
  const [applyOpen, setApplyOpen] = useState(false)
  const [creditOpen, setCreditOpen] = useState(false)
  const [miscOpen, setMiscOpen] = useState(false)

  const handleFinanceRefresh = () => {
    onReload()
    onRefreshInvoices?.()
  }

  const openInvoice = (invoiceId: string) => {
    void import('../../../utils/openDocumentView').then(({ openInvoiceView }) => openInvoiceView(invoiceId))
  }

  const openQuote = (quoteId: string) => {
    void import('../../../utils/openDocumentView').then(({ openQuoteView }) => openQuoteView(quoteId))
  }

  const filtered =
    movementFilter === 'all'
      ? finance.movements
      : finance.movements.filter((m) => m.kind === movementFilter)
  const visibleMovements = filtered.slice(0, movementLimit)
  const creditsAvailable = finance.avoirs.filter((a) => a.balance > 0.01).length

  return (
    <Stack spacing={2.5}>
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <ClientTaxSummaryCard taxes={finance.taxes} />
        </Box>
        <Card variant="outlined" sx={{ flex: 1, borderRadius: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              Actions
            </Typography>
            <Stack spacing={1}>
              <Button
                fullWidth
                variant="contained"
                size="small"
                startIcon={<CreditScore />}
                onClick={() => setApplyOpen(true)}
                disabled={
                  finance.balances.totalCreditsAvailable < 0.01 || finance.openInvoices.length === 0
                }
              >
                Imputer un avoir
              </Button>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                startIcon={<Receipt />}
                onClick={() => setCreditOpen(true)}
              >
                Créer un crédit client
              </Button>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                startIcon={<Tune />}
                onClick={() => setMiscOpen(true)}
              >
                Opération diverse
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      <Card variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'grey.50',
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ sm: 'center' }}
            justifyContent="space-between"
            spacing={1}
          >
            <Typography variant="subtitle1" fontWeight={700}>
              Historique des mouvements
            </Typography>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              <Chip size="small" label={`${finance.movements.length} événements`} />
              {creditsAvailable > 0 && (
                <Chip size="small" color="info" label={`${creditsAvailable} crédit(s) dispo.`} />
              )}
            </Stack>
          </Stack>
        </Box>
        <CardContent sx={{ pt: 1.5 }}>
          <Tabs
            value={movementFilter}
            onChange={(_, v) => {
              setMovementFilter(v)
              setMovementLimit(MOVEMENT_PAGE)
            }}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ mb: 2, minHeight: 40 }}
          >
            {MOVEMENT_FILTERS.map((f) => (
              <Tab key={f.value} label={f.label} value={f.value} sx={{ minHeight: 40, py: 1 }} />
            ))}
          </Tabs>
          <ClientMovementsTimeline
            movements={visibleMovements}
            kindFilter="all"
            onOpenInvoice={openInvoice}
            onOpenQuote={openQuote}
          />
          {filtered.length > movementLimit && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button size="small" onClick={() => setMovementLimit((n) => n + MOVEMENT_PAGE)}>
                Afficher plus ({filtered.length - movementLimit} restants)
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      <ApplyAvoirToInvoiceDialog
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        clientId={clientId}
        finance={finance}
        onApplied={handleFinanceRefresh}
      />
      <CreateClientCreditDialog
        open={creditOpen}
        onClose={() => setCreditOpen(false)}
        clientId={clientId}
        onCreated={handleFinanceRefresh}
      />
      <CreateClientMiscOperationDialog
        open={miscOpen}
        onClose={() => setMiscOpen(false)}
        clientId={clientId}
        onCreated={handleFinanceRefresh}
      />
    </Stack>
  )
}
