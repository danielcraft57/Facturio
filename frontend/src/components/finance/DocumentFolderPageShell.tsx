import type { ReactNode } from 'react'
import { Box, Fade, LinearProgress, Stack, Typography } from '@mui/material'
import { DocumentFolderSidebar, DocumentFolderMobileMenuButton } from './DocumentFolderSidebar'
import { DocumentFolderSidebarSkeleton } from '../loading/DocumentFolderSidebarSkeleton'
import type { DocumentFolder, DocumentFolderCounts } from '../../types/documentFolders'
import {
  documentFolderPageMainSx,
  documentFolderSidebarSx,
  documentFolderToolbarSx,
  documentFolderToolbarFiltersSx,
} from './documentFolderStyles'

export type DocumentFolderPageShellProps = {
  resource: 'factures' | 'devis'
  title: string
  subtitle: string
  counts: DocumentFolderCounts
  activeFolder: DocumentFolder
  onNew: () => void
  newLabel: string
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
  resource,
  title,
  subtitle,
  counts,
  activeFolder,
  onNew,
  newLabel,
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
  const sidebarCountsLoading = countsLoading || initialLoading

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

      <Box sx={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative' }}>
        <Box
          sx={{
            display: initialLoading ? { xs: 'block', md: 'none' } : 'contents',
          }}
        >
          <DocumentFolderSidebar
            resource={resource}
            counts={counts}
            activeFolder={activeFolder}
            onNew={onNew}
            newLabel={newLabel}
            mobileOpen={mobileNavOpen}
            onMobileClose={onMobileNavClose}
            countsLoading={sidebarCountsLoading}
          />
        </Box>
        {initialLoading && (
          <Box sx={{ ...documentFolderSidebarSx, display: { xs: 'none', md: 'flex' } }}>
            <DocumentFolderSidebarSkeleton />
          </Box>
        )}

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
            key={contentKey ?? activeFolder}
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
