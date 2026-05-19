import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material'
import type { Client } from '../../../services/clients'

export type ClientFormValues = {
  name: string
  email: string
  phone: string
  siren: string
  address: string
  status: Client['status']
}

type Props = {
  open: boolean
  mode: 'create' | 'edit'
  values: ClientFormValues
  error: string | null
  saving: boolean
  onClose: () => void
  onChange: (values: ClientFormValues) => void
  onSubmit: () => void
  onClearError: () => void
}

export function ClientFormDialog({
  open,
  mode,
  values,
  error,
  saving,
  onClose,
  onChange,
  onSubmit,
  onClearError,
}: Props) {
  return (
    <Dialog open={open} onClose={() => !saving && onClose()} maxWidth="md" fullWidth>
      <DialogTitle>{mode === 'create' ? 'Nouveau client' : 'Modifier le client'}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={onClearError}>
            {error}
          </Alert>
        )}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            gap: 2,
            mt: 1,
          }}
        >
          <TextField
            fullWidth
            required
            label="Nom de l'entreprise"
            value={values.name}
            onChange={e => onChange({ ...values, name: e.target.value })}
          />
          <TextField
            fullWidth
            required
            label="Email"
            type="email"
            value={values.email}
            onChange={e => onChange({ ...values, email: e.target.value })}
          />
          <TextField
            fullWidth
            label="Téléphone"
            value={values.phone}
            onChange={e => onChange({ ...values, phone: e.target.value })}
          />
          <TextField
            fullWidth
            label="SIREN (client B2B)"
            placeholder="9 chiffres"
            value={values.siren}
            onChange={e => onChange({ ...values, siren: e.target.value.replace(/\D/g, '').slice(0, 9) })}
            helperText="Requis pour la facturation électronique B2B (réforme 2026)"
            inputProps={{ inputMode: 'numeric', maxLength: 9 }}
          />
          <FormControl fullWidth>
            <InputLabel>Statut (affichage)</InputLabel>
            <Select
              label="Statut (affichage)"
              value={values.status}
              onChange={e => onChange({ ...values, status: e.target.value as Client['status'] })}
            >
              <MenuItem value="active">Actif</MenuItem>
              <MenuItem value="inactive">Inactif</MenuItem>
              <MenuItem value="prospect">Prospect</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Adresse"
            multiline
            rows={3}
            value={values.address}
            onChange={e => onChange({ ...values, address: e.target.value })}
            sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Annuler
        </Button>
        <Button variant="contained" onClick={onSubmit} disabled={saving}>
          {saving ? (
            <CircularProgress size={22} color="inherit" />
          ) : mode === 'create' ? (
            'Créer le client'
          ) : (
            'Enregistrer'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export function clientToFormValues(client: Client): ClientFormValues {
  return {
    name: client.name,
    email: client.email,
    phone: client.phone || '',
    siren: client.siren || '',
    address: client.address?.street || '',
    status: client.status,
  }
}

export const emptyClientFormValues: ClientFormValues = {
  name: '',
  email: '',
  phone: '',
  siren: '',
  address: '',
  status: 'prospect',
}
