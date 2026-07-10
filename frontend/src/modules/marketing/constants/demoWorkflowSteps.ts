import type { WorkflowStep } from '../components/MarketingWorkflowDemo'

/**
 * Captures overflow alignées sur le parcours démo Playwright
 * (docs/marketing/demo/captures — mêmes écrans copiés en public).
 */
const CAPTURE = '/images/marketing/overflow/captures'

/** Parcours devis — même enchaînement que la démo guidée. */
export const DEMO_ALIGNED_QUOTE_STEPS: WorkflowStep[] = [
  {
    src: `${CAPTURE}/devis-inbox.png`,
    label: 'Inbox',
    alt: 'Liste des devis',
    caption: 'Comme dans la démo : pipeline commercial, dossiers et statuts.',
  },
  {
    src: `${CAPTURE}/devis-nouveau-modal.png`,
    label: 'Création',
    alt: 'Modal nouveau devis',
    caption: 'Modal rapide — client, lignes catalogue, totaux en direct.',
  },
  {
    src: `${CAPTURE}/devis-detail.png`,
    label: 'Détail',
    alt: 'Fiche devis',
    caption: 'Acompte, acceptation client et conversion en facture.',
  },
]

/** Parcours facture — aligné captures démo factures. */
export const DEMO_ALIGNED_INVOICE_STEPS: WorkflowStep[] = [
  {
    src: `${CAPTURE}/factures-inbox.png`,
    label: 'Inbox',
    alt: 'Liste des factures',
    caption: 'Même vue que l\'espace démo : brouillons, envoyées, payées.',
  },
  {
    src: `${CAPTURE}/factures-nouvelle-modal.png`,
    label: 'Création',
    alt: 'Modal nouvelle facture',
    caption: 'Même ergonomie que les devis — une seule logique métier.',
  },
  {
    src: `${CAPTURE}/facture-detail.png`,
    label: 'Détail',
    alt: 'Fiche facture',
    caption: 'PDF, score conformité, paiement Stripe et historique.',
  },
]
