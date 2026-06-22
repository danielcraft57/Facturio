import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  alpha,
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
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { Link as RouterLink } from 'react-router-dom'
import { ProPlanGate } from '../../components/billing/ProPlanGate'
import {
  API_DOC_SECTIONS,
  API_ERROR_CODES,
  API_SCOPES_REFERENCE,
  API_WORKFLOWS,
  buildCurlExample,
  formatDocUrl,
  getApiBaseUrl,
  getApiDocSectionColor,
  type ApiDocSection,
} from './apiDocsContent'
import { useApiDocScrollSpy } from './useApiDocScrollSpy'

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
          maxWidth: '100%',
          fontSize: '0.8rem',
          m: 0,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {children}
      </Box>
    </Box>
  )
}

function SectionBlock({ section, base }: { section: ApiDocSection; base: string }) {
  return (
    <Paper
      id={section.id}
      variant="outlined"
      sx={{ p: { xs: 1.5, sm: 2.5 }, mb: 2.5, borderRadius: 2, scrollMarginTop: { xs: 120, lg: 88 }, maxWidth: '100%' }}
    >
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
        <TableContainer sx={{ mb: 2, maxWidth: '100%', overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: { xs: 520, sm: 640 } }}>
            <TableHead>
              <TableRow>
                <TableCell width={72}>Méthode</TableCell>
                <TableCell>Chemin</TableCell>
                <TableCell width={140} sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                  Scope
                </TableCell>
                <TableCell>Description</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {section.endpoints.map((ep) => (
                <TableRow key={`${ep.method}-${ep.path}`} hover>
                  <TableCell>
                    <Chip label={ep.method} size="small" color={methodColors[ep.method] ?? 'default'} />
                  </TableCell>
                  <TableCell sx={{ maxWidth: { xs: 200, sm: 280 }, wordBreak: 'break-all' }}>
                    <Typography variant="body2" component="code" sx={{ fontSize: '0.75rem' }}>
                      {ep.path}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>
                      {formatDocUrl(base, ep.path)}
                    </Typography>
                    {ep.queryParams && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {ep.queryParams}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <code style={{ fontSize: '0.7rem' }}>{ep.scope}</code>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{ep.desc}</Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display={{ xs: 'block', md: 'none' }}
                      sx={{ mt: 0.5 }}
                    >
                      Scope : <code>{ep.scope}</code>
                    </Typography>
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
        </TableContainer>
      )}

      {section.exampleCurl && !section.exampleBody && (
        <CodeBlock
          copyText={buildCurlExample(section.exampleCurl.method, section.exampleCurl.path, undefined, base)}
        >
          {buildCurlExample(section.exampleCurl.method, section.exampleCurl.path, undefined, base)}
        </CodeBlock>
      )}

      {section.exampleBody && section.exampleCurl && (
        <>
          <Typography variant="subtitle2" sx={{ mt: 2, fontWeight: 600 }}>
            Exemple de corps JSON
          </Typography>
          <CodeBlock copyText={section.exampleBody}>{section.exampleBody}</CodeBlock>
          <Typography variant="subtitle2" sx={{ mt: 2, fontWeight: 600 }}>
            Étape 1 — requête cURL
          </Typography>
          <CodeBlock
            copyText={buildCurlExample(
              section.exampleCurl.method,
              section.exampleCurl.path,
              section.exampleBody,
              base,
            )}
          >
            {buildCurlExample(
              section.exampleCurl.method,
              section.exampleCurl.path,
              section.exampleBody,
              base,
            )}
          </CodeBlock>
          {section.exampleCurl.sendExample && (
            <>
              <Typography variant="subtitle2" sx={{ mt: 2, fontWeight: 600 }}>
                Étape 2 — envoi email (remplacer :id par l’id de l’étape 1)
              </Typography>
              <CodeBlock
                copyText={buildCurlExample(
                  'POST',
                  section.exampleCurl.sendExample.path,
                  section.exampleCurl.sendExample.body,
                  base,
                )}
              >
                {buildCurlExample(
                  'POST',
                  section.exampleCurl.sendExample.path,
                  section.exampleCurl.sendExample.body,
                  base,
                )}
              </CodeBlock>
            </>
          )}
        </>
      )}
    </Paper>
  )
}

type NavItem = { id: string; label: string; color: string }

function ReferenceNav({
  items,
  activeId,
  onSelect,
}: {
  items: NavItem[]
  activeId: string
  onSelect: (id: string) => void
}) {
  const theme = useTheme()
  const isSidebarNav = useMediaQuery(theme.breakpoints.up('md'))
  const chipRefs = useRef<Partial<Record<string, HTMLDivElement | null>>>({})

  useEffect(() => {
    if (isSidebarNav) return
    chipRefs.current[activeId]?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' })
  }, [activeId, isSidebarNav])

  if (isSidebarNav) {
    return (
      <Box
        sx={{
          position: 'sticky',
          top: { md: 80, lg: 88 },
          alignSelf: 'start',
          maxHeight: { md: 'calc(100vh - 96px)', lg: 'calc(100vh - 120px)' },
          zIndex: 1,
        }}
      >
        <Paper
          variant="outlined"
          sx={{
            p: 1.5,
            borderRadius: 2,
            maxHeight: 'inherit',
            overflowY: 'auto',
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ px: 0.5, display: 'block', mb: 1 }}>
            Sommaire
          </Typography>
          <Stack spacing={0.35}>
            {items.map((item) => {
              const active = item.id === activeId
              return (
                <Button
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                  size="small"
                  sx={{
                    justifyContent: 'flex-start',
                    gap: 1,
                    textTransform: 'none',
                    fontWeight: active ? 700 : 500,
                    py: 0.85,
                    px: 1,
                    borderRadius: 1.5,
                    color: active ? item.color : 'text.secondary',
                    bgcolor: active ? alpha(item.color, 0.12) : 'transparent',
                    borderLeft: 3,
                    borderColor: active ? item.color : 'transparent',
                    '&:hover': { bgcolor: alpha(item.color, 0.08) },
                  }}
                >
                  <Box
                    sx={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      bgcolor: item.color,
                      flexShrink: 0,
                      opacity: active ? 1 : 0.55,
                      boxShadow: active ? `0 0 0 3px ${alpha(item.color, 0.2)}` : 'none',
                    }}
                  />
                  <Box component="span" sx={{ textAlign: 'left', lineHeight: 1.35 }}>
                    {item.label}
                  </Box>
                </Button>
              )
            })}
          </Stack>
        </Paper>
      </Box>
    )
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1,
        borderRadius: 2,
        position: 'sticky',
        top: { xs: 56, sm: 64 },
        zIndex: 2,
        alignSelf: 'start',
        bgcolor: 'background.paper',
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ px: 0.5, display: 'block', mb: 0.75 }}>
        Aller à
      </Typography>
      <Box
        sx={{
          display: 'flex',
          gap: 0.75,
          overflowX: 'auto',
          pb: 0.5,
          px: 0.5,
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin',
        }}
      >
        {items.map((item) => {
          const active = item.id === activeId
          return (
            <Chip
              key={item.id}
              ref={(el) => {
                chipRefs.current[item.id] = el
              }}
              onClick={() => onSelect(item.id)}
              label={
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ maxWidth: 180 }}>
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: item.color,
                      flexShrink: 0,
                      opacity: active ? 1 : 0.65,
                    }}
                  />
                  <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.label}
                  </Box>
                </Stack>
              }
              clickable
              size="small"
              variant={active ? 'filled' : 'outlined'}
              sx={{
                flexShrink: 0,
                fontWeight: active ? 700 : 500,
                color: active ? item.color : 'text.secondary',
                bgcolor: active ? alpha(item.color, 0.14) : 'transparent',
                borderColor: alpha(item.color, active ? 0.5 : 0.35),
              }}
            />
          )
        })}
      </Box>
    </Paper>
  )
}

