import React, { useState } from 'react'
import type { ReactNode } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  Alert,
  useTheme,
  useMediaQuery,
  Collapse,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import VisibilityIcon from '@mui/icons-material/Visibility'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import type { RealtimeHighlightTone } from '../types/realtime'
import { getRealtimeRowSx } from '../utils/realtimeRowHighlight'

// Types pour le DataTable
export interface Column<T = Record<string, unknown>> {
  id: keyof T | 'actions'
  label: string
  minWidth?: number
  align?: 'left' | 'right' | 'center'
  format?: (value: unknown, row: T) => ReactNode
  sortable?: boolean
  searchable?: boolean
  render?: (row: T) => ReactNode
}

export interface DataTableProps<T = Record<string, unknown>> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  error?: string | null
  total?: number
  page?: number
  rowsPerPage?: number
  rowsPerPageOptions?: number[]
  onPageChange?: (page: number) => void
  onRowsPerPageChange?: (rowsPerPage: number) => void
  onSort?: (column: keyof T, direction: 'asc' | 'desc') => void
  sortBy?: keyof T
  sortOrder?: 'asc' | 'desc'
  actions?: Array<{
    label: string
    icon: ReactNode
    onClick: (row: T) => void
    color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'
    disabled?: (row: T) => boolean
  }>
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  onView?: (row: T) => void
  emptyMessage?: string
  dense?: boolean
  stickyHeader?: boolean
  maxHeight?: number | string
  showPagination?: boolean
  selectable?: boolean
  selectedRows?: T[]
  onSelectionChange?: (selectedRows: T[]) => void
  getRowId?: (row: T) => string | number
  renderExpanded?: (row: T) => ReactNode
  /** Surbrillance SSE (id de ligne → type d’animation). */
  highlightRows?: Record<string, RealtimeHighlightTone>
}

