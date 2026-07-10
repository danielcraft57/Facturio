import type { AccountActivationStepId } from '../../utils/accountActivationStorage'

/** Message affiché au déblocage d'une étape d'activation (capacité réelle, pas marketing). */
export const ACTIVATION_UNLOCK_COPY: Record<AccountActivationStepId, { title: string; message: string }> = {
  'setup-company': {
    title: 'Entreprise configurée',
    message: 'Vos prochains PDF pourront afficher SIRET et coordonnées complètes.',
  },
  'first-client': {
    title: 'Client enregistré',
    message: 'Créez une facture préremplie depuis la fiche client ou le menu « … ».',
  },
  'first-invoice': {
    title: 'Première facture créée',
    message: 'Envoyez le PDF au client ou repassez en mode avancé sur vos prochains brouillons.',
  },
}
