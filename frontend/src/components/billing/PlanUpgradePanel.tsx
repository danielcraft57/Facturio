import {
  Box,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined'
import { Link as RouterLink } from 'react-router-dom'
import { financePagePadding, financePrimaryButtonSx } from '../finance/financeStyles'
import { ProPlanBadge } from './ProPlanBadge'
import type { BillingGatedFeature } from './BillingFeatureGate'
import { ProFeatureVitrinePreview, type ProVitrineVariant } from './ProFeatureVitrinePreview'

type PlanUpgradePanelProps = {
  featureLabel: string
  feature?: BillingGatedFeature | 'publicApi' | 'compliance'
  highlights?: string[]
  extraHint?: string
  /** Aperçu statique au-dessus du panneau upgrade. */
  previewVariant?: ProVitrineVariant
  /** Variante compacte (bannière dans une page paramètres). */
  compact?: boolean
}

const DEFAULT_HIGHLIGHTS: Record<BillingGatedFeature | 'publicApi' | 'compliance', string[]> = {
  financeModule: [
    'Créances clients et relances',
    'Dettes fournisseurs, archives et lien public',
    'Suivi encours synchronisé',
  ],
  accounting: [
    'Comptabilité : grand livre, balance, FEC',
    'Centre fiscal, déclarations et abonnements clients',
    'Exports pour votre expert-comptable',
  ],
  publicApi: [
    'Jetons API Bearer sécurisés',
    'Documentation REST complète',
    'Automatiser devis, factures et clients',
  ],
  compliance: [
    'Score de conformité détaillé par facture',
    'Export Factur-X de préparation',
    'Checklist SIRET, SIREN et mentions obligatoires',
    'Accès prioritaire à la suite plateforme agréée',
  ],
}

/**
 * Panneau pleine page invitant à passer Pro lorsqu'une fonctionnalité est verrouillée.
 */
export function PlanUpgradePanel({
  featureLabel,
  feature = 'financeModule',
  highlights,
  extraHint,
  previewVariant,
  compact = false,
}: PlanUpgradePanelProps) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const bullets = highlights ?? DEFAULT_HIGHLIGHTS[feature]

  return (
    <Box
      sx={{
        p: compact ? 0 : financePagePadding,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        minHeight: compact ? undefined : { xs: '50vh', md: '58vh' },
      }}
    >
      <Card
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: compact ? '100%' : 560,
          borderRadius: 3,
          border: '1px solid',
          borderColor: isDark ? alpha('#fff', 0.1) : alpha('#0f172a', 0.08),
          overflow: 'hidden',
          boxShadow: isDark
            ? `0 24px 48px ${alpha('#000', 0.35)}`
            : `0 16px 48px ${alpha('#0f172a', 0.08)}`,
        }}
      >
        <Box
          sx={{
            height: 6,
            background: 'linear-gradient(90deg, #78350f 0%, #b45309 45%, #d97706 100%)',
          }}
        />
        <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          {previewVariant ? <ProFeatureVitrinePreview variant={previewVariant} /> : null}
          <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                bgcolor: isDark ? alpha('#b45309', 0.2) : alpha('#b45309', 0.1),
                color: '#b45309',
              }}
            >
              <WorkspacePremiumOutlinedIcon />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap" sx={{ mb: 0.5 }}>
                <Typography variant="h6" fontWeight={800} lineHeight={1.25}>
                  Fonctionnalité Pro
                </Typography>
                <ProPlanBadge size="medium" />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
                {featureLabel} est incluse dans le plan <strong>Pro</strong> (12&nbsp;€/mois) et les offres
                supérieures.
              </Typography>
            </Box>
          </Stack>

          <List dense disablePadding sx={{ mb: 2.5 }}>
            {bullets.map((line) => (
              <ListItem key={line} disableGutters sx={{ py: 0.35 }}>
                <ListItemIcon sx={{ minWidth: 32, color: 'success.main' }}>
                  <CheckCircleOutlineIcon sx={{ fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText
                  primary={line}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                />
              </ListItem>
            ))}
          </List>

          {extraHint && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
              {extraHint}
            </Typography>
          )}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button
              component={RouterLink}
              to="/parametres/abonnement"
              variant="contained"
              size="large"
              sx={{ ...financePrimaryButtonSx, flex: { sm: 1 } }}
            >
              Voir les offres Pro
            </Button>
            <Button
              component={RouterLink}
              to="/tarifs"
              variant="outlined"
              size="large"
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                flex: { sm: 1 },
              }}
            >
              Comparer les plans
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
