import { useEffect, useState } from 'react'
import { useParams, Link as RouterLink } from 'react-router-dom'
import { Container, Typography, Paper, Button, Alert } from '@mui/material'
import { ApiClient } from '../../../services/apiClient'

const api = ApiClient.getInstance()

/** Page publique : acceptation d'un devis par token. */
export function PublicQuoteAcceptPage() {
  const { token } = useParams<{ token: string }>()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState<string>('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Token manquant')
      return
    }
    api.post<any>(`public/quotes/${token}/accept`, {}).then((res: any) => {
      if (res?.status === 'accepted' || res?.id) {
        setStatus('success')
        setMessage('Devis accepté. Merci.')
      } else if (res?.error) {
        setStatus('error')
        setMessage(res.error)
      } else {
        setStatus('success')
        setMessage('Devis accepté.')
      }
    }).catch((err: any) => {
      setStatus('error')
      setMessage(err?.response?.data?.message || err?.message || 'Erreur lors de l\'acceptation.')
    })
  }, [token])

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper elevation={1} sx={{ p: 3, textAlign: 'center' }}>
        {status === 'loading' && <Typography>Enregistrement de votre acceptation...</Typography>}
        {status === 'success' && (
          <>
            <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>
            <Button component={RouterLink} to="/" variant="contained">Retour à l'accueil</Button>
          </>
        )}
        {status === 'error' && (
          <>
            <Alert severity="error" sx={{ mb: 2 }}>{message}</Alert>
            <Button component={RouterLink} to="/" variant="outlined">Retour à l'accueil</Button>
          </>
        )}
      </Paper>
    </Container>
  )
}
