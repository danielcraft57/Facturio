import type { ReactNode } from 'react'
import { Box, Fade, LinearProgress, Stack, Typography } from '@mui/material'
import { DocumentFolderSidebar, DocumentFolderMobileMenuButton } from './DocumentFolderSidebar'
import type { DocumentFolder, DocumentFolderCounts } from '../../types/documentFolders'
import {
  documentFolderLayoutRowSx,
  documentFolderPageMainSx,
  documentFolderToolbarSx,
  documentFolderToolbarFiltersSx,
} from './documentFolderStyles'

export type DocumentFolderPageShellProps = {
  resource?: 'factures' | 'devis' | 'dettes'
  /** Préfixe de route sidebar (ex. `/dettes`). */
  folderBasePath?: string
  /** Dossiers masqués dans la sidebar. */
  excludeFolders?: import('../../types/documentFolders').DocumentFolder[]
  title: string
  subtitle: string
  /** Sidebar personnalisée (ex. clients). Sinon sidebar factures/devis. */
  sidebar?: ReactNode
  counts?: DocumentFolderCounts
  activeFolder?: DocumentFolder
  onNew?: () => void
  newLabel?: string
  mobileNavOpen: boolean
  onMobileNavOpen: () => void
  onMobileNavClose: () => void
  filters: ReactNode
  children: ReactNode
  headerExtra?: ReactNode
  /** Clé pour animer le contenu (ex. dossier actif). */
  contentKey?: string
  /** Rechargement liste (recherche, dossier, refresh). */
  loading?: boolean
  /** Premier chargement sans données encore (F5). */
  initialLoading?: boolean
  /** Compteurs sidebar en cours. */
  countsLoading?: boolean
}

export function DocumentFolderPageShell({
  resource = 'factures',
  folderBasePath,
  excludeFolders,
  title,
  subtitle,
  sidebar,
  counts,
  activeFolder = 'inbox',
  onNew,
  newLabel = 'Nouveau',
  mobileNavOpen,
  onMobileNavOpen,
  onMobileNavClose,
  filters,
  children,
  headerExtra,
  contentKey,
  loading = false,
  initialLoading = false,
  countsLoading = false,
}: DocumentFolderPageShellProps) {
  const showProgress = loading && !initialLoading
  const sidebarCountsLoading = countsLoading
  const folderKey = contentKey ?? activeFolder

  const sidebarNode =
    sidebar ??
    (counts && onNew ? (
      <DocumentFolderSidebar
        resource={resource}
        basePath={folderBasePath}
        excludeFolders={excludeFolders}
        counts={counts}
        activeFolder={activeFolder}
        onNew={onNew}
        newLabel={newLabel}
        mobileOpen={mobileNavOpen}
        onMobileClose={onMobileNavClose}
        countsLoading={sidebarCountsLoading}
      />
    ) : null)

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: { xs: 'auto', md: 'calc(100vh - 120px)' },
      }}
    >
      <Box sx={documentFolderToolbarSx}>
        <Stack
          direction="row"
          alignItems="flex-start"
          spacing={1}
          sx={{ mb: { xs: 1.5, md: 2 } }}
        >
          <DocumentFolderMobileMenuButton onClick={onMobileNavOpen} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h5"
              component="h1"
              sx={{
                fontWeight: 800,
                letterSpacing: '-0.03em',
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
                lineHeight: 1.2,
              }}
            >
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
              {subtitle}
            </Typography>
          </Box>
          {headerExtra}
        </Stack>
        <Box sx={documentFolderToolbarFiltersSx}>{filters}</Box>
      </Box>

      <Box sx={documentFolderLayoutRowSx}>
        {sidebarNode}

        <Box sx={{ ...documentFolderPageMainSx, position: 'relative' }}>
          {showProgress && (
            <LinearProgress
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 2,
                borderRadius: '0 0 2px 2px',
              }}
            />
          )}

          <Fade
            key={folderKey}
            in
            timeout={{ enter: initialLoading ? 0 : 280, exit: 160 }}
          >
            <Box
              sx={{
                minWidth: 0,
                maxWidth: '100%',
                pt: showProgress ? 0.5 : 0,
                opacity: showProgress ? 0.65 : 1,
                transition: 'opacity 0.22s ease',
                pointerEvents: loading ? 'none' : 'auto',
              }}
            >
              {children}
            </Box>
          </Fade>
        </Box>
      </Box>
    </Box>
  )
}
