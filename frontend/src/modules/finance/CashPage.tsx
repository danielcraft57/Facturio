import { useCallback, useEffect, useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { PageHeader } from '../../components/finance/PageHeader'
import { financePagePadding, financePrimaryButtonSx } from '../../components/finance/financeStyles'
import { BillingFeatureGate } from '../../components/billing/BillingFeatureGate'
import { formatCurrency } from '../../utils/formatters'
import { cashService, type CashMovement, type CashRegister } from '../../services/cash'

/**
 * Page caisse : fond de caisse et mouvements espèces.
 */
export function CashPage() {
  const [registers, setRegisters] = useState<CashRegister[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [movements, setMovements] = useState<CashMovement[]>([])
  const [balance, setBalance] = useState(0)
  const [openReg, setOpenReg] = useState(false)
  const [openMov, setOpenMov] = useState(false)
  const [regName, setRegName] = useState('Caisse principale')
  const [opening, setOpening] = useState(0)
  const [movForm, setMovForm] = useState({
    type: 'IN' as 'IN' | 'OUT' | 'ADJUSTMENT',
    amount: 0,
    label: '',
    category: '',
  })

  const loadRegisters = useCallback(async () => {
    const list = await cashService.listRegisters().catch(() => [])
    setRegisters(list)
    if (list.length && selectedId == null) setSelectedId(list[0].id)
  }, [selectedId])

  const loadDetail = useCallback(async (id: number) => {
    const detail = await cashService.getRegister(id).catch(() => null)
    if (!detail) return
    setMovements(detail.movements || [])
    setBalance(Number(detail.currentBalance))
  }, [])

  useEffect(() => {
    loadRegisters()
  }, [loadRegisters])

  useEffect(() => {
    if (selectedId != null) loadDetail(selectedId)
  }, [selectedId, loadDetail])

  const createRegister = async () => {
    const created = await cashService.createRegister({
      name: regName,
      openingBalance: opening,
    })
    setOpenReg(false)
    setSelectedId(created.id)
    await loadRegisters()
  }

  const addMovement = async () => {
    if (selectedId == null || !movForm.label.trim() || movForm.amount <= 0) return
    await cashService.addMovement(selectedId, {
      type: movForm.type,
      amount: movForm.amount,
      label: movForm.label,
      category: movForm.category || undefined,
    })
    setOpenMov(false)
    setMovForm({ type: 'IN', amount: 0, label: '', category: '' })
    await loadDetail(selectedId)
    await loadRegisters()
  }

  return (
    <BillingFeatureGate feature="financeModule" featureLabel="La caisse">
      <Box sx={{ p: financePagePadding }}>
        <PageHeader
          title="Caisse"
          subtitle="Fond de caisse et mouvements espèces"
          actions={
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={() => setOpenReg(true)}>
                Nouvelle caisse
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                disabled={selectedId == null}
                onClick={() => setOpenMov(true)}
                sx={financePrimaryButtonSx}
              >
                Mouvement
              </Button>
            </Stack>
          }
        />

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
          {registers.map((r) => (
            <Button
              key={r.id}
              variant={selectedId === r.id ? 'contained' : 'outlined'}
              onClick={() => setSelectedId(r.id)}
            >
              {r.name} - {formatCurrency(Number(r.currentBalance))}
            </Button>
          ))}
        </Stack>

        {selectedId == null ? (
          <Typography color="text.secondary">
            Créez une caisse pour commencer (ex. fond de caisse magasin).
          </Typography>
        ) : (
          <>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
              Solde : {formatCurrency(balance)}
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Libellé</TableCell>
                  <TableCell align="right">Montant</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {movements.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{String(m.date).slice(0, 10)}</TableCell>
                    <TableCell>{m.type}</TableCell>
                    <TableCell>{m.label}</TableCell>
                    <TableCell align="right">{formatCurrency(Number(m.amount))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}

        <Dialog open={openReg} onClose={() => setOpenReg(false)} fullWidth maxWidth="xs">
          <DialogTitle>Nouvelle caisse</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Nom" value={regName} onChange={(e) => setRegName(e.target.value)} fullWidth />
              <TextField
                label="Fond d'ouverture"
                type="number"
                value={opening}
                onChange={(e) => setOpening(parseFloat(e.target.value) || 0)}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenReg(false)}>Annuler</Button>
            <Button variant="contained" onClick={createRegister}>
              Créer
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={openMov} onClose={() => setOpenMov(false)} fullWidth maxWidth="xs">
          <DialogTitle>Mouvement de caisse</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                select
                label="Type"
                value={movForm.type}
                onChange={(e) =>
                  setMovForm((f) => ({ ...f, type: e.target.value as 'IN' | 'OUT' | 'ADJUSTMENT' }))
                }
                fullWidth
              >
                <MenuItem value="IN">Entrée</MenuItem>
                <MenuItem value="OUT">Sortie</MenuItem>
                <MenuItem value="ADJUSTMENT">Ajustement (solde cible)</MenuItem>
              </TextField>
              <TextField
                label="Montant"
                type="number"
                value={movForm.amount || ''}
                onChange={(e) => setMovForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                fullWidth
              />
              <TextField
                label="Libellé"
                value={movForm.label}
                onChange={(e) => setMovForm((f) => ({ ...f, label: e.target.value }))}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenMov(false)}>Annuler</Button>
            <Button variant="contained" onClick={addMovement}>
              Enregistrer
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </BillingFeatureGate>
  )
}
