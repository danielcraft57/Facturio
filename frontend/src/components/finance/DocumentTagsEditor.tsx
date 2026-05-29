import { useState, type MouseEvent, type KeyboardEvent } from 'react'
import {
  Autocomplete,
  Badge,
  Chip,
  TextField,
  Box,
  IconButton,
  Popover,
  Stack,
  Typography,
  Button,
} from '@mui/material'
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined'
import AddIcon from '@mui/icons-material/Add'
import { DEFAULT_DOCUMENT_TAGS } from '../../types/documentFolders'
import { alpha } from '@mui/material/styles'
import { FOLDER_NAVY } from './documentFolderStyles'

type AnchorPosition = { top: number; left: number }

type DocumentTagsEditorProps = {
  tags: string[]
  onChange: (tags: string[]) => void
  size?: 'small' | 'medium'
  /** @deprecated Préférer `layout` */
  compact?: boolean
  layout?: 'field' | 'icon' | 'inline'
  maxVisible?: number
  savedTags?: string[]
  onRememberTag?: (tag: string) => void | Promise<void>
  onRemoveSavedTag?: (tag: string) => void | Promise<void>
}

function tagBg(label: string) {
  const colors: Record<string, string> = {
    urgent: '#fef2f2',
    relance: '#fff7ed',
    vip: '#eff6ff',
    'e-commerce': '#f0fdf4',
    comptabilité: '#f5f3ff',
  }
  return colors[label.toLowerCase()] ?? alpha(FOLDER_NAVY, 0.06)
}

function truncateTag(label: string, max = 16) {
  if (label.length <= max) return label
  return `${label.slice(0, max - 1)}…`
}

export function DocumentTagChipList({
  tags,
  max = 1,
  onClick,
}: {
  tags: string[]
  max?: number
  onClick?: (e: MouseEvent<Element>) => void
}) {
  if (tags.length === 0) return null
  const visible = tags.slice(0, max)
  const rest = tags.length - visible.length

  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={0.35}
      sx={{ minWidth: 0, maxWidth: '100%', cursor: onClick ? 'pointer' : undefined }}
      onClick={onClick}
    >
      {visible.map((t) => (
        <Chip
          key={t}
          label={truncateTag(t)}
          size="small"
          title={t}
          sx={{
            height: 20,
            maxWidth: 110,
            fontSize: '0.65rem',
            fontWeight: 600,
            bgcolor: tagBg(t),
            color: FOLDER_NAVY,
            '& .MuiChip-label': {
              px: 0.75,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            },
          }}
        />
      ))}
      {rest > 0 && (
        <Chip
          label={`+${rest}`}
          size="small"
          sx={{
            height: 20,
            fontSize: '0.65rem',
            fontWeight: 700,
            bgcolor: alpha(FOLDER_NAVY, 0.08),
            color: FOLDER_NAVY,
          }}
        />
      )}
    </Stack>
  )
}

function TagsPopoverContent({
  tags,
  onChange,
  size,
  onClose,
  savedTags,
  onRememberTag,
  onRemoveSavedTag,
}: {
  tags: string[]
  onChange: (tags: string[]) => void
  size: 'small' | 'medium'
  onClose: () => void
  savedTags: string[]
  onRememberTag?: (tag: string) => void | Promise<void>
  onRemoveSavedTag?: (tag: string) => void | Promise<void>
}) {
  const [input, setInput] = useState('')

  const addTag = (raw: string) => {
    const t = raw.trim()
    if (!t || tags.includes(t)) {
      setInput('')
      return
    }
    onChange([...tags, t])
    void onRememberTag?.(t)
    setInput('')
  }

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag))
  }

  const suggestions = DEFAULT_DOCUMENT_TAGS.filter((t) => !tags.includes(t))
  const savedNotOnDoc = savedTags.filter(
    (t) => !tags.includes(t) && !DEFAULT_DOCUMENT_TAGS.includes(t as (typeof DEFAULT_DOCUMENT_TAGS)[number]),
  )

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      addTag(input)
    }
  }

  const handleClose = (e: MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onClose()
  }

  return (
    <Box
      sx={{ width: 300, p: 2 }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
        Tags du document
      </Typography>

      {tags.length > 0 ? (
        <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mb: 1.5 }}>
          {tags.map((t) => (
            <Chip
              key={t}
              label={t}
              size="small"
              onDelete={() => removeTag(t)}
              sx={{ fontWeight: 600, bgcolor: tagBg(t), maxWidth: '100%' }}
            />
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Aucun tag sur ce document.
        </Typography>
      )}

      {suggestions.length > 0 && (
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 0.75, display: 'block' }}>
            Suggestions
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={0.5}>
            {suggestions.map((t) => (
              <Chip
                key={t}
                icon={<AddIcon sx={{ fontSize: '0.85rem !important' }} />}
                label={t}
                size="small"
                variant="outlined"
                onClick={() => addTag(t)}
                sx={{ fontWeight: 600, borderColor: alpha(FOLDER_NAVY, 0.2) }}
              />
            ))}
          </Stack>
        </Box>
      )}

      <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 0.75, display: 'block' }}>
        Libellé personnalisé
      </Typography>
      <Stack direction="row" spacing={0.75} alignItems="flex-start">
        <TextField
          fullWidth
          size={size}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Saisir un tag…"
          variant="outlined"
          onKeyDown={handleKeyDown}
          onMouseDown={(e) => e.stopPropagation()}
        />
        <Button
          type="button"
          size="small"
          variant="outlined"
          disabled={!input.trim()}
          onClick={() => addTag(input)}
          sx={{ flexShrink: 0, mt: 0.15, fontWeight: 600 }}
        >
          Ajouter
        </Button>
      </Stack>

      {savedNotOnDoc.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 0.75, display: 'block' }}>
            Mes tags enregistrés
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={0.5}>
            {savedNotOnDoc.map((t) => (
              <Chip
                key={t}
                label={t}
                size="small"
                variant="outlined"
                onClick={() => addTag(t)}
                onDelete={
                  onRemoveSavedTag
                    ? (e) => {
                        e.stopPropagation()
                        void onRemoveSavedTag(t)
                      }
                    : undefined
                }
                sx={{ fontWeight: 600, maxWidth: '100%' }}
              />
            ))}
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Cliquez pour ajouter · croix pour retirer de votre bibliothèque
          </Typography>
        </Box>
      )}

      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
        <Button type="button" size="small" onClick={handleClose} sx={{ fontWeight: 600 }}>
          Fermer
        </Button>
      </Stack>
    </Box>
  )
}

