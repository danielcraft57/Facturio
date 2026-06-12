import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { useDebouncedEffect } from '../../hooks/useDebouncedEffect'
import { SettingsAutoSaveStatus } from './components/SettingsAutoSaveStatus'
import type { AutoSaveStatus } from './OrganizationProfileContext'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import VpnKeyIcon from '@mui/icons-material/VpnKey'
import WebhookIcon from '@mui/icons-material/Webhook'
import PaymentsIcon from '@mui/icons-material/Payments'
import {
  organizationService,
  type OrganizationProfile,
  type UpdateInvoiceStripe,
} from '../../services/organizationService'
import { unwrapApiPayload } from '../../services/clients'
import { PaymentMethodPickerGrid } from './PaymentMethodPickerGrid'

const antiAutofillInputProps = {
  autoComplete: 'off',
  'data-1p-ignore': 'true',
  'data-lpignore': 'true',
} as const

type Props = {
  profile: OrganizationProfile | null
  onUpdated: (profile: OrganizationProfile) => void
}

export function InvoiceStripeSection({ profile, onUpdated }: Props) {
  const [publishableKey, setPublishableKey] = useState('')
  const [secretDraft, setSecretDraft] = useState('')
  const [webhookDraft, setWebhookDraft] = useState('')
  const [editingSecret, setEditingSecret] = useState(false)
  const [editingWebhook, setEditingWebhook] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<string[]>(['card'])
  const [saving, setSaving] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const skipAutoSaveRef = useRef(true)

  useEffect(() => {
    skipAutoSaveRef.current = true
    setPublishableKey(profile?.invoiceStripePublishableKey ?? '')
    setSecretDraft('')
    setWebhookDraft('')
    setEditingSecret(!profile?.invoiceStripeSecretKeySet)
    setEditingWebhook(!profile?.invoiceStripeWebhookSecretSet)
    setPaymentMethods(
      profile?.invoiceStripePaymentMethods?.length
        ? [...profile.invoiceStripePaymentMethods]
        : ['card'],
    )
    const t = window.setTimeout(() => {
      skipAutoSaveRef.current = false
    }, 150)
    return () => window.clearTimeout(t)
  }, [profile])

  const togglePaymentMethod = (id: string) => {
    setAutoSaveStatus('pending')
    setPaymentMethods((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev
        return prev.filter((m) => m !== id)
      }
      return [...prev, id]
    })
  }

  const paymentMethodsEqual = (a: string[], b: string[]) => {
    const sa = [...a].sort().join(',')
    const sb = [...b].sort().join(',')
    return sa === sb
  }

  useEffect(() => {
    if (!profile?.id) return
    setWebhookUrl(organizationService.buildInvoiceStripeWebhookUrl(profile.id))
    void organizationService
      .getInvoiceStripeWebhookUrl()
      .then((res) => {
        const url = unwrapApiPayload<{ webhookUrl: string }>(res).webhookUrl
        if (url) setWebhookUrl(url)
      })
      .catch(() => {})
  }, [profile?.id])

  const persist = async (payload: UpdateInvoiceStripe) => {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const res = await organizationService.updateInvoiceStripe(payload)
      const updated = unwrapApiPayload<OrganizationProfile>(res)
      onUpdated(updated)
      setSuccess(true)
    } catch (err: unknown) {
      setError((err as Error)?.message ?? 'Erreur enregistrement Stripe')
      throw err
    } finally {
      setSaving(false)
    }
  }

  const buildPayload = useCallback(
    (opts: { includeSecrets?: boolean } = {}): UpdateInvoiceStripe | null => {
      const includeSecrets = opts.includeSecrets ?? false
      const payload: UpdateInvoiceStripe = {}
      const savedPk = profile?.invoiceStripePublishableKey ?? ''
      if (publishableKey.trim() !== savedPk) {
        payload.invoiceStripePublishableKey = publishableKey.trim() || null
      }
      if (includeSecrets && editingSecret && secretDraft.trim()) {
        payload.invoiceStripeSecretKey = secretDraft.trim()
      }
      if (includeSecrets && editingWebhook && webhookDraft.trim()) {
        payload.invoiceStripeWebhookSecret = webhookDraft.trim()
      }
      const savedMethods = profile?.invoiceStripePaymentMethods?.length
        ? profile.invoiceStripePaymentMethods
        : ['card']
      if (!paymentMethodsEqual(paymentMethods, savedMethods)) {
        payload.invoiceStripePaymentMethods = paymentMethods
      }
      if (Object.keys(payload).length === 0) return null
      return payload
    },
    [
      profile,
      publishableKey,
      secretDraft,
      webhookDraft,
      editingSecret,
      editingWebhook,
      paymentMethods,
    ],
  )

  const runAutoSave = useCallback(
    async (includeSecrets: boolean) => {
      const payload = buildPayload({ includeSecrets })
      if (!payload) return
      setAutoSaveStatus('saving')
      try {
        await persist(payload)
        if (includeSecrets) {
          setSecretDraft('')
          setWebhookDraft('')
          setEditingSecret(!profile?.invoiceStripeSecretKeySet)
          setEditingWebhook(!profile?.invoiceStripeWebhookSecretSet)
        }
        setAutoSaveStatus('saved')
      } catch {
        setAutoSaveStatus('error')
      }
    },
    [buildPayload, profile],
  )

  useDebouncedEffect(
    () => {
      if (skipAutoSaveRef.current) return
      const payload = buildPayload({ includeSecrets: false })
      if (!payload) {
        setAutoSaveStatus('idle')
        return
      }
      setAutoSaveStatus('pending')
      void runAutoSave(false)
    },
    [publishableKey, paymentMethods, buildPayload, runAutoSave],
    1000,
  )

  const saveSecretsOnBlur = () => {
    if (skipAutoSaveRef.current) return
    void runAutoSave(true)
  }

  const handleClearSecret = async () => {
    if (!profile?.invoiceStripeSecretKeySet) return
    if (!window.confirm('Supprimer la clé secrète Stripe enregistrée ? Les paiements en ligne seront désactivés.')) {
      return
    }
    try {
      await persist({ clearInvoiceStripeSecretKey: true })
    } catch {
      /* */
    }
  }

  const handleClearWebhook = async () => {
    if (!profile?.invoiceStripeWebhookSecretSet) return
    if (
      !window.confirm(
        'Supprimer le secret webhook enregistré ? Stripe ne pourra plus notifier les paiements automatiquement.',
      )
    ) {
      return
    }
    try {
      await persist({ clearInvoiceStripeWebhookSecret: true })
    } catch {
      /* */
    }
  }

  const copyWebhookUrl = async () => {
    if (!webhookUrl) return
    try {
      await navigator.clipboard.writeText(webhookUrl)
      setSuccess(true)
    } catch {
      setError('Impossible de copier l’URL')
    }
  }

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Stripe prestataire (paiements de vos factures)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Clés Stripe prestataire (paiements de vos factures). Secrets chiffrés en base si
          SECRETS_ENCRYPTION_KEY est configurée. Enregistrement automatique ; les clés secrètes sont
          sauvegardées à la sortie du champ.
        </Typography>

        <SettingsAutoSaveStatus status={autoSaveStatus} error={error} />

        {webhookUrl && (
          <Alert
            severity="info"
            sx={{ mb: 2 }}
            action={
              <IconButton size="small" color="inherit" onClick={copyWebhookUrl} aria-label="Copier l’URL">
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            }
          >
            <strong>Même URL webhook</strong> que pour l’abonnement Facturio — à créer dans le Dashboard
            Stripe de <em>votre</em> compte prestataire :<br />
            <Typography component="code" variant="body2" sx={{ wordBreak: 'break-all', display: 'block', mt: 1 }}>
              {webhookUrl}
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Événement minimum : <code>payment_intent.succeeded</code>.
            </Typography>
          </Alert>
        )}

        <Box component="div" data-form-type="other">
          {/* ——— Clés API ——— */}
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <VpnKeyIcon color="action" fontSize="small" />
            <Typography variant="subtitle1" fontWeight={600}>
              Clés API Stripe
            </Typography>
          </Stack>

          <TextField
            fullWidth
            label="Clé publishable (pk_live_… ou pk_test_…)"
            margin="dense"
            name="stripe-invoice-publishable-key"
            type="text"
            value={publishableKey}
            onChange={(e) => {
              setPublishableKey(e.target.value)
              setAutoSaveStatus('pending')
            }}
            inputProps={antiAutofillInputProps}
            helperText="Affichée côté client pour Stripe.js"
          />

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" fontWeight={600} gutterBottom>
              Clé secrète (sk_…)
            </Typography>
            {profile?.invoiceStripeSecretKeySet && !editingSecret ? (
              <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                <Typography variant="body2" color="text.secondary">
                  Enregistrée (masquée)
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => {
                    setEditingSecret(true)
                    setSecretDraft('')
                  }}
                >
                  Modifier
                </Button>
                <Button
                  size="small"
                  color="error"
                  variant="outlined"
                  startIcon={<DeleteOutlineIcon />}
                  onClick={handleClearSecret}
                  disabled={saving}
                >
                  Supprimer
                </Button>
              </Stack>
            ) : (
              <TextField
                fullWidth
                margin="dense"
                name="stripe-invoice-secret-key"
                type="text"
                placeholder="sk_live_… ou sk_test_…"
                value={secretDraft}
                onChange={(e) => setSecretDraft(e.target.value)}
                onBlur={saveSecretsOnBlur}
                inputProps={{
                  ...antiAutofillInputProps,
                  autoComplete: 'new-password',
                  style: { WebkitTextSecurity: 'disc' } as CSSProperties,
                }}
                helperText={
                  profile?.invoiceStripeSecretKeySet
                    ? 'Nouvelle clé secrète — enregistrée à la sortie du champ.'
                    : 'Obligatoire pour activer les paiements en ligne.'
                }
              />
            )}
          </Box>

          <Box sx={{ mt: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
              <WebhookIcon color="action" fontSize="small" />
              <Typography variant="body2" fontWeight={600}>
                Secret webhook (whsec_…)
              </Typography>
            </Stack>
            {profile?.invoiceStripeWebhookSecretSet && !editingWebhook ? (
              <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                <Typography variant="body2" color="text.secondary">
                  Enregistré (masqué)
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => {
                    setEditingWebhook(true)
                    setWebhookDraft('')
                  }}
                >
                  Modifier
                </Button>
                <Button
                  size="small"
                  color="error"
                  variant="outlined"
                  startIcon={<DeleteOutlineIcon />}
                  onClick={handleClearWebhook}
                  disabled={saving}
                >
                  Supprimer
                </Button>
              </Stack>
            ) : (
              <TextField
                fullWidth
                margin="dense"
                name="stripe-invoice-webhook-secret"
                type="text"
                placeholder="whsec_…"
                value={webhookDraft}
                onChange={(e) => setWebhookDraft(e.target.value)}
                onBlur={saveSecretsOnBlur}
                inputProps={{
                  ...antiAutofillInputProps,
                  autoComplete: 'new-password',
                  style: { WebkitTextSecurity: 'disc' } as CSSProperties,
                }}
                helperText="Enregistré à la sortie du champ. Optionnel si paiement confirmé depuis la page facture."
              />
            )}
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* ——— Moyens de paiement ——— */}
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
            <PaymentsIcon color="action" fontSize="small" />
            <Typography variant="subtitle1" fontWeight={600}>
              Moyens de paiement sur la page facture
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Cliquez sur les cartes pour activer ou désactiver chaque moyen. Au moins une option doit
            rester sélectionnée. Seuls les moyens aussi activés dans votre Dashboard Stripe seront
            proposés au client.
          </Typography>

          <PaymentMethodPickerGrid
            selected={paymentMethods}
            onToggle={togglePaymentMethod}
            disabled={saving}
          />

          {(paymentMethods.includes('klarna') || paymentMethods.includes('alma')) && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
                Paiement en plusieurs fois (Klarna / Alma)
              </Typography>
              <Typography variant="body2" component="div">
                Réservé aux <strong>particuliers</strong> (B2C) : le client règle en 2x à 4x chez Klarna ou
                Alma, vous êtes encaissé en une fois par Stripe. Activez le moyen dans votre Dashboard Stripe
                (compte prestataire). Fourchettes indicatives en EUR : Klarna 1–1&nbsp;500&nbsp;€, Alma
                50–5&nbsp;000&nbsp;€.
              </Typography>
            </Alert>
          )}

          {success && autoSaveStatus === 'idle' && (
            <Alert severity="success" sx={{ mt: 2 }} onClose={() => setSuccess(false)}>
              Action effectuée
            </Alert>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}