export function DataTable<T = Record<string, unknown>>({
  columns,
  data,
  loading = false,
  error = null,
  total = 0,
  page = 0,
  rowsPerPage = 10,
  rowsPerPageOptions = [5, 10, 25, 50],
  onPageChange,
  onRowsPerPageChange,
  onSort,
  sortBy,
  sortOrder = 'asc',
  actions = [],
  onEdit,
  onDelete,
  onView,
  emptyMessage = 'Aucune donnée disponible',
  dense = false,
  stickyHeader = false,
  maxHeight,
  showPagination = true,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  getRowId,
  renderExpanded,
  highlightRows,
}: DataTableProps<T>) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [expandedRowId, setExpandedRowId] = useState<string | number | null>(null)

  const safeRowsPerPageOptions = React.useMemo(() => {
    const set = new Set<number>(rowsPerPageOptions)
    set.add(rowsPerPage)
    return Array.from(set).sort((a, b) => a - b)
  }, [rowsPerPageOptions, rowsPerPage])

  // Gestion du tri
  const handleSort = (column: keyof T) => {
    if (!onSort) return
    
    const isAsc = sortBy === column && sortOrder === 'asc'
    onSort(column, isAsc ? 'desc' : 'asc')
  }

  // Gestion de la sélection
  const handleRowSelect = (row: T) => {
    if (!selectable || !onSelectionChange || !getRowId) return
    
    const rowId = getRowId(row)
    const isSelected = selectedRows.some(r => getRowId(r) === rowId)
    
    if (isSelected) {
      onSelectionChange(selectedRows.filter(r => getRowId(r) !== rowId))
    } else {
      onSelectionChange([...selectedRows, row])
    }
  }

  // Rendu des actions
  const renderActions = (row: T) => {
    const rowActions = [
      ...(onView ? [{
        label: 'Voir',
        icon: <VisibilityIcon />,
        onClick: () => onView(row),
        color: 'primary' as const,
        disabled: () => false,
      }] : []),
      ...(onEdit ? [{
        label: 'Modifier',
        icon: <EditIcon />,
        onClick: () => onEdit(row),
        color: 'primary' as const,
        disabled: () => false,
      }] : []),
      ...(onDelete ? [{
        label: 'Supprimer',
        icon: <DeleteIcon />,
        onClick: () => onDelete(row),
        color: 'error' as const,
        disabled: () => false,
      }] : []),
      ...actions,
    ]

    if (rowActions.length === 0) return null

    // Sur mobile, afficher un menu déroulant
    if (isMobile && rowActions.length > 1) {
      return (
        <IconButton size="small">
          <MoreVertIcon />
        </IconButton>
      )
    }

    // Sur desktop, afficher les boutons
    return (
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        {rowActions.map((action, index) => (
          <Tooltip key={index} title={action.label}>
            <IconButton
              size="small"
              color={action.color}
              onClick={() => action.onClick(row)}
              disabled={action.disabled?.(row)}
            >
              {action.icon}
            </IconButton>
          </Tooltip>
        ))}
      </Box>
    )
  }

  // Rendu d'une cellule
  const renderCell = (column: Column<T>, row: T) => {
    // Priorité au rendu personnalisé si fourni
    if (column.render) {
      return column.render(row)
    }
    // Sinon, colonne actions par défaut
    if (column.id === 'actions') {
      return renderActions(row)
    }

    const value = row[column.id as keyof T]

    if (column.format) {
      return column.format(value, row)
    }

    // Formatage automatique selon le type
    if (typeof value === 'boolean') {
      return (
        <Chip
          label={value ? 'Oui' : 'Non'}
          color={value ? 'success' : 'default'}
          size="small"
        />
      )
    }

    if (typeof value === 'number') {
      return value.toLocaleString('fr-FR')
    }

    if (value instanceof Date) {
      return value.toLocaleDateString('fr-FR')
    }

    return value?.toString() || '-'
  }

  // Affichage de l'erreur
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    )
  }

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      {/* Loading indicator */}
      {loading && (
        <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }} />
      )}

      <TableContainer sx={{ maxHeight }}>
        <Table stickyHeader={stickyHeader} size={dense ? 'small' : 'medium'}>
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox" sx={{ width: 48 }}>
                  {/* Checkbox pour sélection multiple */}
                </TableCell>
              )}
              
              {columns.map((column) => (
                <TableCell
                  key={column.id.toString()}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                  sx={{
                    fontWeight: 600,
                    backgroundColor: theme.palette.mode === 'light' 
                      ? theme.palette.grey[50] 
                      : theme.palette.grey[900],
                  }}
                >
                  {column.sortable && onSort ? (
                    <TableSortLabel
                      active={sortBy === column.id}
                      direction={sortBy === column.id ? sortOrder : 'asc'}
                      onClick={() => handleSort(column.id as keyof T)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (selectable ? 1 : 0)} align="center">
                  <Box sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      {emptyMessage}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => {
                const rowId = getRowId ? getRowId(row) : index
                const rowKey = String(rowId)
                const highlightTone = highlightRows?.[rowKey]
                const isSelected = selectable && selectedRows.some(r => getRowId?.(r) === rowId)

                const handleRowClick = () => {
                  if (renderExpanded) {
                    setExpandedRowId(expandedRowId === rowId ? null : rowId)
                  } else if (selectable) {
                    handleRowSelect(row)
                  }
                }

                const rowElement = (
                  <TableRow
                    key={rowId}
                    hover
                    selected={isSelected}
                    onClick={handleRowClick}
                    sx={[
                      {
                        cursor: selectable ? 'pointer' : 'default',
                        '&:hover': {
                          backgroundColor: theme.palette.action.hover,
                        },
                      },
                      getRealtimeRowSx(highlightTone),
                    ]}
                  >
                    {selectable && (
                      <TableCell padding="checkbox">
                        {/* Checkbox pour sélection */}
                      </TableCell>
                    )}
                    
                    {columns.map((column) => (
                      <TableCell
                        key={column.id.toString()}
                        align={column.align}
                        sx={{
                          // Masquer certaines colonnes sur mobile
                          display: isMobile && column.minWidth && column.minWidth > 150 ? 'none' : 'table-cell',
                        }}
                      >
                        {renderCell(column, row)}
                      </TableCell>
                    ))}
                  </TableRow>
                )

                if (!renderExpanded) return rowElement

                const colSpan = columns.length + (selectable ? 1 : 0)
                const expanded = expandedRowId === rowId

                return (
                  <React.Fragment key={`${rowId}-fragment`}>
                    {rowElement}
                    <TableRow key={`${rowId}-expanded`}>
                      <TableCell colSpan={colSpan} sx={{ p: 0, border: 0 }}>
                        <Collapse in={expanded} timeout="auto" unmountOnExit>
                          <Box sx={{ px: 2, py: 2, bgcolor: theme.palette.mode === 'light' ? 'grey.50' : 'grey.900', borderTop: 1, borderColor: 'divider' }}>
                            {renderExpanded(row)}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {showPagination && (onPageChange || onRowsPerPageChange) && (
        <TablePagination
          rowsPerPageOptions={safeRowsPerPageOptions}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => onPageChange?.(newPage)}
          onRowsPerPageChange={(event) => onRowsPerPageChange?.(parseInt(event.target.value, 10))}
          labelRowsPerPage="Lignes par page :"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
        />
      )}
    </Paper>
  )
}