export function DocumentTagsEditor({
  tags,
  onChange,
  size = 'small',
  compact = false,
  layout,
  maxVisible = 1,
  savedTags = [],
  onRememberTag,
  onRemoveSavedTag,
}: DocumentTagsEditorProps) {
  const [anchorPos, setAnchorPos] = useState<AnchorPosition | null>(null)
  const resolvedLayout = layout ?? (compact ? 'icon' : 'field')

  const openPopover = (e: MouseEvent<Element>) => {
    e.stopPropagation()
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    setAnchorPos({ top: rect.bottom + 4, left: rect.left })
  }

  const closePopover = () => setAnchorPos(null)

  const popover = (
    <Popover
      open={anchorPos !== null}
      onClose={(_, reason) => {
        if (reason === 'escapeKeyDown' || reason === 'backdropClick') closePopover()
      }}
      anchorReference="anchorPosition"
      anchorPosition={anchorPos ?? { top: 0, left: 0 }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      disableRestoreFocus
      slotProps={{
        paper: {
          sx: { borderRadius: 2, boxShadow: 4 },
          onMouseDown: (e: MouseEvent) => e.stopPropagation(),
        },
      }}
    >
      {anchorPos !== null && (
        <TagsPopoverContent
          tags={tags}
          onChange={onChange}
          size={size}
          onClose={closePopover}
          savedTags={savedTags}
          onRememberTag={onRememberTag}
          onRemoveSavedTag={onRemoveSavedTag}
        />
      )}
    </Popover>
  )

  if (resolvedLayout === 'field') {
    return (
      <Autocomplete
        multiple
        freeSolo
        size={size}
        options={[...DEFAULT_DOCUMENT_TAGS, ...savedTags]}
        value={tags}
        onChange={(_, value) => {
          const next = value.map((t) => String(t).trim()).filter(Boolean)
          onChange(next)
          const added = next.find((t) => !tags.includes(t))
          if (added) void onRememberTag?.(added)
        }}
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
        sx={{ minWidth: { xs: '100%', sm: 220 } }}
      />
    )
  }

  if (resolvedLayout === 'icon') {
    return (
      <>
        <Badge
          badgeContent={tags.length}
          color="primary"
          invisible={tags.length === 0}
          max={9}
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '0.6rem',
              height: 14,
              minWidth: 14,
              px: 0.35,
            },
          }}
        >
          <IconButton
            size="small"
            aria-label={tags.length ? `${tags.length} tag(s)` : 'Ajouter un tag'}
            onClick={openPopover}
            sx={{
              color: tags.length > 0 ? FOLDER_NAVY : 'text.secondary',
              p: 0.35,
            }}
          >
            <LocalOfferOutlinedIcon fontSize="small" />
          </IconButton>
        </Badge>
        {popover}
      </>
    )
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        minHeight: 22,
        minWidth: 0,
        maxWidth: '100%',
        overflow: 'hidden',
      }}
    >
      {tags.length > 0 ? (
        <DocumentTagChipList tags={tags} max={maxVisible} onClick={openPopover} />
      ) : (
        <Chip
          icon={<LocalOfferOutlinedIcon sx={{ fontSize: '0.85rem !important' }} />}
          label="Tag"
          size="small"
          variant="outlined"
          onClick={openPopover}
          sx={{
            height: 20,
            fontSize: '0.65rem',
            fontWeight: 600,
            opacity: 0.55,
            borderStyle: 'dashed',
            flexShrink: 0,
          }}
        />
      )}
      {popover}
    </Box>
  )
}
