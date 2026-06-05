import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  TextField,
  Typography,
} from '@mui/material'
import { ContentCopy, Send } from '@mui/icons-material'
import { payablesService, type PayableDebtRow } from '../../../services/payables'
import { useToast } from '../../../components/useToast'
import { useAuthStore } from '../../../stores/authStore'
import { financePrimaryButtonSx } from '../../../components/finance/financeStyles'
import { formatCurrency } from '../../../utils/formatters'
import { PayableDebtLegalNotice } from './PayableDebtLegalNotice'

type Props = {
  open: boolean
  debt: PayableDebtRow | null
  paymentAmount: number
  onClose: () => void
  onSent?: () => void | Promise<void>
}

export function SendPayableDebtPaymentNoticeDialog({
  open,
  debt,
  paymentAmount,
  onClose,
  onSent,
}: Props) {
  const toast = useToast()
  const currentUser = useAuthStore((s) => s.user)
  const [email, setEmail] = useState('')
  const [updateCreditorEmail, setUpdateCreditorEmail] = useState(true)
  const [copyToSelf, setCopyToSelf] = useState(true)
  const [additionalRecipients, setAdditionalRecipients] = useState('')
  const [sending, setSending] = useState(false)
  const [copying, setCopying] = useState(false)
  const [publicUrl, setPublicUrl] = useState<string | null>(null)

  const fullyPaid = debt?.status === 'PAID'
  const emailSubject = fullyPaid
    ? 'Remboursement de la dette'
    : 'Remboursement partiel de la dette'

  const creditorHasEmail = Boolean(debt?.creditorEmail?.trim())

  useEffect(() => {
    if (!open || !debt) return
    setEmail(debt.creditorEmail?.trim() ?? '')
    setUpdateCreditorEmail(!creditorHasEmail)
    setCopyToSelf(true)
    setAdditionalRecipients('')
    setPublicUrl(null)
  }, [open, debt, creditorHasEmail])

  const resolvePublicUrl = useCallback(async (): Promise<string> => {
    if (!debt) throw new Error('Dette introuvable')
    if (publicUrl) return publicUrl
    const res = await payablesService.preparePublicLink(debt.id)
    setPublicUrl(res.url)
    return res.url
  }, [debt, publicUrl])

  const handleCopyLink = async () => {
    if (!debt) return
    setCopying(true)
    try {
      const url = await resolvePublicUrl()
      try {
        await navigator.clipboard.writeText(url)
        toast.success('Lien public copié')
      } catch {
        window.prompt('Copiez ce lien :', url)
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Impossible de générer le lien')
    } finally {
      setCopying(false)
    }
  }

  const handleSend = async () => {
    if (!debt) return
    const to = email.trim()
    if (!to) return
    setSending(true)
    try {
      const res = await payablesService.sendPaymentNotice(debt.id, {
        email: to,
        paymentAmount,
        updateClientEmail: updateCreditorEmail,
        copyToSelf,
        additionalRecipients,
      })
      if (res.url) setPublicUrl(res.url)
      toast.success(`${emailSubject} — envoyé à ${res.sentTo}`)
      await onSent?.()
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur à l’envoi')
    } finally {
      setSending(false)
    }
  }

  const busy = sending || copying

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Informer le créancier du remboursement</DialogTitle>
      <DialogContent>
        {debt && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Dette <strong>{debt.label}</strong> — {debt.creditorName}
              <br />
              Remboursement enregistré : <strong>{formatCurrency(paymentAmount)}</strong>
              {fullyPaid ? (
                <>
                  {' '}
                  — <strong>dette soldée</strong>
                </>
              ) : (
                <>
                  {' '}
                  — reste : <strong>{formatCurrency(debt.balance)}</strong>
                </>
              )}
            </Typography>

            <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
              Le remboursement est enregistré. Prévenez le créancier par email (objet :{' '}
              <strong>{emailSubject}</strong>) ou copiez le lien public.
            </Alert>

            <TextField
              fullWidth
              required
              type="email"
              label="Email du créancier"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="creancier@exemple.com"
              autoFocus
              margin="dense"
            />
            {!creditorHasEmail && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={updateCreditorEmail}
                    onChange={(e) => setUpdateCreditorEmail(e.target.checked)}
                  />
                }
                label="Enregistrer cet email sur la fiche créancier"
                sx={{ mt: 1, display: 'block' }}
              />
            )}
            <FormControlLabel
              control={
                <Checkbox
                  checked={copyToSelf}
                  onChange={(e) => setCopyToSelf(e.target.checked)}
                />
              }
              label="M’envoyer une copie"
              sx={{ mt: 1, display: 'block' }}
            />
            {copyToSelf && (
              <>
                <TextField
                  fullWidth
                  margin="dense"
                  type="email"
                  label="M’envoyer une copie à"
                  value={currentUser?.email ?? ''}
                  InputProps={{ readOnly: true }}
                  helperText="Copie informative pour votre suivi."
                />
                <TextField
                  fullWidth
                  margin="dense"
                  label="Autres destinataires (copie)"
                  placeholder="copie1@exemple.com, copie2@exemple.com"
                  value={additionalRecipients}
                  onChange={(e) => setAdditionalRecipients(e.target.value)}
                  helperText="Séparez les adresses par des virgules ou des points-virgules."
                />
              </>
            )}

            <Box sx={{ mt: 2 }}>
              <PayableDebtLegalNotice variant="compact" showDisclaimer={false} />
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Button onClick={onClose} disabled={busy} sx={{ mr: 'auto' }}>
          Plus tard
        </Button>
        <Button
          variant="outlined"
          startIcon={<ContentCopy />}
          onClick={() => void handleCopyLink()}
          disabled={busy || !debt}
        >
          {copying ? 'Lien…' : 'Copier le lien'}
        </Button>
        <Button
          variant="contained"
          startIcon={<Send />}
          onClick={() => void handleSend()}
          disabled={busy || !email.trim()}
          sx={financePrimaryButtonSx}
        >
          {sending ? 'Envoi…' : 'Envoyer'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
