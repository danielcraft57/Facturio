import { Chip } from '@mui/material'
import type { ChipProps } from '@mui/material'
import { DocumentFolderStatusSlideSwap } from './DocumentFolderStatusSlideSwap'

type Props = {
  label: string
  color: ChipProps['color']
  size?: ChipProps['size']
  chipSx?: ChipProps['sx']
  title?: string
}

export function DocumentFolderStatusChip({
  label,
  color,
  size = 'small',
  chipSx,
  title,
}: Props) {
  return (
    <DocumentFolderStatusSlideSwap statusKey={label} minHeight={24} align="center">
      <Chip
        label={label}
        color={color}
        size={size}
        title={title}
        sx={[
          { fontWeight: 600, borderRadius: 1.5, maxWidth: '100%' },
          ...(chipSx ? [chipSx] : []),
        ]}
      />
    </DocumentFolderStatusSlideSwap>
  )
}
