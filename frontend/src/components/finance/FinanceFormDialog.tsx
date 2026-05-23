import type { ReactNode } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Stack,
  IconButton,
  Divider,
  Button,
  Paper,
  alpha,
  useTheme,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import type { Breakpoint } from '@mui/material'
import { financeOutlinedButtonSx } from './financeStyles'

/** Champs outline style finance (aligné ClientFormDialog). */
export const financeFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    bgcolor: (t: { palette: { mode: string } }) =>
      t.palette.mode === 'dark' ? alpha('#fff', 0.04) : alpha('#0f172a', 0.02),
  },
}

export function FinanceFormSectionTitle({
  children,
  sx,
}: {
  children: ReactNode
  sx?: Record<string, unknown>
}) {
  return (
    <Typography
      variant="overline"
      sx={{
        display: 'block',
        fontWeight: 800,
        letterSpacing: '0.08em',
        color: 'text.secondary',
        mb: 1,
        ...sx,
      }}
    >
      {children}
    </Typography>
  )
}

type FinanceFormDialogShellProps = {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  icon: ReactNode
  maxWidth?: Breakpoint | false
  fullWidth?: boolean
  fullScreen?: boolean
  closeDisabled?: boolean
  children: ReactNode
  actions: ReactNode
}

export function FinanceFormDialogShell({
  open,
  onClose,
  title,
  subtitle,
  icon,
  maxWidth = 'md',
  fullWidth = true,
  fullScreen = false,
  closeDisabled = false,
  children,
  actions,
}: FinanceFormDialogShellProps) {
  const theme = useTheme()

  return (
    <Dialog
      open={open}
      onClose={() => !closeDisabled && onClose()}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      fullScreen={fullScreen}
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 3,
          border: `1px solid ${alpha('#0f172a', theme.palette.mode === 'dark' ? 0.2 : 0.08)}`,
          boxShadow: `0 24px 48px ${alpha('#0f172a', 0.18)}`,
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 2.5,
          py: 2,
          bgcolor: alpha('#0f172a', theme.palette.mode === 'dark' ? 0.35 : 0.04),
          borderBottom: `1px solid ${alpha('#0f172a', 0.08)}`,
        }}
      >
        <Stack direction="row" alignItems="flex-start" spacing={1.5}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#0f172a',
              color: '#fff',
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" fontWeight={800} letterSpacing="-0.02em">
              {title}
            </Typography>
            {subtitle ? (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            ) : null}
          </Box>
          <IconButton
            aria-label="Fermer"
            onClick={onClose}
            disabled={closeDisabled}
            size="small"
            sx={{ mt: -0.5 }}
          >
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ px: 2.5, py: 2.5 }}>{children}</DialogContent>

      <Divider />

      <DialogActions
        sx={{
          px: 2.5,
          py: 2,
          gap: 1,
          bgcolor: alpha('#0f172a', theme.palette.mode === 'dark' ? 0.12 : 0.02),
        }}
      >
        {actions}
      </DialogActions>
    </Dialog>
  )
}

/** Bloc récapitulatif montants (HT / TVA / TTC). */
export function FinanceFormTotalsBox({
  rows,
  totalLabel,
  totalValue,
}: {
  rows: { label: string; value: string }[]
  totalLabel: string
  totalValue: string
}) {
  const theme = useTheme()
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 0.75,
        p: 2,
        borderRadius: 2,
        bgcolor: alpha('#0f172a', theme.palette.mode === 'dark' ? 0.2 : 0.04),
        border: `1px solid ${alpha('#0f172a', 0.08)}`,
      }}
    >
      {rows.map((row) => (
        <Box key={row.label} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {row.label}
          </Typography>
          <Typography variant="body1" fontWeight={600}>
            {row.value}
          </Typography>
        </Box>
      ))}
      <Divider sx={{ width: '100%', my: 0.5 }} />
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <Typography variant="subtitle1" fontWeight={800}>
          {totalLabel}
        </Typography>
        <Typography variant="h6" fontWeight={800} color="primary.main">
          {totalValue}
        </Typography>
      </Box>
    </Box>
  )
}

/** En-tête + carte pour pages plein écran (édition facture / devis). */
export function FinanceFormPageShell({
  title,
  subtitle,
  icon,
  onBack,
  backLabel = 'Retour',
  children,
  actions,
}: {
  title: string
  subtitle?: string
  icon: ReactNode
  onBack: () => void
  backLabel?: string
  children: ReactNode
  actions: ReactNode
}) {
  const theme = useTheme()
  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 }, maxWidth: 960, mx: 'auto' }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={onBack}
        sx={{ ...financeOutlinedButtonSx, mb: 2 }}
      >
        {backLabel}
      </Button>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${alpha('#0f172a', theme.palette.mode === 'dark' ? 0.2 : 0.08)}`,
          boxShadow: `0 24px 48px ${alpha('#0f172a', 0.1)}`,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            px: 2.5,
            py: 2,
            bgcolor: alpha('#0f172a', theme.palette.mode === 'dark' ? 0.35 : 0.04),
            borderBottom: `1px solid ${alpha('#0f172a', 0.08)}`,
          }}
        >
          <Stack direction="row" alignItems="flex-start" spacing={1.5}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#0f172a',
                color: '#fff',
                flexShrink: 0,
              }}
            >
              {icon}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h5" fontWeight={800} letterSpacing="-0.02em">
                {title}
              </Typography>
              {subtitle ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {subtitle}
                </Typography>
              ) : null}
            </Box>
          </Stack>
        </Box>
        <Box sx={{ px: 2.5, py: 2.5 }}>{children}</Box>
        <Divider />
        <Stack
          direction={{ xs: 'column-reverse', sm: 'row' }}
          spacing={1}
          justifyContent="flex-end"
          sx={{
            px: 2.5,
            py: 2,
            bgcolor: alpha('#0f172a', theme.palette.mode === 'dark' ? 0.12 : 0.02),
          }}
        >
          {actions}
        </Stack>
      </Paper>
    </Box>
  )
}
