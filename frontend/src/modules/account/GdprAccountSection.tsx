import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import { Link as RouterLink } from 'react-router-dom'
import { gdprService } from '../../services/gdpr'
import { useAuthStore } from '../../stores/authStore'

export function GdprAccountSection() {
  const { user, logout } = useAuthStore()
  const [confirmEmail, setConfirmEmail] = useState('')
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleExport = async () => {
    setExporting(true)
    setError(null)
    try {
      await gdprService.downloadExport()
      setSuccess('Export téléchargé. Conservez-le en lieu sûr.')
    } catch (err: unknown) {
      setError((err as Error)?.message ?? 'Export impossible')
    } finally {
      setExporting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmEmail.trim()) {
      setError('Saisissez votre email pour confirmer la suppression')
      return
    }
    if (
      !window.confirm(
        'Suppression définitive : compte, organisation (si seul utilisateur) et données associées. Continuer ?',
      )
    ) {
      return
    }
    setDeleting(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await gdprService.deleteAccount(confirmEmail.trim())
      setSuccess(res.message)
      setTimeout(() => logout(), 2000)
    } catch (err: unknown) {
      setError((err as Error)?.message ?? 'Suppression impossible')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Données personnelles (RGPD)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Exportez vos données ou demandez la suppression de votre compte. Détails dans la{' '}
          <Button component={RouterLink} to="/privacy" size="small" sx={{ p: 0, minWidth: 0, verticalAlign: 'baseline' }}>
            politique de confidentialité
          </Button>
          .
        </Typography>
        {user?.email && (
          <Typography variant="body2" sx={{ mb: 2 }}>
            Compte connecté : <strong>{user.email}</strong>
          </Typography>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
          <Button
            variant="outlined"
            startIcon={exporting ? <CircularProgress size={18} /> : <DownloadIcon />}
            disabled={exporting}
            onClick={handleExport}
          >
            Télécharger mes données (JSON)
          </Button>
        </Box>
        <Typography variant="subtitle2" gutterBottom color="error.main">
          Zone de suppression
        </Typography>
        <TextField
          fullWidth
          label="Confirmer avec votre email"
          value={confirmEmail}
          onChange={(e) => setConfirmEmail(e.target.value)}
          margin="normal"
          size="small"
        />
        <Button
          color="error"
          variant="outlined"
          startIcon={deleting ? <CircularProgress size={18} color="inherit" /> : <DeleteForeverIcon />}
          disabled={deleting}
          onClick={handleDelete}
        >
          Supprimer mon compte et mes données
        </Button>
      </CardContent>
    </Card>
  )
}
