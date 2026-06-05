import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Box, Button, CircularProgress, Alert } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { PageHeader } from '../../components/finance/PageHeader'
import { ArchiveGroupedView } from '../../components/finance/ArchiveGroupedView'
import { financePagePadding, financeOutlinedButtonSx } from '../../components/finance/financeStyles'
import { payablesService } from '../../services/payables'
import { unwrapApiPayload } from '../../services/invoices'
import type { ArchiveRow } from '../../components/finance/ArchiveGroupedView'
import type { ArchiveYearGroup } from '../../types/archives'
import type { PayableDebtRow } from '../../services/payables'
import { formatCurrency } from '../../utils/formatters'
import { useToast } from '../../components/useToast'

function debtToArchiveRow(d: PayableDebtRow): ArchiveRow {
  return {
    id: d.id,
    number: d.label,
    clientName: d.creditorName,
    total: d.totalAmount,
    date: d.createdAt,
    statusLabel: d.status,
  }
}

export function PayablesArchivePage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [groups, setGroups] = useState<ArchiveYearGroup<ArchiveRow>[]>([])
  const [restoringId, setRestoringId] = useState<string | number | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await payablesService.getArchivedDebts()
      const payload = unwrapApiPayload<{ groups?: unknown[]; total?: number }>(res)
      const groupsRaw = (payload?.groups ?? []) as Record<string, unknown>[]
      setGroups(
        groupsRaw.map((yg) => ({
          year: Number(yg.year),
          totalCount: Number(yg.totalCount ?? 0),
          months: ((yg.months as Record<string, unknown>[]) ?? []).map((mg) => ({
            month: Number(mg.month),
            monthLabel: String(mg.monthLabel ?? ''),
            items: ((mg.items as unknown[]) ?? []).map((it) =>
              debtToArchiveRow(it as PayableDebtRow),
            ),
          })),
        })),
      )
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleRestore = async (id: string | number) => {
    try {
      setRestoringId(id)
      await payablesService.restoreDebt(Number(id))
      toast.success('Dette restaurée')
      await load()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Restauration impossible')
    } finally {
      setRestoringId(null)
    }
  }

  return (
    <Box sx={{ p: financePagePadding }}>
      <PageHeader
        title="Archives — Dettes"
        subtitle="Dettes archivées par année et par mois (aucune suppression définitive)."
        actions={
          <Button
            component={Link}
            to="/dettes/inbox"
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            sx={financeOutlinedButtonSx}
          >
            Retour aux dettes
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <ArchiveGroupedView
          groups={groups}
          emptyMessage="Aucune dette archivée."
          onView={(row) => navigate(`/dettes/voir/${row.id}`)}
          onRestore={handleRestore}
          restoringId={restoringId}
        />
      )}
    </Box>
  )
}
