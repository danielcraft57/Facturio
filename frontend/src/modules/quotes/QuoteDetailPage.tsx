import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  GridLegacy,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { ArrowBack, Edit, OpenInNew, Send } from '@mui/icons-material'
import { quoteService } from '../../services/quoteService'
import { unwrapApiPayload } from '../../services/clients'
import type { Quote } from '../../types/quote'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { FinanceDocumentBreadcrumb } from '../../components/finance/FinanceDocumentBreadcrumb'
import { TablePageSkeleton } from '../../components/loading/TablePageSkeleton'
import { isEntityId } from '../../utils/entityId'
import { usePageTitle } from '../../hooks/usePageTitle'
import { SendQuoteDialog, type SendQuotePayload } from './components/SendQuoteDialog'
import { useToast } from '../../components/useToast'
import { openInvoiceView } from '../../utils/openDocumentView'
import { QuoteDepositEngagementCard } from './components/QuoteDepositEngagementCard'
import { resolveQuoteDisplayStatus } from './quoteDisplayStatus'
import { useRealtimePanelHighlight } from '../../hooks/useRealtimeRowHighlight'
import { getRealtimePanelSx } from '../../utils/realtimeRowHighlight'

function formatTaxRate(rate: number | undefined): string {
  const r = Number(rate ?? 0)
  if (r > 0 && r <= 1) return `${Math.round(r * 100)} %`
  return `${r} %`
}

