import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import AddIcon from '@mui/icons-material/Add'
import { Link as RouterLink } from 'react-router-dom'
import {
  apiAccessService,
  type ApiScope,
  type ApiScopeCatalogItem,
  type ApiAccessTokenRow,
} from '../../services/apiAccessService'
import { getApiBaseUrl } from './apiDocsContent'
import { ProPlanGate } from '../../components/billing/ProPlanGate'

export function ApiTokensPage() {
  const [catalog, setCatalog] = useState<ApiScopeCatalogItem[]>([])
  const [tokens, setTokens] = useState<ApiAccessTokenRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [selectedScopes, setSelectedScopes] = useState<ApiScope[]>([
    'clients.read',
    'factures.read',
    'factures.write',
    'factures.send',
  ])
  const [creating, setCreating] = useState(false)
  const [newTokenPlain, setNewTokenPlain] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [cat, list] = await Promise.all([
        apiAccessService.getCatalog(),
        apiAccessService.listTokens(),
      ])
      setCatalog(cat.scopes)
      setTokens(list)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const toggleScope = (scope: ApiScope) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope],
    )
  }

  const handleCreate = async () => {
    if (!name.trim() || selectedScopes.length === 0) return
    setCreating(true)
    setError(null)
    try {
      const created = await apiAccessService.createToken(name.trim(), selectedScopes)
      setNewTokenPlain(created.token)
      setDialogOpen(false)
      setName('')
      await load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Création impossible')
    } finally {
      setCreating(false)
    }
  }

  const handleRevoke = async (id: number) => {
    if (!window.confirm('Révoquer ce jeton ? Les intégrations qui l’utilisent cesseront de fonctionner.')) return
    try {
      await apiAccessService.revokeToken(id)
      await load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Révocation impossible')
    }
  }

  const copyToken = async () => {
    if (!newTokenPlain) return
    await navigator.clipboard.writeText(newTokenPlain)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const apiBase = getApiBaseUrl()

  return (
    <ProPlanGate featureLabel="Les jetons API">
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'flex-start' }}
        spacing={2}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h6" fontWeight={600}>
            Jetons API
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Accès programmatique à vos clients, produits, devis et factures (intégrations, scripts, Zapier…).
          </Typography>
        </Box>
        <Button
          component={RouterLink}
          to="/parametres/api-docs"
          variant="outlined"
          sx={{ textTransform: 'none', alignSelf: { sm: 'center' } }}
        >
          Documentation API
        </Button>
      </Stack>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        Base URL : <strong>{apiBase}</strong> — en-tête{' '}
        <code>Authorization: Bearer &lt;token&gt;</code>. Les jetons commencent par{' '}
        <code>fact_</code>. Cochez uniquement les permissions nécessaires (principe du moindre privilège).
      </Alert>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {newTokenPlain && (
        <Alert
          severity="success"
          sx={{ mb: 3, borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" startIcon={<ContentCopyIcon />} onClick={() => void copyToken()}>
              {copied ? 'Copié' : 'Copier'}
            </Button>
          }
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
            Jeton créé — copiez-le maintenant
          </Typography>
          <Typography variant="body2" component="code" sx={{ wordBreak: 'break-all', display: 'block' }}>
            {newTokenPlain}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Ce jeton ne sera plus affiché en entier après fermeture de ce message.
          </Typography>
          <Button size="small" sx={{ mt: 1 }} onClick={() => setNewTokenPlain(null)}>
            J’ai sauvegardé le jeton
          </Button>
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Jetons actifs
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Nouveau jeton
          </Button>
        </Stack>

        {loading ? (
          <Typography color="text.secondary" sx={{ py: 3 }}>
            Chargement…
          </Typography>
        ) : tokens.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 3 }}>
            Aucun jeton. Créez-en un pour connecter une application externe.
          </Typography>
        ) : (
          <Table size="small" sx={{ mt: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell>Nom</TableCell>
                <TableCell>Préfixe</TableCell>
                <TableCell>Permissions</TableCell>
                <TableCell>Dernière utilisation</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tokens.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{t.name}</TableCell>
                  <TableCell>
                    <code>{t.tokenPrefix}</code>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" flexWrap="wrap" gap={0.5}>
                      {t.permissions.map((p) => (
                        <Chip key={p} label={p} size="small" variant="outlined" />
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {t.lastUsedAt ? new Date(t.lastUsedAt).toLocaleString('fr-FR') : '—'}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Révoquer">
                      <IconButton size="small" color="error" onClick={() => void handleRevoke(t.id)}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={() => !creating && setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nouveau jeton API</DialogTitle>
        <DialogContent>
          <TextField
            label="Nom du jeton"
            placeholder="Ex. Zapier, site vitrine, script compta"
            fullWidth
            margin="normal"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
            Permissions
          </Typography>
          <FormGroup>
            {catalog.map((s) => (
              <FormControlLabel
                key={s.id}
                control={
                  <Checkbox
                    checked={selectedScopes.includes(s.id)}
                    onChange={() => toggleScope(s.id)}
                  />
                }
                label={s.label}
              />
            ))}
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={creating}>
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleCreate()}
            disabled={creating || !name.trim() || selectedScopes.length === 0}
          >
            Créer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    </ProPlanGate>
  )
}
