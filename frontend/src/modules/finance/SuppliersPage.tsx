import { useCallback, useEffect, useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { PageHeader } from '../../components/finance/PageHeader'
import { financePagePadding, financePrimaryButtonSx } from '../../components/finance/financeStyles'
import { BillingFeatureGate } from '../../components/billing/BillingFeatureGate'
import {
  suppliersService,
  type CreateSupplierPayload,
  type Supplier,
} from '../../services/suppliers'

/**
 * Page référentiel fournisseurs (SIRET, TVA, conditions).
 */
export function SuppliersPage() {
  const [rows, setRows] = useState<Supplier[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<CreateSupplierPayload>({ name: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    suppliersService
      .list()
      .then(setRows)
      .catch(() => setRows([]))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleCreate = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    setError(null)
    try {
      await suppliersService.create(form)
      setOpen(false)
      setForm({ name: '' })
      load()
    } catch {
      setError('Impossible de créer le fournisseur')
    } finally {
      setSaving(false)
    }
  }

  return (
    <BillingFeatureGate feature="financeModule" featureLabel="La gestion des fournisseurs">
      <Box sx={{ p: financePagePadding }}>
        <PageHeader
          title="Fournisseurs"
          subtitle="Référentiel avec SIRET, TVA et conditions de paiement - lié aux dettes"
          actions={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpen(true)}
              sx={financePrimaryButtonSx}
            >
              Nouveau fournisseur
            </Button>
          }
        />

        {rows.length === 0 ? (
          <Typography color="text.secondary">Aucun fournisseur pour l&apos;instant.</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nom</TableCell>
                <TableCell>SIRET</TableCell>
                <TableCell>TVA</TableCell>
                <TableCell>Email</TableCell>
                <TableCell align="right">Délai (j)</TableCell>
                <TableCell>Statut</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((s) => (
                <TableRow key={s.id} hover>
                  <TableCell>
                    <Typography fontWeight={600}>{s.name}</Typography>
                    {s.city && (
                      <Typography variant="caption" color="text.secondary">
                        {s.zipCode} {s.city}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{s.siret || '-'}</TableCell>
                  <TableCell>{s.vatNumber || '-'}</TableCell>
                  <TableCell>{s.email || '-'}</TableCell>
                  <TableCell align="right">{s.paymentTermsDays}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={s.isActive ? 'Actif' : 'Inactif'}
                      color={s.isActive ? 'success' : 'default'}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Nouveau fournisseur</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Nom"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                fullWidth
              />
              <TextField
                label="SIRET"
                value={form.siret || ''}
                onChange={(e) => setForm((f) => ({ ...f, siret: e.target.value }))}
                fullWidth
              />
              <TextField
                label="N° TVA"
                value={form.vatNumber || ''}
                onChange={(e) => setForm((f) => ({ ...f, vatNumber: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Email"
                value={form.email || ''}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Délai de paiement (jours)"
                type="number"
                value={form.paymentTermsDays ?? 30}
                onChange={(e) =>
                  setForm((f) => ({ ...f, paymentTermsDays: parseInt(e.target.value, 10) || 30 }))
                }
                fullWidth
              />
              <TextField
                label="Notes"
                value={form.notes || ''}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                fullWidth
                multiline
                minRows={2}
              />
              {error && (
                <Typography color="error" variant="body2">
                  {error}
                </Typography>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Annuler</Button>
            <Button variant="contained" onClick={handleCreate} disabled={saving || !form.name.trim()}>
              Créer
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </BillingFeatureGate>
  )
}
