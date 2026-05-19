import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import {
  organizationService,
  type OrganizationProfile,
  type UpdateInvoiceStripe,
} from '../../services/organizationService'
import { unwrapApiPayload } from '../../services/clients'

type Props = {
  profile: OrganizationProfile | null
  onUpdated: (profile: OrganizationProfile) => void
}

export function InvoiceStripeSection({ profile, onUpdated }: Props) {
  const [form, setForm] = useState<UpdateInvoiceStripe>({})
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    organizationService
      .getInvoiceStripeWebhookUrl()
      .then((res) => setWebhookUrl(unwrapApiPayload<{ webhookUrl: string }>(res).webhookUrl))
      .catch(() => setWebhookUrl(null))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const res = await organizationService.updateInvoiceStripe(form)
      const updated = unwrapApiPayload<OrganizationProfile>(res)
      onUpdated(updated)
      setForm({})
      setSuccess(true)
    } catch (err: unknown) {
      setError((err as Error)?.message ?? 'Erreur enregistrement Stripe')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Stripe prestataire (paiements de vos factures)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Clés de votre compte Stripe pour que vos clients paient vos factures. Les clés secrètes sont
          chiffrées en base lorsque le serveur dispose de SECRETS_ENCRYPTION_KEY. Ne pas confondre avec
          le Stripe Facturio (abonnement Pro).
        </Typography>
        {profile?.invoiceStripeSecretKeySet && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Clé secrète enregistrée
            {profile.invoiceStripePublishableKeyPreview
              ? ` · Publishable : ${profile.invoiceStripePublishableKeyPreview}`
              : ''}
          </Alert>
        )}
        {webhookUrl && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            URL webhook à configurer dans le tableau de bord Stripe :<br />
            <Typography component="code" variant="body2" sx={{ wordBreak: 'break-all' }}>
              {webhookUrl}
            </Typography>
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Clé publishable (pk_…)"
            margin="normal"
            value={form.invoiceStripePublishableKey ?? ''}
            onChange={(e) =>
              setForm((f) => ({ ...f, invoiceStripePublishableKey: e.target.value }))
            }
          />
          <TextField
            fullWidth
            label="Clé secrète (sk_…)"
            margin="normal"
            type="password"
            placeholder={profile?.invoiceStripeSecretKeySet ? '•••••••• (laisser vide pour ne pas changer)' : ''}
            value={form.invoiceStripeSecretKey ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, invoiceStripeSecretKey: e.target.value }))}
          />
          <TextField
            fullWidth
            label="Secret webhook (whsec_…)"
            margin="normal"
            type="password"
            placeholder={profile?.invoiceStripeWebhookSecretSet ? '••••••••' : ''}
            value={form.invoiceStripeWebhookSecret ?? ''}
            onChange={(e) =>
              setForm((f) => ({ ...f, invoiceStripeWebhookSecret: e.target.value }))
            }
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Stripe prestataire enregistré
            </Alert>
          )}
          <Button
            type="submit"
            variant="contained"
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
            disabled={saving}
            sx={{ mt: 2 }}
          >
            Enregistrer Stripe factures
          </Button>
        </Box>
      </CardContent>
    </Card>
  )
}
