import { Box, Button, TextField, Typography } from '@mui/material'
import DrawIcon from '@mui/icons-material/Draw'

type Props = {
  value: string
  onChange: (value: string) => void
}

export function OrganizationSignatureField({ value, onChange }: Props) {
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') onChange(reader.result)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const isImage = value.startsWith('data:image')

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Affichée sur vos factures et devis PDF (cadre date & signature). Vous pouvez importer une image
        PNG/JPG ou saisir le nom du signataire.
      </Typography>
      <TextField
        fullWidth
        label="Nom du signataire (si pas d'image)"
        value={isImage ? '' : value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isImage}
        sx={{ mb: 2 }}
      />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', mb: 2 }}>
        <Button variant="outlined" component="label" startIcon={<DrawIcon />}>
          Importer une signature
          <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={handleFile} />
        </Button>
        {value ? (
          <Button variant="text" color="inherit" onClick={() => onChange('')}>
            Supprimer
          </Button>
        ) : null}
      </Box>
      {isImage ? (
        <Box
          component="img"
          src={value}
          alt="Aperçu signature"
          sx={{ maxHeight: 80, maxWidth: 280, border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}
        />
      ) : null}
    </Box>
  )
}
