import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Link,
  Paper,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { Link as RouterLink } from 'react-router-dom'
import {
  API_DOC_SECTIONS,
  API_ERROR_CODES,
  API_SCOPES_REFERENCE,
  API_WORKFLOWS,
  buildCurlExample,
  getApiBaseUrl,
  type ApiDocSection,
} from './apiDocsContent'

const methodColors: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
  GET: 'primary',
  POST: 'success',
  PATCH: 'warning',
  DELETE: 'error',
}

function CopyButton({ text }: { text: string }) {
  const [ok, setOk] = useState(false)
  return (
    <Tooltip title={ok ? 'Copié' : 'Copier'}>
      <IconButton
        size="small"
        onClick={() => {
          void navigator.clipboard.writeText(text).then(() => {
            setOk(true)
            setTimeout(() => setOk(false), 2000)
          })
        }}
      >
        <ContentCopyIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  )
}

function CodeBlock({ children, copyText }: { children: string; copyText?: string }) {
  return (
    <Box sx={{ position: 'relative', mt: 1 }}>
      {copyText && (
        <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
          <CopyButton text={copyText} />
        </Box>
      )}
      <Box
        component="pre"
        sx={{
          p: 2,
          pr: copyText ? 5 : 2,
          bgcolor: 'action.hover',
          borderRadius: 1,
          overflow: 'auto',
          fontSize: '0.8rem',
          m: 0,
        }}
      >
        {children}
      </Box>
    </Box>
  )
}