export function ApiDocsPage() {
  const base = getApiBaseUrl()
  const [tab, setTab] = useState(0)

  const navItems = useMemo<NavItem[]>(
    () =>
      API_DOC_SECTIONS.map((s) => ({
        id: s.id,
        label: s.title,
        color: getApiDocSectionColor(s.id),
      })),
    [],
  )

  const sectionIds = useMemo(() => navItems.map((item) => item.id), [navItems])
  const { activeId, scrollToSection } = useApiDocScrollSpy(sectionIds, tab === 0)

  const tabPanelSx = { minWidth: 0, width: '100%', maxWidth: '100%' } as const

  return (
    <ProPlanGate featureLabel="La documentation API">
    <Box sx={{ minWidth: 0, maxWidth: '100%' }}>
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
            Référence REST pour intégrer PrestaFacture (e-commerce, scripts, automatisation).
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

      <Alert severity="info" sx={{ mb: 2, borderRadius: 2, '& strong': { wordBreak: 'break-all' } }}>
        Base URL API : <strong>{base}</strong> — routes métier sous <strong>{base}/public/…</strong> — format JSON,
        UTF-8. Jetons :{' '}
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
        <Box sx={tabPanelSx}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'minmax(148px, 176px) minmax(0, 1fr)' },
              gap: { xs: 2, md: 1.5, lg: 2 },
              alignItems: 'start',
            }}
          >
            <ReferenceNav items={navItems} activeId={activeId} onSelect={scrollToSection} />
            <Box sx={{ minWidth: 0, maxWidth: '100%' }}>
              {API_DOC_SECTIONS.map((section) => (
                <SectionBlock key={section.id} section={section} base={base} />
              ))}
            </Box>
          </Box>
        </Box>
      )}

      {tab === 1 && (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, ...tabPanelSx }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Permissions (scopes)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Cochez uniquement les accès requis lors de la création d’un jeton. Un scope manquant renvoie HTTP 403.
          </Typography>
          <TableContainer sx={{ overflowX: 'auto' }}>
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
          </TableContainer>
        </Paper>
      )}

      {tab === 2 && (
        <Stack spacing={2} sx={tabPanelSx}>
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
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, ...tabPanelSx }}>
          <TableContainer sx={{ overflowX: 'auto' }}>
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
          </TableContainer>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Les pages publiques destinées à vos clients (paiement, acceptation devis) ne passent pas par cette API :
            elles utilisent un token unique par document dans l’URL.
          </Typography>
        </Paper>
      )}
    </Box>
    </ProPlanGate>
  )
}
