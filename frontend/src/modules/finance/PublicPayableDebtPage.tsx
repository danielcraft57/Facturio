import { useCallback, useEffect, useState } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Container,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material'
import { ApiClient } from '../../services/apiClient'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { PublicDataProcessingNotice } from '../legal/PublicDataProcessingNotice'
import { PayableDebtLegalNotice } from './components/PayableDebtLegalNotice'
import { TablePageSkeleton } from '../../components/loading/TablePageSkeleton'
import type { PublicPayableDebtView } from '../../services/payables'

const api = ApiClient.getInstance()

function publicStatusLabel(status: string): string {
  switch (status) {
    case 'PAID':
      return 'Soldée'
    case 'PARTIAL':
      return 'Partiellement remboursée'
    case 'CANCELLED':
      return 'Annulée'
    default:
      return 'En cours'
  }
}

/** Page publique reconnaissance de dette (lien email /dette/:token). */
export function PublicPayableDebtPage() {
  const { token } = useParams<{ token: string }>()
  const [debt, setDebt] = useState<PublicPayableDebtView | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!token) return
    return api
      .get<PublicPayableDebtView>(`public/dettes/${token}`)
      .then((res: unknown) => {
        const data =
          res && typeof res === 'object' && 'label' in (res as object)
            ? (res as PublicPayableDebtView)
            : (res as { data?: PublicPayableDebtView })?.data
        if (data?.label) {
          setDebt(data)
          setError(null)
        } else {
          setError('Document introuvable')
        }
      })
      .catch(() => setError('Document introuvable'))
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Typography sx={{ mt: 2 }}>
          <RouterLink to="/">Retour à l&apos;accueil</RouterLink>
        </Typography>
      </Container>
    )
  }

  if (!debt) {
    return (
      <Box sx={{ py: 4 }}>
        <TablePageSkeleton rows={4} />
      </Box>
    )
  }

  const isSettled = debt.balance <= 0.01 || debt.status === 'PAID'

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="overline" color="text.secondary">
          Reconnaissance de dette
        </Typography>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
          {debt.label}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Émis par {debt.issuerName} · Créancier : {debt.creditorName}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Date : {formatDate(debt.createdAt)}
          {debt.dueDate ? ` · Échéance indicative : ${formatDate(debt.dueDate)}` : ''}
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Statut : {publicStatusLabel(debt.status)}
        </Typography>

        {isSettled ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            Cette dette est soldée.
          </Alert>
        ) : (
          <Alert severity="info" sx={{ mb: 2 }}>
            Reste à rembourser : {formatCurrency(debt.balance)} {debt.currency}
          </Alert>
        )}

        <Table size="small" sx={{ mb: 2 }}>
          <TableBody>
            <TableRow>
              <TableCell>Montant initial</TableCell>
              <TableCell align="right">{formatCurrency(debt.totalAmount)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Déjà remboursé</TableCell>
              <TableCell align="right">{formatCurrency(debt.totalPaid)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Solde</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                {formatCurrency(debt.balance)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        {debt.notes?.trim() && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Notes
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
              {debt.notes}
            </Typography>
          </>
        )}

        <Box sx={{ mt: 3 }}>
          <PayableDebtLegalNotice variant="full" />
        </Box>
      </Paper>
      <PublicDataProcessingNotice
        issuerName={debt.issuerName}
        processingPurpose="la reconnaissance et le suivi de cette dette"
      />
    </Container>
  )
}
