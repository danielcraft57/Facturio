import { Checkbox } from '@mui/material'
import { documentFolderBulkCheckboxClass, documentFolderBulkCheckboxSx } from './documentFolderStyles'

type Props = {
  checked: boolean
  visible: boolean
  onToggle: () => void
  inputProps?: { 'aria-label'?: string }
}

export function DocumentFolderRowCheckbox({
  checked,
  visible,
  onToggle,
  inputProps,
}: Props) {
  return (
    <Checkbox
      className={documentFolderBulkCheckboxClass}
      size="small"
      checked={checked}
      onChange={(e) => {
        e.stopPropagation()
        onToggle()
      }}
      onClick={(e) => e.stopPropagation()}
      sx={{
        ...documentFolderBulkCheckboxSx,
        opacity: checked || visible ? 1 : 0,
        pointerEvents: checked || visible ? 'auto' : 'none',
      }}
      inputProps={inputProps}
    />
  )
}
