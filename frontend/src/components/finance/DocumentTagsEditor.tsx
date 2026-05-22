import { useState } from 'react'
import {
  Autocomplete,
  Chip,
  TextField,
  Box,
  IconButton,
  Popover,
  Stack,
  Typography,
} from '@mui/material'
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined'
import { DEFAULT_DOCUMENT_TAGS } from '../../types/documentFolders'
import { alpha } from '@mui/material/styles'
import { FOLDER_NAVY } from './documentFolderStyles'

type DocumentTagsEditorProps = {
  tags: string[]
  onChange: (tags: string[]) => void
  size?: 'small' | 'medium'
  compact?: boolean
}

function tagBg(label: string) {
  const colors: Record<string, string> = {
    urgent: '#fef2f2',
    relance: '#fff7ed',
    vip: '#eff6ff',
    'e-commerce': '#f0fdf4',
    comptabilité: '#f5f3ff',
  }
  return colors[label] ?? alpha(FOLDER_NAVY, 0.06)
}

function TagChips({ tags, max }: { tags: string[]; max?: number }) {
  const visible = max ? tags.slice(0, max) : tags
  const rest = max && tags.length > max ? tags.length - max : 0
  return (
    <Stack direction="row" flexWrap="wrap" gap={0.35} alignItems="center">
      {visible.map((t) => (
        <Chip
          key={t}
          label={t}
          size="small"
          sx={{
            height: 20,
            fontSize: '0.65rem',
            fontWeight: 600,
            bgcolor: tagBg(t),
            color: FOLDER_NAVY,
          }}
        />
      ))}
      {rest > 0 && (
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          +{rest}
        </Typography>
      )}
    </Stack>
  )
}

export function DocumentTagsEditor({
  tags,
  onChange,
  size = 'small',
  compact = false,
}: DocumentTagsEditorProps) {
  const [input, setInput] = useState('')
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)

  const editor = (
    <Autocomplete
      multiple
      freeSolo
      size={size}
      options={[...DEFAULT_DOCUMENT_TAGS]}
      value={tags}
      inputValue={input}
      onInputChange={(_, v) => setInput(v)}
      onChange={(_, value) => onChange(value.map((t) => String(t).trim()).filter(Boolean))}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => (
          <Chip
            {...getTagProps({ index })}
            key={option}
            label={option}
            size="small"
            sx={{ fontWeight: 600, bgcolor: tagBg(option) }}
          />
        ))
      }
      renderInput={(params) => (
        <TextField {...params} placeholder="Ajouter un tag…" variant="outlined" size={size} />
      )}
      sx={{ minWidth: compact ? 200 : { xs: '100%', sm: 220 } }}
    />
  )

  if (!compact) return editor

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
      {tags.length > 0 ? <TagChips tags={tags} max={2} /> : null}
      <IconButton
        size="small"
        aria-label="Gérer les tags"
        onClick={(e) => {
          e.stopPropagation()
          setAnchor(e.currentTarget)
        }}
        sx={{ color: 'text.secondary' }}
      >
        <LocalOfferOutlinedIcon fontSize="small" />
      </IconButton>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{ paper: { sx: { p: 2, width: 280 } } }}
      >
        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Tags
        </Typography>
        {editor}
      </Popover>
    </Box>
  )
}
