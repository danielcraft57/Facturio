import { useEffect, useState } from 'react'
import { useParams, Link as RouterLink } from 'react-router-dom'
import { Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Alert } from '@mui/material'
import { ApiClient } from '../../../services/apiClient'
import { formatCurrency, formatDate } from '../../../utils/formatters'

const api = ApiClient.getInstance()
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

/**
 * Page publique d'affichage d'une facture par token.
 * Affiche le détail de la facture et un lien vers le PDF.
 */
export function PublicInvoicePage() {
  const { token } = useParams<{ token: string }>()
  const [invoice, setInvoice] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    api.get<any>(`public/invoices/${token}`).then((res: any) => {
      if (res?.id) setInvoice(res)
      else if (res?.error) setError(res.error)
      else setError('Facture introuvable')
    }).catch(() => setError('Facture introuvable'))
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

  if (!invoice) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Typography>Chargement...</Typography>
      </Container>
    )
  }

  const clientName = invoice.client?.name || invoice.client?.companyName || ''
  const lines = invoice.lines || []

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>
          Facture {invoice.number}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Date : {formatDate(invoice.date || invoice.createdAt)} · Client : {clientName}
        </Typography>
        {invoice.dueDate && (
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Échéance : {formatDate(invoice.dueDate)}
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
          Total TTC : {formatCurrency(Number(invoice.total || 0))}
        </Typography>

        <Button
          component="a"
          href={`${API_BASE}/public/invoices/${token}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          variant="contained"
        >
          Télécharger le PDF
        </Button>
      </Paper>
    </Container>
  )
}