export function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const panelHighlight = useRealtimePanelHighlight('quotes', id)
  const initialLoadDone = useRef(false)

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!id || !isEntityId(id)) {
      setError('Devis introuvable')
      setLoading(false)
      return
    }
    if (!opts?.silent) setLoading(true)
    setError(null)
    try {
      const data = await quoteService.getQuote(id)
      setQuote(data)
      initialLoadDone.current = true
    } catch (err: unknown) {
      setQuote(null)
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement du devis')
    } finally {
      if (!opts?.silent) setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!id) return
    const onRealtime = (ev: Event) => {
      const detail = (ev as CustomEvent<{ id?: string | number }>).detail
      if (detail?.id != null && String(detail.id) === id) {
        void load({ silent: initialLoadDone.current })
      }
    }
    window.addEventListener('facturio:quote-realtime', onRealtime)
    return () => window.removeEventListener('facturio:quote-realtime', onRealtime)
  }, [id, load])

  usePageTitle(
    loading
      ? 'Chargement du devis…'
      : quote
        ? `Devis ${quote.number}`
        : error
          ? 'Devis introuvable'
          : null,
  )

  const handleSendQuote = async (payload: SendQuotePayload) => {
    if (!quote) return
    try {
      setSending(true)
      const res = await quoteService.sendQuote(quote.id, payload)
      const body = unwrapApiPayload<{ copiesSent?: string[] }>(res)
      const copies = body?.copiesSent ?? []
      let msg = `Devis ${quote.number} envoyé à ${payload.to}`
      if (copies.length > 0) {
        msg += ` — copie(s) : ${copies.join(', ')}`
      }
      toast.success(msg)
      setSendDialogOpen(false)
      await load({ silent: true })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'envoi du devis")
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        <TablePageSkeleton rows={5} />
      </Box>
    )
  }

  if (error || !quote) {
    return (
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        <FinanceDocumentBreadcrumb
          items={[
            { label: 'Devis', to: '/devis/inbox' },
            { label: 'Devis introuvable' },
          ]}
        />
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/devis/inbox')} sx={{ mb: 2 }}>
          Retour aux devis
        </Button>
        <Alert severity="error">{error || 'Devis introuvable'}</Alert>
      </Box>
    )
  }

  const canEdit = quote.status === 'DRAFT' || quote.status === 'SENT'
  const canSend = quote.status === 'DRAFT'

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, ...getRealtimePanelSx(panelHighlight) }}>
      <FinanceDocumentBreadcrumb
        items={[
          { label: 'Devis', to: '/devis/inbox' },
          { label: quote.number },
        ]}
      />
      <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap" justifyContent="flex-end">
        {canEdit && (
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => navigate(`/devis/${quote.id}/edit`)}
          >
            Modifier
          </Button>
        )}
        {canSend && (
          <Button variant="contained" startIcon={<Send />} onClick={() => setSendDialogOpen(true)}>
            Envoyer
          </Button>
        )}
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 2 }}>
        <Typography variant="h4" component="h1">
          Devis {quote.number}
        </Typography>
        {(() => {
          const display = resolveQuoteDisplayStatus(quote)
          return <Chip label={display.label} color={display.color} size="small" />
        })()}
        {quote.important && <Chip label="Important" color="warning" size="small" variant="outlined" />}
        {quote.starred && <Chip label="Favori" size="small" variant="outlined" />}
      </Stack>

      {(quote.tags?.length ?? 0) > 0 && (
        <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mb: 2 }}>
          {quote.tags!.map((tag) => (
            <Chip key={tag} label={tag} size="small" variant="outlined" />
          ))}
        </Stack>
      )}

      <QuoteDepositEngagementCard quoteId={quote.id} />

      <GridLegacy container spacing={2} sx={{ mb: 3 }}>
        <GridLegacy item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Client
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {quote.client?.name ?? '—'}
              </Typography>
              {quote.client?.isCompany && (
                <Chip label="Professionnel" size="small" sx={{ mt: 1 }} variant="outlined" />
              )}
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Email : {quote.client?.email?.trim() || '—'}
              </Typography>
              {quote.client?.isVatExempt && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                  Client exonéré de TVA
                </Typography>
              )}
            </CardContent>
          </Card>
        </GridLegacy>
        <GridLegacy item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Dates & suivi
              </Typography>
              <Stack spacing={0.5}>
                <Typography variant="body2">
                  <strong>Émission :</strong> {formatDate(quote.date)}
                </Typography>
                {quote.expiryDate && (
                  <Typography variant="body2">
                    <strong>Validité :</strong> {formatDate(quote.expiryDate)}
                  </Typography>
                )}
                <Typography variant="body2">
                  <strong>Créé le :</strong> {formatDate(quote.createdAt)}
                </Typography>
                {quote.sentAt && (
                  <Typography variant="body2">
                    <strong>Envoyé le :</strong> {formatDate(quote.sentAt)}
                  </Typography>
                )}
                {quote.acceptedAt && (
                  <Typography variant="body2">
                    <strong>Accepté le :</strong> {formatDate(quote.acceptedAt)}
                  </Typography>
                )}
                {quote.seenAt && (
                  <Typography variant="body2" color="text.secondary">
                    Vu le {formatDate(quote.seenAt)}
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </GridLegacy>
      </GridLegacy>

      {quote.invoiceId && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Converti en facture{' '}
          {quote.invoiceNumber ? (
            <strong>{quote.invoiceNumber}</strong>
          ) : (
            <span>(réf. {quote.invoiceId})</span>
          )}
          .{' '}
          <Button
            size="small"
            startIcon={<OpenInNew />}
            onClick={() => openInvoiceView(quote.invoiceId!)}
            sx={{ ml: 1 }}
          >
            Voir la facture
          </Button>
        </Alert>
      )}

      <TableContainer sx={{ mb: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Description</TableCell>
              <TableCell align="right">Qté</TableCell>
              <TableCell align="right">Prix unit. HT</TableCell>
              <TableCell align="right">TVA</TableCell>
              <TableCell align="right">Total TTC</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(quote.lines ?? []).map((line, index) => (
              <TableRow key={line.id ?? index}>
                <TableCell>{line.description}</TableCell>
                <TableCell align="right">{line.quantity}</TableCell>
                <TableCell align="right">{formatCurrency(line.unitPrice)}</TableCell>
                <TableCell align="right">{formatTaxRate(line.taxRate)}</TableCell>
                <TableCell align="right">{formatCurrency(line.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Card variant="outlined" sx={{ maxWidth: 360, ml: 'auto' }}>
        <CardContent>
          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Total HT
              </Typography>
              <Typography variant="body2">{formatCurrency(quote.subtotal)}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                TVA
              </Typography>
              <Typography variant="body2">{formatCurrency(quote.tax)}</Typography>
            </Stack>
            <Divider />
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="subtitle1" fontWeight={700}>
                Total TTC
              </Typography>
              <Typography variant="subtitle1" fontWeight={700}>
                {formatCurrency(quote.total)}
              </Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <SendQuoteDialog
        open={sendDialogOpen}
        quote={quote}
        onClose={() => setSendDialogOpen(false)}
        onSend={handleSendQuote}
        sending={sending}
      />
    </Box>
  )
}
