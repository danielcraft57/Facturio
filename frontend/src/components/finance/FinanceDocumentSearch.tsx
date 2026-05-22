import {
  Autocomplete,
  Box,
  CircularProgress,
  InputAdornment,
  TextField,
  Typography,
  alpha,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { FOLDER_NAVY } from './documentFolderStyles'

export type FinanceSearchOption = {
  id: string
  label: string
  sublabel?: string
  href?: string
}

type FinanceDocumentSearchProps = {
  value: string
  onChange: (value: string) => void
  onSelect?: (option: FinanceSearchOption | null) => void
  options: FinanceSearchOption[]
  loading?: boolean
  placeholder?: string
}

export function FinanceDocumentSearch({
  value,
  onChange,
  onSelect,
  options,
  loading = false,
  placeholder = 'Rechercher…',
}: FinanceDocumentSearchProps) {
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
      noOptionsText={value.trim() ? 'Aucun résultat' : 'Tapez un n° ou un client'}
      loadingText="Recherche…"
      getOptionLabel={(o) => (typeof o === 'string' ? o : o.label)}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      filterOptions={(opts, { inputValue }) => {
        const q = inputValue.trim().toLowerCase()
        if (!q) return opts.slice(0, 8)
        return opts
          .filter(
            (o) =>
              o.label.toLowerCase().includes(q) ||
              (o.sublabel?.toLowerCase().includes(q) ?? false),
          )
          .slice(0, 8)
      }}
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
        paper: {
          sx: {
            borderRadius: 2,
            border: (t) => `1px solid ${alpha(FOLDER_NAVY, 0.1)}`,
            boxShadow: (t) =>
              t.palette.mode === 'dark'
                ? t.shadows[8]
                : `0 8px 24px ${alpha(FOLDER_NAVY, 0.12)}`,
            mt: 0.5,
          },
        },
      }}
      renderOption={(props, option) => {
        const { key, ...rest } = props
        return (
          <Box component="li" key={key} {...rest} sx={{ py: 1, px: 1.5 }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {option.label}
            </Typography>
            {option.sublabel && (
              <Typography variant="caption" color="text.secondary" noWrap display="block">
                {option.sublabel}
              </Typography>
            )}
          </Box>
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
                  <SearchIcon sx={{ fontSize: 20, color: alpha(FOLDER_NAVY, 0.55) }} />
                </InputAdornment>
                {params.InputProps.startAdornment}
              </>
            ),
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={18} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
            sx: {
              borderRadius: 2.5,
              bgcolor: (t) =>
                t.palette.mode === 'dark' ? alpha('#fff', 0.04) : alpha(FOLDER_NAVY, 0.03),
              '& fieldset': {
                borderColor: (t) => alpha(FOLDER_NAVY, t.palette.mode === 'dark' ? 0.2 : 0.12),
              },
              '&:hover fieldset': {
                borderColor: alpha(FOLDER_NAVY, 0.35),
              },
              '&.Mui-focused fieldset': {
                borderColor: FOLDER_NAVY,
                borderWidth: 2,
              },
            },
          }}
        />
      )}
    />
  )
}
