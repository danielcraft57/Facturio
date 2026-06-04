import { useCallback, useEffect, useState } from 'react'

import {

  Alert,

  Box,

  Button,

  Stack,

  TextField,

  Typography,

} from '@mui/material'

import { AccountBalanceWallet } from '@mui/icons-material'

import {

  FinanceFormDialogShell,

  FinanceFormSectionTitle,

  financeFieldSx,

} from '../../../components/finance/FinanceFormDialog'

import { FinanceClientAutocomplete, type FinanceClientOption } from '../../../components/finance/FinanceClientAutocomplete'

import { financePrimaryButtonSx } from '../../../components/finance/financeStyles'

import {

  clientQueryDraft,

  guessClientNameFromQuery,

  isClientEmail,

} from '../../../components/finance/financeClientQuery'

import { payablesService, type PayableCreditor } from '../../../services/payables'

import { defaultPayableDebtDueDateIso, PAYABLE_DEBT_DUE_DATE_HELPER } from '../payableDebtDefaults'



export type CreatePayableDebtPayload = {

  creditorId: number

  label: string

  totalAmount: number

  dueDate?: string

  notes?: string

}



type Props = {

  open: boolean

  saving: boolean

  onClose: () => void

  onSubmit: (payload: CreatePayableDebtPayload) => void | Promise<void>

}



