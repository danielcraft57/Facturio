import {
  alpha,
  Box,
  Button,
  Paper,
  Portal,
  Slide,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import ArchiveIcon from '@mui/icons-material/Archive'
import CloseIcon from '@mui/icons-material/Close'
import { financeOutlinedButtonSx, financePrimaryButtonSx } from './financeStyles'

/** Largeur sidebar dossiers (alignée sur documentFolderSidebarSx). */
const FOLDER_SIDEBAR_WIDTH = 232

type Props = {
  count: number
  resourceLabel: string
  busy?: boolean
  onArchive: () => void
  onClear: () => void
}

export function DocumentFolderBulkBar({
  count,
  resourceLabel,
  busy = false,
  onArchive,
  onClear,
}: Props) {
  const theme = useTheme()
  const hasSidebar = useMediaQuery(theme.breakpoints.up('md'))

  return (
    <Portal>
      <Slide direction="up" in={count > 0} mountOnEnter unmountOnExit>
        <Box
          sx={{
            position: 'fixed',
            bottom: { xs: 16, md: 24 },
            left: {
              xs: 12,
              md: hasSidebar ? FOLDER_SIDEBAR_WIDTH + 16 : 16,
            },
            right: { xs: 12, md: 16 },
            zIndex: theme.zIndex.snackbar,
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none',
            '& > *': { pointerEvents: 'auto' },
          }}
        >
          <Paper
            elevation={8}
            sx={{
              px: { xs: 1.5, sm: 2 },
              py: 1.1,
              borderRadius: 3,
              border: (t) => `1px solid ${alpha('#0f172a', t.palette.mode === 'dark' ? 0.25 : 0.1)}`,
              bgcolor: (t) => (t.palette.mode === 'dark' ? 'background.paper' : '#fff'),
              maxWidth: 560,
              width: '100%',
              boxShadow: (t) =>
                t.palette.mode === 'dark'
                  ? '0 8px 32px rgba(0,0,0,0.45)'
                  : '0 8px 28px rgba(15,23,42,0.14)',
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'stretch', sm: 'center' }}
              spacing={{ xs: 1, sm: 2 }}
            >
              <Typography variant="body2" fontWeight={700} sx={{ whiteSpace: 'nowrap' }}>
                {count} {resourceLabel}
                {count > 1 ? 's' : ''} sélectionné{count > 1 ? 'es' : 'e'}
              </Typography>
              <Stack direction="row" spacing={1} justifyContent={{ xs: 'stretch', sm: 'flex-end' }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<CloseIcon />}
                  onClick={onClear}
                  disabled={busy}
                  sx={{ ...financeOutlinedButtonSx, flex: { xs: 1, sm: 'none' } }}
                >
                  Annuler
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<ArchiveIcon />}
                  onClick={onArchive}
                  disabled={busy}
                  sx={{ ...financePrimaryButtonSx, flex: { xs: 1, sm: 'none' } }}
                >
                  Archiver
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Box>
      </Slide>
    </Portal>
  )
}
