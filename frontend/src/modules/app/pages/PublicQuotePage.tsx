import { useEffect, useState } from 'react'
import { useParams, Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Alert
} from '@mui/material'
import { ApiClient } from '../../../services/apiClient'
import { formatCurrency, formatDate } from '../../../utils/formatters'

const api = ApiClient.getInstance()
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

/** Page publique d'affichage d'un devis par token. */
export function PublicQuotePage() {
  const { token } = useParams<{ token: string }>()
  const [quote, setQuote] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    api.get<any>(`public/quotes/${token}`).then((res: any) => {
      if (res?.id) setQuote(res)
      else if (res?.error) setError(res.error)
      else setError('Devis introuvable')
    }).catch(() => setError('Devis introuvable'))
  }, [token])

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Typography sx={{ mt: 2 }}>
          <RouterLink to="/">Retour à l'accueil</RouterLink>
        </Typography>
      </Container>
    )
  }

  if (!quote) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Typography>Chargement...</Typography>
      </Container>
    )
  }

  const clientName = quote.client?.name || quote.client?.companyName || ''
  const lines = quote.lines || []

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>
          Devis {quote.number}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Date : {formatDate(quote.date || quote.createdAt)} · Client : {clientName}
        </Typography>
        {quote.expiryDate && (
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Valable jusqu'au {formatDate(quote.expiryDate)}
          </Typography>
        )}

        <TableContainer sx={{ mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Description</TableCell>
                <TableCell align="right">Qté</TableCell>
                <TableCell align="right">Prix unit.</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lines.map((line: any) => (
                <TableRow key={line.id}>
                  <TableCell>{line.description}</TableCell>
                  <TableCell align="right">{line.quantity}</TableCell>
                  <TableCell align="right">{formatCurrency(Number(line.unitPrice || 0))}</TableCell>
                  <TableCell align="right">{formatCurrency(Number(line.total || 0))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Typography variant="h6" sx={{ mb: 3 }}>
          Total TTC : {formatCurrency(Number(quote.total || 0))}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            component="a"
            href={`${API_BASE}/public/quotes/${token}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            variant="outlined"
          >
            Télécharger le PDF
          </Button>
          {quote.status === 'SENT' && (
            <>
              <Button
                component={RouterLink}
                to={`/public/devis/${token}/accepter`}
                variant="contained"
                color="primary"
              >
                Accepter le devis
              </Button>
              <Button
                component={RouterLink}
                to={`/public/devis/${token}/refuser`}
                variant="outlined"
              >
                Refuser
              </Button>
            </>
          )}
        </Box>
      </Paper>
    </Container>
  )
}
