import { Box, Button, Stack, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import SearchOffIcon from '@mui/icons-material/SearchOff'
import { Link as RouterLink } from 'react-router-dom'
import { demoService } from '../../services/demoService'

type Props = {
  /** Recherche sans résultat ou dossier vide. */
  variant: 'search' | 'folder'
  resourceLabel: string
  folderLabel?: string
  onCreate?: () => void
  createLabel?: string
  /** CTA secondaire (ex. installer le catalogue produits). */
  secondaryCta?: { label: string; to: string }
  /** Ouvre le drawer dossiers (mobile). */
  onOpenFolders?: () => void
  showFolderHint?: boolean
}

/**
 * Empty state riche pour listes factures / devis / clients.
 */
export function FinanceFolderEmptyState({
  variant,
  resourceLabel,
  folderLabel,
  onCreate,
  createLabel,
  secondaryCta,
  onOpenFolders,
  showFolderHint = true,
}: Props) {
  const isDemo = demoService.isDemoSession()
  const isSearch = variant === 'search'

  return (
    <Box sx={{ textAlign: 'center', py: 5, px: 2 }}>
      <Stack spacing={1.5} alignItems="center" sx={{ maxWidth: 420, mx: 'auto' }}>
        {isSearch ? (
          <SearchOffIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
        ) : (
          <FolderOpenIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.7 }} />
        )}
        <Typography variant="h6" fontWeight={700}>
          {isSearch
            ? `Aucun ${resourceLabel.toLowerCase()} trouvé`
            : `Aucun ${resourceLabel.toLowerCase()} ici`}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
          {isSearch
            ? 'Essayez un autre mot-clé (n°, client, montant…).'
            : folderLabel
              ? `Le dossier « ${folderLabel} » est vide pour l'instant.`
              : isDemo
                ? `Explorez les autres dossiers ou testez l'aperçu de création (sans enregistrement).`
                : `Commencez par créer votre premier ${resourceLabel.toLowerCase().replace(/s$/, '')}.`}
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ pt: 1 }}>
          {isSearch && isDemo ? (
            <Button variant="contained" component={RouterLink} to="/signup?from=demo">
              Créer mon compte pour continuer
            </Button>
          ) : null}
          {!isSearch && onCreate && createLabel ? (
            <Button variant="contained" startIcon={<AddIcon />} onClick={onCreate}>
              {isDemo ? `Aperçu : ${createLabel.replace(/^Nouveau /i, '')}` : createLabel}
            </Button>
          ) : null}
          {!isSearch && isDemo ? (
            <Button variant="outlined" component={RouterLink} to="/signup?from=demo">
              S&apos;inscrire pour enregistrer
            </Button>
          ) : null}
          {!isSearch && !isDemo && secondaryCta ? (
            <Button variant="outlined" component={RouterLink} to={secondaryCta.to}>
              {secondaryCta.label}
            </Button>
          ) : null}
          {showFolderHint && onOpenFolders ? (
            <Button variant="outlined" onClick={onOpenFolders} sx={{ display: { md: 'none' } }}>
              Ouvrir les dossiers
            </Button>
          ) : null}
        </Stack>
      </Stack>
    </Box>
  )
}
