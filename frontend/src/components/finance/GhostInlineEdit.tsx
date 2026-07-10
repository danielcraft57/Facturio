import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Box, CircularProgress, TextField, Typography, alpha } from '@mui/material'

type GhostInlineEditProps = {
  /** Valeur affichée et éditée. */
  value: string
  /** Texte affiché quand la valeur est vide. */
  placeholder?: string
  /** Persistance après validation (Entrée ou perte de focus). */
  onSave: (nextValue: string) => Promise<void> | void
  /** Retourne un message d'erreur ou null si OK. */
  validate?: (value: string) => string | null
  /** Formate l'affichage en mode lecture. */
  formatDisplay?: (value: string) => string
  inputType?: 'text' | 'email' | 'tel' | 'number'
  disabled?: boolean
  typographyVariant?: 'body2' | 'caption'
  align?: 'left' | 'right' | 'inherit'
  /** Empêche la propagation du clic (ex. ligne tableau cliquable). */
  stopClickPropagation?: boolean
}

/**
 * Champ texte « fantôme » : ressemble à du texte, édition au clic.
 */
export function GhostInlineEdit({
  value,
  placeholder = 'Cliquer pour renseigner',
  onSave,
  validate,
  formatDisplay,
  inputType = 'text',
  disabled = false,
  typographyVariant = 'body2',
  align = 'inherit',
  stopClickPropagation = true,
}: GhostInlineEditProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editing) setDraft(value)
  }, [value, editing])

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  const display = formatDisplay ? formatDisplay(value) : value
  const isEmpty = !String(value ?? '').trim()

  const cancel = () => {
    setDraft(value)
    setError(null)
    setEditing(false)
  }

  const commit = async () => {
    const next = draft.trim()
    const validationError = validate?.(next) ?? null
    if (validationError) {
      setError(validationError)
      return
    }
    if (next === value.trim()) {
      setEditing(false)
      return
    }
    try {
      setSaving(true)
      await onSave(next)
      setEditing(false)
      setError(null)
    } catch {
      setError('Enregistrement impossible')
    } finally {
      setSaving(false)
    }
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      void commit()
    }
    if (e.key === 'Escape') cancel()
  }

  if (editing) {
    return (
      <Box sx={{ minWidth: 0 }} onClick={stopClickPropagation ? (e) => e.stopPropagation() : undefined}>
        <TextField
          inputRef={inputRef}
          size="small"
          fullWidth
          type={inputType}
          value={draft}
          disabled={saving}
          error={Boolean(error)}
          helperText={error ?? ' '}
          onChange={(e) => {
            setDraft(e.target.value)
            if (error) setError(null)
          }}
          onBlur={() => void commit()}
          onKeyDown={onKeyDown}
          sx={{
            '& .MuiInputBase-root': { fontSize: typographyVariant === 'caption' ? '0.75rem' : '0.875rem' },
            '& .MuiFormHelperText-root': { mx: 0, mt: 0.25 },
          }}
        />
        {saving ? (
          <CircularProgress size={14} sx={{ position: 'absolute', mt: -3, right: 4 }} />
        ) : null}
      </Box>
    )
  }

  return (
    <Box
      component="span"
      onClick={(e) => {
        if (stopClickPropagation) e.stopPropagation()
        if (!disabled) setEditing(true)
      }}
      sx={{
        display: 'inline-block',
        maxWidth: '100%',
        cursor: disabled ? 'default' : 'text',
        borderRadius: 0.75,
        px: 0.25,
        mx: -0.25,
        transition: 'background-color 0.15s ease',
        '&:hover': disabled
          ? undefined
          : {
              bgcolor: (t) => alpha(t.palette.primary.main, 0.06),
              boxShadow: (t) => `inset 0 -1px 0 ${alpha(t.palette.primary.main, 0.35)}`,
            },
      }}
    >
      <Typography
        variant={typographyVariant}
        align={align}
        noWrap
        sx={{
          fontStyle: isEmpty ? 'italic' : undefined,
          color: isEmpty ? 'text.secondary' : 'text.primary',
        }}
        title={disabled ? undefined : 'Cliquer pour modifier'}
      >
        {isEmpty ? placeholder : display}
      </Typography>
    </Box>
  )
}

type GhostInlineAmountProps = {
  value: number | null | undefined
  placeholder?: string
  onSave: (nextValue: number) => Promise<void> | void
  disabled?: boolean
  suffix?: string
  stopClickPropagation?: boolean
}

/**
 * Montant éditable inline (entiers €) pour tarifs catalogue.
 */
export function GhostInlineAmount({
  value,
  placeholder = 'Tarif',
  onSave,
  disabled = false,
  suffix = '€',
  stopClickPropagation = true,
}: GhostInlineAmountProps) {
  const numeric = Number(value ?? 0)

  return (
    <GhostInlineEdit
      value={numeric > 0 ? String(Math.round(numeric)) : ''}
      placeholder={placeholder}
      inputType="number"
      disabled={disabled}
      typographyVariant="body2"
      stopClickPropagation={stopClickPropagation}
      formatDisplay={(v) => `${Math.round(Number(v) || 0)} ${suffix}`}
      validate={(v) => {
        const n = Number(v)
        if (!v.trim()) return 'Indiquez un montant'
        if (!Number.isFinite(n) || n < 0) return 'Montant invalide'
        return null
      }}
      onSave={async (v) => onSave(Math.round(Number(v)))}
    />
  )
}
