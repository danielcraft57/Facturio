import type { ReactNode } from 'react'
import { Box, Checkbox, TableCell } from '@mui/material'
import type { DocumentFolderRailBulkHeaderProps } from './DocumentFolderRowRail'
import {
  documentFolderBulkCellClass,
  documentFolderBulkCheckboxClass,
  documentFolderBulkCheckboxSx,
  documentFolderBulkLeadCellSx,
} from './documentFolderStyles'

export function DocumentFolderBulkTableHeaderCell({
  bulkHeader,
}: {
  bulkHeader: DocumentFolderRailBulkHeaderProps
}) {
  return (
    <TableCell
      padding="none"
      className={documentFolderBulkCellClass}
      sx={documentFolderBulkLeadCellSx}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 1, height: 1 }}>
        <Checkbox
          className={documentFolderBulkCheckboxClass}
          size="small"
          checked={bulkHeader.allVisibleSelected}
          indeterminate={bulkHeader.someVisibleSelected}
          onChange={bulkHeader.onToggleAll}
          sx={{
            ...documentFolderBulkCheckboxSx,
            opacity: bulkHeader.selectionActive ? 1 : 0,
            pointerEvents: bulkHeader.selectionActive ? 'auto' : 'none',
          }}
          inputProps={{ 'aria-label': 'Tout sélectionner sur la page' }}
        />
      </Box>
    </TableCell>
  )
}

export function DocumentFolderBulkTableBodyCell({ children }: { children: ReactNode }) {
  return (
    <TableCell
      padding="none"
      className={documentFolderBulkCellClass}
      sx={documentFolderBulkLeadCellSx}
      onClick={(e) => e.stopPropagation()}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 1, height: 1 }}>
        {children}
      </Box>
    </TableCell>
  )
}
