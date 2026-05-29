import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { eInvoicingService, type ReformSchedule } from '../../../services/eInvoicing'
import { CTA } from '../constants/siteContent'

const SIZE_OPTIONS = [
  { value: 'micro', label: 'Micro / auto-entrepreneur' },
  { value: 'pme', label: 'PME / TPE' },
  { value: 'eti', label: 'ETI' },
  { value: 'ge', label: 'Grande entreprise' },
] as const

export function ReformScheduleSimulator() {
  const [size, setSize] = useState<string>('micro')
  const [schedule, setSchedule] = useState<ReformSchedule | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setError(null)
    void eInvoicingService
      .getReformSchedule(size)
      .then((s) => {
        if (!cancelled) setSchedule(s)
      })
      .catch(() => {
        if (!cancelled) setError('Calendrier indisponible')
      })
    return () => {
      cancelled = true
    }
  }, [size])

  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Simulateur d&apos;échéances
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Indiquez votre taille d&apos;entreprise pour voir quand la réception et l&apos;émission vous concernent.
        </Typography>
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel id="reform-size-label">Taille</InputLabel>
          <Select
            labelId="reform-size-label"
            label="Taille"
            value={size}
            onChange={(e) => setSize(e.target.value)}
          >
            {SIZE_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {error && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {schedule && (
          <>
            <Alert severity="info" sx={{ mb: 2 }}>
              {schedule.summary}
            </Alert>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
              {schedule.milestones.map((m) => (
                <Box
                  key={m.kind}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: 1,
                    borderColor: m.active ? 'warning.main' : 'divider',
                    bgcolor: m.active ? 'action.hover' : 'transparent',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {m.label}
                    </Typography>
                    <Chip label={m.date} size="small" variant="outlined" />
                    {m.active && <Chip label="En vigueur" size="small" color="warning" />}
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {m.description}
                  </Typography>
                </Box>
              ))}
            </Box>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {schedule.recommendation}
            </Typography>
          </>
        )}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Button component={RouterLink} to={CTA.signupFree.to} variant="contained" size="small">
            {CTA.signupFree.label}
          </Button>
          <Button component={RouterLink} to={CTA.reserveEfacture.to} variant="outlined" size="small" color="warning">
            {CTA.reserveEfacture.label}
          </Button>
        </Box>
      </CardContent>
    </Card>
  )
}
