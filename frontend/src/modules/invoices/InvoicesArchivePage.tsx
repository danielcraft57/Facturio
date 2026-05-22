import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Box, Button, CircularProgress, Alert } from '@mui/material'
import ArchiveIcon from '@mui/icons-material/Archive'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { PageHeader } from '../../components/finance/PageHeader'
import { ArchiveGroupedView } from '../../components/finance/ArchiveGroupedView'
import { financePagePadding, financeOutlinedButtonSx } from '../../components/finance/financeStyles'
import { invoiceService, unwrapApiPayload } from '../../services/invoices'
import type { ArchiveRow } from '../../components/finance/ArchiveGroupedView'
import type { ArchiveYearGroup } from '../../types/archives'
import { invoiceToArchiveRow } from '../archives/archiveMappers'
import { useToast } from '../../components/useToast'
import { apiClient } from '../../services/api'

export function InvoicesArchivePage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [groups, setGroups] = useState<ArchiveYearGroup<ArchiveRow>[]>([])
  const [total, setTotal] = useState(0)
  const [restoringId, setRestoringId] = useState<string | number | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await invoiceService.getArchivedInvoices()
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
              invoiceToArchiveRow(it as Record<string, unknown>),
            ),
          })),
        })),
      )
      setTotal(payload?.total ?? 0)
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
      await invoiceService.restoreInvoice(String(id))
      apiClient.invalidateCache('/factures')
      apiClient.invalidateCache('/invoices')
      toast.success('Facture restaurée')
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
        title="Archives — Factures"
        subtitle="Factures archivées par année et par mois (aucune suppression définitive)."
        actions={
          <>
            <Button
              component={Link}
              to="/factures/inbox"
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              sx={financeOutlinedButtonSx}
            >
              Factures actives
            </Button>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: 'text.secondary' }}>
              <ArchiveIcon fontSize="small" />
              <Box component="span" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                {total}
              </Box>
            </Box>
          </>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <ArchiveGroupedView
          groups={groups}
          emptyMessage="Aucune facture archivée."
          onView={(row) => navigate(`/factures/${row.id}`)}
          onRestore={handleRestore}
          restoringId={restoringId}
        />
      )}
    </Box>
  )
}