function SectionBlock({ section, base }: { section: ApiDocSection; base: string }) {
  return (
    <Paper id={section.id} variant="outlined" sx={{ p: 2.5, mb: 2.5, borderRadius: 2, scrollMarginTop: 88 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
        {section.title}
      </Typography>

      {section.body && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
          {section.body}
        </Typography>
      )}

      {section.scopes && (
        <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mb: 2 }}>
          {section.scopes.map((s) => (
            <Chip key={s} label={s} size="small" color="secondary" variant="outlined" />
          ))}
        </Stack>
      )}

      {section.workflow && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            {section.workflow.title}
          </Typography>
          <Box component="ol" sx={{ m: 0, pl: 2.5 }}>
            {section.workflow.steps.map((step) => (
              <Typography component="li" variant="body2" key={step} sx={{ mb: 0.5 }}>
                {step}
              </Typography>
            ))}
          </Box>
        </Alert>
      )}

      {section.endpoints && (
        <Table size="small" sx={{ mb: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell width={72}>Méthode</TableCell>
              <TableCell>Chemin</TableCell>
              <TableCell width={140}>Scope</TableCell>
              <TableCell>Description</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {section.endpoints.map((ep) => (
              <TableRow key={`${ep.method}-${ep.path}`} hover>
                <TableCell>
                  <Chip label={ep.method} size="small" color={methodColors[ep.method] ?? 'default'} />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" component="code" sx={{ fontSize: '0.75rem' }}>
                    {base}
                    {ep.path}
                  </Typography>
                  {ep.queryParams && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {ep.queryParams}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <code style={{ fontSize: '0.7rem' }}>{ep.scope}</code>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{ep.desc}</Typography>
                  {ep.requestBody && (
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                      Body : {ep.requestBody}
                    </Typography>
                  )}
                  {ep.responseHint && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      Réponse : {ep.responseHint}
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {section.example && <CodeBlock copyText={section.example}>{section.example}</CodeBlock>}

      {section.exampleBody && (
        <>
          <Typography variant="subtitle2" sx={{ mt: 2, fontWeight: 600 }}>
            Exemple de corps JSON
          </Typography>
          <CodeBlock copyText={section.exampleBody}>{section.exampleBody}</CodeBlock>
          <Typography variant="subtitle2" sx={{ mt: 2, fontWeight: 600 }}>
            Requête cURL
          </Typography>
          <CodeBlock copyText={buildCurlExample('POST', '/public/factures', section.exampleBody, base)}>
            {buildCurlExample('POST', '/public/factures', section.exampleBody, base)}
          </CodeBlock>
          <Typography variant="subtitle2" sx={{ mt: 2, fontWeight: 600 }}>
            Envoi email après création
          </Typography>
          <CodeBlock
            copyText={buildCurlExample(
              'POST',
              '/public/factures/42/send',
              '{"email":"client@exemple.com","updateClientEmail":true}',
              base,
            )}
          >
            {buildCurlExample(
              'POST',
              '/public/factures/42/send',
              '{"email":"client@exemple.com","updateClientEmail":true}',
              base,
            )}
          </CodeBlock>
        </>
      )}
    </Paper>
  )
}

export function ApiDocsPage() {
  const base = getApiBaseUrl()
  const [tab, setTab] = useState(0)

  const navItems = useMemo(
    () => [
      { id: 'overview', label: 'Vue d’ensemble' },
      ...API_DOC_SECTIONS.filter((s) => s.id !== 'overview').map((s) => ({ id: s.id, label: s.title })),
    ],
    [],
  )

  return (
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
            Documentation API
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Référence REST pour intégrer Facturio (e-commerce, scripts, automatisation).
          </Typography>
        </Box>
        <Button
          component={RouterLink}
          to="/parametres/tokens"
          variant="contained"
          sx={{ textTransform: 'none', fontWeight: 600, alignSelf: { sm: 'center' } }}
        >
          Gérer les jetons
        </Button>
      </Stack>

      <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
        Base URL : <strong>{base}</strong> — format JSON, UTF-8. Jetons :{' '}
        <Link component={RouterLink} to="/parametres/tokens">
          Paramètres → API — Jetons
        </Link>
        .
      </Alert>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }} variant="scrollable" allowScrollButtonsMobile>
        <Tab label="Référence" />
        <Tab label="Scopes" />
        <Tab label="Parcours" />
        <Tab label="Erreurs" />
      </Tabs>

      {tab === 0 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '200px 1fr' }, gap: 2, alignItems: 'start' }}>
          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, position: { lg: 'sticky' }, top: 88 }}>
            <Typography variant="caption" color="text.secondary" sx={{ px: 1, display: 'block', mb: 1 }}>
              Sommaire
            </Typography>
            <Stack spacing={0.25}>
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  component="a"
                  href={`#${item.id}`}
                  size="small"
                  sx={{ justifyContent: 'flex-start', textTransform: 'none', fontWeight: 500 }}
                >
                  {item.label}
                </Button>
              ))}
            </Stack>
          </Paper>
          <Box>
            {API_DOC_SECTIONS.map((section) => (
              <SectionBlock key={section.id} section={section} base={base} />
            ))}
          </Box>
        </Box>
      )}

      {tab === 1 && (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Permissions (scopes)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Cochez uniquement les accès requis lors de la création d’un jeton. Un scope manquant renvoie HTTP 403.
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Scope</TableCell>
                <TableCell>Ressource</TableCell>
                <TableCell>Description</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {API_SCOPES_REFERENCE.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <code>{row.id}</code>
                  </TableCell>
                  <TableCell>{row.resource}</TableCell>
                  <TableCell>{row.label}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {tab === 2 && (
        <Stack spacing={2}>
          {API_WORKFLOWS.map((wf) => (
            <Paper key={wf.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                {wf.title}
              </Typography>
              <Box component="ol" sx={{ m: 0, pl: 2.5 }}>
                {wf.steps.map((step) => (
                  <Typography component="li" variant="body2" key={step} sx={{ mb: 1, lineHeight: 1.6 }}>
                    {step}
                  </Typography>
                ))}
              </Box>
            </Paper>
          ))}
        </Stack>
      )}

      {tab === 3 && (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width={80}>HTTP</TableCell>
                <TableCell>Signification</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {API_ERROR_CODES.map((row) => (
                <TableRow key={row.status}>
                  <TableCell>
                    <Chip label={String(row.status)} size="small" color={row.status >= 500 ? 'error' : 'default'} />
                  </TableCell>
                  <TableCell>{row.meaning}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Les pages publiques destinées à vos clients (paiement, acceptation devis) ne passent pas par cette API :
            elles utilisent un token unique par document dans l’URL.
          </Typography>
        </Paper>
      )}
    </Box>
  )
}
