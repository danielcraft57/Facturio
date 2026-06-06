import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Box,
  Button,
  Collapse,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Skeleton,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import type { FolderNavConfig } from '../../types/folderNav'
import { formatDocumentFolderCount } from '../../types/documentFolders'
import {
  FOLDER_NAVY,
  documentFolderItemSx,
  documentFolderNewButtonSx,
  documentFolderSidebarGroupLabelSx,
} from './documentFolderStyles'

function FolderCountBadge({
  count,
  highlight,
  loading,
}: {
  count: number
  highlight?: boolean
  loading?: boolean
}) {
  if (loading) {
    return <Skeleton variant="rounded" width={28} height={18} animation="wave" />
  }
  if (count <= 0) return null
  return (
    <Typography
      variant="caption"
      fontWeight={700}
      sx={{
        minWidth: 24,
        textAlign: 'right',
        color: highlight ? 'primary.main' : 'text.secondary',
      }}
    >
      {formatDocumentFolderCount(count)}
    </Typography>
  )
}

export type GroupedFolderSidebarProps<F extends string> = {
  basePath: string
  nav: FolderNavConfig<F>
  labels: Record<F, string>
  icons: Partial<Record<F, React.ReactNode>>
  counts: Record<F, number> & { archives?: number }
  activeFolder: F
  activeTrailingId?: string | null
  onNew: () => void
  newLabel: string
  onNavigate?: () => void
  countsLoading?: boolean
  highlightFolder?: F
}

function FolderNavItem<F extends string>({
  folder,
  basePath,
  labels,
  icons,
  counts,
  activeFolder,
  onNavigate,
  countsLoading,
  highlightFolder,
}: {
  folder: F
  basePath: string
  labels: Record<F, string>
  icons: Partial<Record<F, React.ReactNode>>
  counts: Record<F, number>
  activeFolder: F
  onNavigate?: () => void
  countsLoading?: boolean
  highlightFolder?: F
}) {
  const selected = activeFolder === folder
  const count = counts[folder] ?? 0
  return (
    <ListItemButton
      component={Link}
      to={`${basePath}/${folder}`}
      selected={selected}
      onClick={onNavigate}
      sx={documentFolderItemSx(selected)}
    >
      <ListItemIcon
        sx={{
          minWidth: 34,
          color: selected ? FOLDER_NAVY : 'text.secondary',
        }}
      >
        {icons[folder] ?? null}
      </ListItemIcon>
      <ListItemText
        primary={labels[folder]}
        primaryTypographyProps={{
          fontSize: '0.8125rem',
          fontWeight: selected ? 700 : 500,
          color: selected ? FOLDER_NAVY : 'text.primary',
        }}
      />
      <FolderCountBadge
        count={count}
        highlight={highlightFolder === folder}
        loading={countsLoading}
      />
    </ListItemButton>
  )
}

function NavGroupSection<F extends string>({
  group,
  basePath,
  labels,
  icons,
  counts,
  activeFolder,
  onNavigate,
  countsLoading,
  highlightFolder,
}: {
  group: FolderNavConfig<F>['groups'][number]
  basePath: string
  labels: Record<F, string>
  icons: Partial<Record<F, React.ReactNode>>
  counts: Record<F, number>
  activeFolder: F
  onNavigate?: () => void
  countsLoading?: boolean
  highlightFolder?: F
}) {
  const collapsible = group.collapsible !== false
  const hasActive = group.folders.some((f) => f === activeFolder)
  const [expanded, setExpanded] = useState(!group.defaultCollapsed || hasActive)

  useEffect(() => {
    if (hasActive) setExpanded(true)
  }, [hasActive])

  if (group.folders.length === 0) return null

  return (
    <Box sx={{ mb: 0.5 }}>
      {collapsible ? (
        <ListItemButton
          onClick={() => setExpanded((v) => !v)}
          sx={{
            borderRadius: 1.5,
            mx: 0.25,
            py: 0.5,
            minHeight: 32,
          }}
        >
          <ListItemText
            primary={group.label}
            primaryTypographyProps={{ sx: documentFolderSidebarGroupLabelSx }}
          />
          {expanded ? (
            <ExpandLess fontSize="small" sx={{ color: 'text.secondary' }} />
          ) : (
            <ExpandMore fontSize="small" sx={{ color: 'text.secondary' }} />
          )}
        </ListItemButton>
      ) : (
        <Typography component="div" sx={{ ...documentFolderSidebarGroupLabelSx, px: 1.5, py: 0.75 }}>
          {group.label}
        </Typography>
      )}

      <Collapse in={!collapsible || expanded} timeout="auto" unmountOnExit={false}>
        <List dense disablePadding>
          {group.folders.map((folder) => (
            <FolderNavItem
              key={folder}
              folder={folder}
              basePath={basePath}
              labels={labels}
              icons={icons}
              counts={counts}
              activeFolder={activeFolder}
              onNavigate={onNavigate}
              countsLoading={countsLoading}
              highlightFolder={highlightFolder}
            />
          ))}
        </List>
      </Collapse>
    </Box>
  )
}

export function GroupedFolderSidebarContent<F extends string>({
  basePath,
  nav,
  labels,
  icons,
  counts,
  activeFolder,
  activeTrailingId,
  onNew,
  newLabel,
  onNavigate,
  countsLoading,
  highlightFolder,
}: GroupedFolderSidebarProps<F>) {
  const trailing = nav.trailing ?? []
  const folderCounts = useMemo(() => counts as Record<F, number>, [counts])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 1.5, pb: 1 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            onNew()
            onNavigate?.()
          }}
          sx={documentFolderNewButtonSx}
        >
          {newLabel}
        </Button>
      </Box>

      <List dense sx={{ flex: 1, px: 0.75, py: 0.5 }}>
        {(nav.primaryFolders ?? []).map((folder) => (
          <FolderNavItem
            key={folder}
            folder={folder}
            basePath={basePath}
            labels={labels}
            icons={icons}
            counts={folderCounts}
            activeFolder={activeFolder}
            onNavigate={onNavigate}
            countsLoading={countsLoading}
            highlightFolder={highlightFolder}
          />
        ))}

        {nav.groups.map((group) => (
          <NavGroupSection
            key={group.id}
            group={group}
            basePath={basePath}
            labels={labels}
            icons={icons}
            counts={folderCounts}
            activeFolder={activeFolder}
            onNavigate={onNavigate}
            countsLoading={countsLoading}
            highlightFolder={highlightFolder}
          />
        ))}

        {trailing.map((item) => {
          const selected = activeTrailingId === item.id
          const count =
            item.id === 'archives' ? (counts.archives ?? 0) : (counts[item.id as F] ?? 0)
          return (
            <ListItemButton
              key={item.id}
              component={Link}
              to={item.to}
              selected={selected}
              onClick={onNavigate}
              sx={documentFolderItemSx(selected)}
            >
              <ListItemIcon
                sx={{
                  minWidth: 34,
                  color: selected ? FOLDER_NAVY : 'text.secondary',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: '0.8125rem',
                  fontWeight: selected ? 700 : 500,
                  color: selected ? FOLDER_NAVY : 'text.primary',
                }}
              />
              <FolderCountBadge count={count} loading={countsLoading} />
            </ListItemButton>
          )
        })}
      </List>
    </Box>
  )
}
