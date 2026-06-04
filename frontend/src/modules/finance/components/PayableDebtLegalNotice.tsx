import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material'
import { ExpandMore, Gavel } from '@mui/icons-material'
import {
  PAYABLE_DEBT_LEGAL_INTRO,
  PAYABLE_DEBT_LEGAL_ITEMS,
  PAYABLE_DEBT_RGPD_HINT,
} from '../payableDebtLegalCopy'

type Variant = 'compact' | 'full'

type Props = {
  variant?: Variant
  /** Afficher l’alerte d’avertissement en tête (défaut : true en full). */
  showDisclaimer?: boolean
}

/** Bloc UX des mentions juridiques reconnaissance de dette (formulaire, fiche, page publique). */
export function PayableDebtLegalNotice({ variant = 'full', showDisclaimer }: Props) {
  const disclaimer = showDisclaimer ?? variant === 'full'

  const list = (
    <List dense disablePadding sx={{ mt: disclaimer ? 1 : 0 }}>
      {PAYABLE_DEBT_LEGAL_ITEMS.map((item) => (
        <ListItem key={item.title} disableGutters sx={{ alignItems: 'flex-start', py: 0.5 }}>
          <ListItemText
            primary={
              <Typography variant="body2" component="span" sx={{ fontWeight: 700 }}>
                {item.title}
              </Typography>
            }
            secondary={
              <Typography variant="body2" color="text.secondary" component="span">
                {item.body}
              </Typography>
            }
          />
        </ListItem>
      ))}
      <ListItem disableGutters sx={{ pt: 1 }}>
        <ListItemText
          primary={
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              {PAYABLE_DEBT_RGPD_HINT}
            </Typography>
          }
        />
      </ListItem>
    </List>
  )

  if (variant === 'compact') {
    return (
      <Accordion
        disableGutters
        elevation={0}
        sx={{
          bgcolor: 'action.hover',
          borderRadius: 1,
          '&:before': { display: 'none' },
        }}
      >
        <AccordionSummary expandIcon={<ExpandMore />} sx={{ minHeight: 44 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Gavel fontSize="small" color="action" />
            <Typography variant="body2" fontWeight={600}>
              Mentions juridiques incluses dans l’email
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          {disclaimer && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
              {PAYABLE_DEBT_LEGAL_INTRO}
            </Typography>
          )}
          {list}
        </AccordionDetails>
      </Accordion>
    )
  }

  return (
    <Box>
      {disclaimer && (
        <Alert severity="warning" icon={<Gavel fontSize="inherit" />} sx={{ mb: 2 }}>
          {PAYABLE_DEBT_LEGAL_INTRO}
        </Alert>
      )}
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
        Informations juridiques
      </Typography>
      {list}
    </Box>
  )
}
