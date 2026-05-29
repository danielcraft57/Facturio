import { Autocomplete, Box, Button, Stack, TextField, Typography, alpha } from '@mui/material'
import { ClientAvatar } from '../../modules/clients/components/ClientAvatar'

export type FinanceClientOption = {
  id: string
  name: string
  email?: string
}

type Props = {
  label?: string
  placeholder?: string
  options: FinanceClientOption[]
  loading?: boolean
  valueId: string
  query: string
  onQueryChange: (value: string) => void
  onSelectClientId: (clientId: string) => void
  onCreateRequested?: () => void
  helperText?: string
  creatingInline?: boolean
  createName?: string
  createEmail?: string
  createError?: string | null
  createBusy?: boolean
  onCreateNameChange?: (value: string) => void
  onCreateEmailChange?: (value: string) => void
  onCreateConfirm?: () => void
  onCreateCancel?: () => void
}

export function FinanceClientAutocomplete({
  label = 'Client',
  placeholder = 'Rechercher un client…',
  options,
  loading = false,
  valueId,
  query,
  onQueryChange,
  onSelectClientId,
  onCreateRequested,
  helperText,
  creatingInline = false,
  createName = '',
  createEmail = '',
  createError,
  createBusy = false,
  onCreateNameChange,
  onCreateEmailChange,
  onCreateConfirm,
  onCreateCancel,
}: Props) {
  const selected = valueId ? options.find((o) => o.id === valueId) ?? null : null
  const q = query.trim()

  return (
    <Stack spacing={0.75}>
      <Autocomplete
        fullWidth
        loading={loading}
        options={options}
        value={selected}
        inputValue={query}
        onInputChange={(_e, v, reason) => {
          if (reason === 'input' || reason === 'clear') onQueryChange(v)
        }}
        onChange={(_e, v) => {
          if (!v) return
          onSelectClientId(v.id)
        }}
        getOptionLabel={(o) => (typeof o === 'string' ? o : o.email ? `${o.name} — ${o.email}` : o.name)}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        filterOptions={(opts, state) => {
          const q = state.inputValue.trim().toLowerCase()
          if (!q) return opts.slice(0, 50)
          return opts
            .filter((o) => {
              const hay = `${o.name} ${o.email ?? ''}`.toLowerCase()
              return hay.includes(q)
            })
            .slice(0, 50)
        }}
        noOptionsText={
          q ? (
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ width: '100%' }}>
              <Typography variant="body2">Client introuvable</Typography>
              {onCreateRequested && (
                <Button size="small" variant="contained" onMouseDown={(e) => e.preventDefault()} onClick={onCreateRequested}>
                  Créer
                </Button>
              )}
            </Stack>
          ) : (
            'Aucun client'
          )
        }
        renderOption={(props, option) => {
          const { key, ...liProps } = props
          return (
          <Box component="li" key={key} {...liProps}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
              <ClientAvatar id={option.id} name={option.name} email={option.email} size={24} />
              <Stack spacing={0} sx={{ minWidth: 0 }}>
                <Typography variant="body2" noWrap>
                  {option.name}
                </Typography>
                {option.email && (
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {option.email}
                  </Typography>
                )}
              </Stack>
            </Stack>
          </Box>
          )
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            placeholder={placeholder}
            helperText={helperText}
          />
        )}
      />

      {creatingInline && (
        <Box
          sx={{
            px: 1,
            py: 0.9,
            borderRadius: 2,
            bgcolor: (t) => alpha(t.palette.primary.main, t.palette.mode === 'dark' ? 0.16 : 0.06),
            border: (t) => `1px solid ${alpha(t.palette.primary.main, t.palette.mode === 'dark' ? 0.25 : 0.18)}`,
          }}
        >
          <Stack spacing={0.75}>
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              Nouveau client rapide
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0.75}>
              <TextField
                size="small"
                label="Nom"
                value={createName}
                onChange={(e) => onCreateNameChange?.(e.target.value)}
                fullWidth
              />
              <TextField
                size="small"
                type="email"
                label="Email"
                value={createEmail}
                onChange={(e) => onCreateEmailChange?.(e.target.value)}
                fullWidth
              />
              {(onCreateConfirm || onCreateCancel) && (
                <Stack direction="row" spacing={0.5}>
                  {onCreateConfirm && (
                    <Button size="small" variant="contained" onClick={onCreateConfirm} disabled={createBusy}>
                      {createBusy ? '...' : 'OK'}
                    </Button>
                  )}
                  {onCreateCancel && (
                    <Button size="small" onClick={onCreateCancel} disabled={createBusy}>
                      Annuler
                    </Button>
                  )}
                </Stack>
              )}
            </Stack>
            {createError && (
              <Typography variant="caption" color="error">
                {createError}
              </Typography>
            )}
          </Stack>
        </Box>
      )}
    </Stack>
  )
}