export function CreatePayableDebtDialog({ open, saving, onClose, onSubmit }: Props) {

  const [creditors, setCreditors] = useState<PayableCreditor[]>([])

  const [loadingCreditors, setLoadingCreditors] = useState(false)

  const [creditorQuery, setCreditorQuery] = useState('')

  const [willCreateCreditor, setWillCreateCreditor] = useState(false)

  const [createCreditorError, setCreateCreditorError] = useState<string | null>(null)



  const [creditorId, setCreditorId] = useState('')

  const [creditorName, setCreditorName] = useState('')

  const [creditorEmail, setCreditorEmail] = useState('')

  const [label, setLabel] = useState('')

  const [amount, setAmount] = useState('')

  const [dueDate, setDueDate] = useState(defaultPayableDebtDueDateIso())

  const [notes, setNotes] = useState('')

  const [formError, setFormError] = useState<string | null>(null)



  const creditorOptions: FinanceClientOption[] = creditors.map((c) => ({

    id: String(c.id),

    name: c.name,

    email: c.email ?? undefined,

  }))



  const loadCreditors = useCallback(async () => {

    setLoadingCreditors(true)

    try {

      const list = await payablesService.listCreditors()

      setCreditors(list)

    } catch {

      setCreditors([])

    } finally {

      setLoadingCreditors(false)

    }

  }, [])



  useEffect(() => {

    if (!open) return

    setCreditorQuery('')

    setWillCreateCreditor(false)

    setCreateCreditorError(null)

    setCreditorId('')

    setCreditorName('')

    setCreditorEmail('')

    setLabel('')

    setAmount('')

    setDueDate(defaultPayableDebtDueDateIso())

    setNotes('')

    setFormError(null)

    void loadCreditors()

  }, [open, loadCreditors])



  const handleSubmit = async () => {

    const parsedAmount = Number(amount.replace(',', '.'))

    if (!label.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {

      setFormError('Libellé et montant requis')

      return

    }

    if (!creditorId && !creditorName.trim()) {

      setFormError('Choisissez ou créez un créancier')

      return

    }



    setFormError(null)

    let cid = creditorId ? Number(creditorId) : 0

    if (!cid) {

      try {

        const created = await payablesService.createCreditor({

          name: creditorName.trim(),

          email: creditorEmail.trim() || undefined,

        })

        cid = created.id

      } catch (err: unknown) {

        setFormError(err instanceof Error ? err.message : 'Impossible de créer le créancier')

        return

      }

    }



    await onSubmit({

      creditorId: cid,

      label: label.trim(),

      totalAmount: parsedAmount,

      dueDate: dueDate || undefined,

      notes: notes.trim() || undefined,

    })

  }



  return (

    <FinanceFormDialogShell

      open={open}

      onClose={onClose}

      title="Nouvelle dette"

      icon={<AccountBalanceWallet />}

      maxWidth="sm"

      actions={

        <>

          <Button onClick={onClose} disabled={saving} sx={{ mr: 'auto' }}>

            Annuler

          </Button>

          <Button

            variant="contained"

            onClick={() => void handleSubmit()}

            disabled={saving}

            sx={financePrimaryButtonSx}

          >

            {saving ? 'Enregistrement…' : 'Enregistrer la dette'}

          </Button>

        </>

      }

    >

      <Stack spacing={2.5}>

        {formError && (

          <Alert severity="error" onClose={() => setFormError(null)}>

            {formError}

          </Alert>

        )}



        <Alert severity="info" sx={{ alignItems: 'flex-start' }}>

          <Typography variant="body2" component="div">

            Le <strong>créancier</strong> est la personne à qui vous devez de l&apos;argent (prêteur,

            fournisseur, famille…). Distinct des <strong>clients</strong> Facturio. Ensuite, partagez

            la reconnaissance par email ou copiez le lien public.

          </Typography>

        </Alert>



        <Box>

          <FinanceFormSectionTitle>Créancier</FinanceFormSectionTitle>

          <Box sx={financeFieldSx}>

            <FinanceClientAutocomplete

              label="Créancier"

              placeholder="Nom ou email…"

              options={creditorOptions}

              loading={loadingCreditors}

              valueId={creditorId}

              query={creditorQuery}

              onQueryChange={(v) => {

                setCreditorQuery(v)

                setCreateCreditorError(null)

                const draft = clientQueryDraft(

                  v,

                  creditorOptions.map((c) => ({ id: c.id, name: c.name, email: c.email })),

                )

                if (!v.trim()) {

                  setWillCreateCreditor(false)

                  setCreditorId('')

                  setCreditorName('')

                  setCreditorEmail('')

                  return

                }

                if (draft.matched) {

                  setWillCreateCreditor(false)

                  setCreditorId(draft.matched.id)

                  setCreditorName('')

                  setCreditorEmail(draft.matched.email?.trim() ?? '')

                  return

                }

                setWillCreateCreditor(true)

                setCreditorId('')

                setCreditorName(draft.suggestedName)

                setCreditorEmail(draft.suggestedEmail || creditorEmail)

              }}

              onSelectClientId={(id) => {

                const picked = creditorOptions.find((c) => c.id === id)

                setWillCreateCreditor(false)

                setCreditorId(id)

                setCreditorName('')

                setCreateCreditorError(null)

                if (picked) {

                  setCreditorEmail(picked.email?.trim() ?? '')

                  setCreditorQuery(picked.email ? `${picked.name} — ${picked.email}` : picked.name)

                }

              }}

              onCreateRequested={() => {

                const seed = creditorQuery.trim()

                setWillCreateCreditor(true)

                setCreditorId('')

                if (isClientEmail(seed)) {

                  setCreditorEmail(seed)

                  setCreditorName(guessClientNameFromQuery(seed))

                } else {

                  setCreditorName(seed || creditorName)

                }

              }}

              helperText="Recherchez un créancier existant ou créez-en un (nom + email optionnel)."

              entitySingular="créancier"

              creatingInline={willCreateCreditor}

              createName={creditorName}

              createEmail={creditorEmail}

              createError={createCreditorError}

              onCreateNameChange={setCreditorName}

              onCreateEmailChange={setCreditorEmail}

              onCreateCancel={() => {

                setWillCreateCreditor(false)

                setCreditorName('')

                setCreditorEmail('')

              }}

            />

          </Box>

        </Box>



        <Box>

          <FinanceFormSectionTitle>Dette</FinanceFormSectionTitle>

          <Stack spacing={2} sx={financeFieldSx}>

            <TextField

              label="Libellé"

              placeholder="Ex. Prêt personnel, facture hébergeur"

              value={label}

              onChange={(e) => setLabel(e.target.value)}

              fullWidth

              required

            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>

              <TextField

                label="Montant dû (€)"

                placeholder="164,52"

                value={amount}

                onChange={(e) => setAmount(e.target.value)}

                fullWidth

                required

                inputMode="decimal"

              />

              <TextField

                label="Échéance"

                type="date"

                value={dueDate}

                onChange={(e) => setDueDate(e.target.value)}

                fullWidth

                InputLabelProps={{ shrink: true }}

                helperText={PAYABLE_DEBT_DUE_DATE_HELPER}

              />

            </Stack>

            <TextField

              label="Note (optionnel)"

              value={notes}

              onChange={(e) => setNotes(e.target.value)}

              fullWidth

              multiline

              minRows={2}

            />

          </Stack>

        </Box>

      </Stack>

    </FinanceFormDialogShell>

  )

}

