import type { HTMLAttributes } from 'react'
import {
  Autocomplete,
  Box,
  CircularProgress,
  InputAdornment,
  ListSubheader,
  TextField,
  Typography,
  alpha,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import { FOLDER_NAVY } from './documentFolderStyles'
import {
  filterFinanceSearchOptions,
  highlightSearchTokens,
  type FinanceSearchOptionBase,
} from '../../utils/financeDocumentSearch'

export type FinanceSearchOption = FinanceSearchOptionBase

type FinanceDocumentSearchProps = {
  value: string
  onChange: (value: string) => void
  onSelect?: (option: FinanceSearchOption | null) => void
  options: FinanceSearchOption[]
  loading?: boolean
  placeholder?: string
  /** Libellé court dans l'en-tête du menu (ex. Factures, Devis). */
  resourceLabel?: string
  /** Message quand la requête ne matche aucune option. */
  noResultsHint?: string
  /** Message quand le champ est vide (suggestions). */
  emptyHint?: string
}

function renderHighlighted(text: string, query: string) {
  const parts = highlightSearchTokens(text, query)
  return parts.map((part, i) =>
    typeof part === 'string' ? (
      <span key={i}>{part}</span>
    ) : (
      <Box
        key={i}
        component="span"
        sx={{ color: 'primary.main', fontWeight: 700, bgcolor: (t) => alpha(t.palette.primary.main, 0.1), borderRadius: 0.5, px: 0.25 }}
      >
        {part.highlight}
      </Box>
    ),
  )
}

export function FinanceDocumentSearch({
  value,
  onChange,
  onSelect,
  options,
  loading = false,
  placeholder = 'Rechercher…',
  resourceLabel = 'Documents',
  noResultsHint,
  emptyHint,
}: FinanceDocumentSearchProps) {
  const hasQuery = value.trim().length > 0

  return (
    <Autocomplete
      freeSolo
      fullWidth
      size="small"
      options={options}
      inputValue={value}
      loading={loading}
      clearOnBlur={false}
      selectOnFocus
      handleHomeEndKeys
      forcePopupIcon={false}
      disablePortal={false}
      noOptionsText={
        <Box sx={{ py: 2, px: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {hasQuery
              ? (noResultsHint ?? 'Aucun résultat — essayez n°, client, statut ou montant')
              : (emptyHint ?? 'Ex. fac 20€ payé, dupont, brouillon…')}
          </Typography>
        </Box>
      }
      loadingText={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1, px: 1.5 }}>
          <CircularProgress size={16} />
          <Typography variant="body2" color="text.secondary">
            Recherche en cours…
          </Typography>
        </Box>
      }
      getOptionLabel={(o) => (typeof o === 'string' ? o : o.label)}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      filterOptions={(opts, { inputValue }) =>
        filterFinanceSearchOptions(opts, inputValue, 10)
      }
      onInputChange={(_e, newValue, reason) => {
        if (reason === 'input' || reason === 'clear') onChange(newValue)
      }}
      onChange={(_e, newValue) => {
        if (!newValue || typeof newValue === 'string') {
          onSelect?.(null)
          return
        }
        onChange(newValue.label)
        onSelect?.(newValue)
      }}
      slotProps={{
        popper: {
          sx: { zIndex: (t) => t.zIndex.modal },
        },
        paper: {
          elevation: 0,
          sx: {
            borderRadius: 2.5,
            overflow: 'hidden',
            border: (t) => `1px solid ${alpha(FOLDER_NAVY, t.palette.mode === 'dark' ? 0.22 : 0.1)}`,
            boxShadow: (t) =>
              t.palette.mode === 'dark'
                ? `0 12px 40px ${alpha('#000', 0.45)}`
                : `0 12px 32px ${alpha(FOLDER_NAVY, 0.14)}, 0 2px 8px ${alpha(FOLDER_NAVY, 0.06)}`,
            mt: 0.75,
            bgcolor: 'background.paper',
          },
        },
        listbox: {
          sx: {
            py: 0.5,
            maxHeight: 320,
            '& .MuiAutocomplete-option': {
              minHeight: 52,
              alignItems: 'stretch',
              borderRadius: 1.5,
              mx: 0.75,
              my: 0.25,
              px: 1,
              py: 0.75,
              transition: 'background-color 0.15s ease',
              '&[aria-selected="true"]': {
                bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
              },
              '&.Mui-focused': {
                bgcolor: (t) => alpha(FOLDER_NAVY, 0.06),
              },
            },
          },
        },
      }}
      renderOption={(props, option, state) => {
        const { key, ...rest } = props as HTMLAttributes<HTMLLIElement> & { key: string }
        return (
          <Box component="li" key={key} {...rest}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                width: '100%',
                minWidth: 0,
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: (t) =>
                    state.selected
                      ? alpha(t.palette.primary.main, 0.14)
                      : alpha(FOLDER_NAVY, 0.06),
                  color: (t) =>
                    state.selected ? t.palette.primary.main : alpha(FOLDER_NAVY, 0.65),
                }}
              >
                {option.sublabel ? (
                  <PersonOutlineRoundedIcon sx={{ fontSize: 20 }} />
                ) : (
                  <DescriptionOutlinedIcon sx={{ fontSize: 20 }} />
                )}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={700} noWrap>
                  {renderHighlighted(option.label, value)}
                </Typography>
                {option.sublabel && (
                  <Typography variant="caption" color="text.secondary" noWrap display="block">
                    {renderHighlighted(option.sublabel, value)}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        )
      }}
      ListboxComponent={(listboxProps) => {
        const { children, ...other } = listboxProps
        const count = Array.isArray(children) ? children.length : children ? 1 : 0
        return (
          <ul {...other}>
            {count > 0 && (
              <ListSubheader
                disableSticky
                sx={{
                  lineHeight: 1.4,
                  py: 1,
                  px: 1.75,
                  bgcolor: 'transparent',
                  typography: 'caption',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: 'text.secondary',
                }}
              >
                {resourceLabel}
                {hasQuery ? ` · ${count} suggestion${count > 1 ? 's' : ''}` : ''}
              </ListSubheader>
            )}
            {children}
          </ul>
        )
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={placeholder}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <>
                <InputAdornment position="start">
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: (t) => alpha(FOLDER_NAVY, t.palette.mode === 'dark' ? 0.12 : 0.06),
                    }}
                  >
                    <SearchIcon sx={{ fontSize: 18, color: alpha(FOLDER_NAVY, 0.7) }} />
                  </Box>
                </InputAdornment>
                {params.InputProps.startAdornment}
              </>
            ),
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={18} sx={{ mr: 0.5 }} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
            sx: {
              borderRadius: 2.5,
              fontSize: '0.9375rem',
              bgcolor: (t) =>
                t.palette.mode === 'dark' ? alpha('#fff', 0.04) : alpha(FOLDER_NAVY, 0.025),
              boxShadow: (t) =>
                t.palette.mode === 'dark'
                  ? 'none'
                  : `inset 0 1px 2px ${alpha(FOLDER_NAVY, 0.04)}`,
              transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
              '& fieldset': {
                borderColor: (t) => alpha(FOLDER_NAVY, t.palette.mode === 'dark' ? 0.22 : 0.14),
              },
              '&:hover fieldset': {
                borderColor: alpha(FOLDER_NAVY, 0.32),
              },
              '&.Mui-focused': {
                boxShadow: (t) =>
                  `0 0 0 3px ${alpha(t.palette.primary.main, t.palette.mode === 'dark' ? 0.22 : 0.12)}`,
              },
              '&.Mui-focused fieldset': {
                borderColor: 'primary.main',
                borderWidth: 1.5,
              },
            },
          }}
        />
      )}
    />
  )
}
