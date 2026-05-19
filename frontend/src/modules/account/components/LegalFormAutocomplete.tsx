import { Autocomplete, TextField } from '@mui/material'
import { FRENCH_LEGAL_FORMS, filterLegalForms } from '../../../utils/french-legal-forms'

type Props = {
  value: string
  onChange: (value: string) => void
}

export function LegalFormAutocomplete({ value, onChange }: Props) {
  return (
    <Autocomplete
      freeSolo
      options={[...FRENCH_LEGAL_FORMS]}
      value={value}
      inputValue={value}
      onInputChange={(_e, newInput) => onChange(newInput)}
      onChange={(_e, newValue) => {
        if (typeof newValue === 'string') onChange(newValue)
        else if (newValue) onChange(newValue)
        else onChange('')
      }}
      filterOptions={(options, state) => filterLegalForms(state.inputValue)}
      renderInput={(params) => (
        <TextField
          {...params}
          fullWidth
          label="Forme juridique"
          placeholder="Entrepreneur individuel…"
          helperText="Choisissez dans la liste ou saisissez une forme personnalisée"
        />
      )}
    />
  )
}
