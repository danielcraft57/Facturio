import type { WorkflowStep } from '../components/MarketingWorkflowDemo'

const WORKFLOW_BASE = '/images/marketing/workflow'

export const QUOTE_WORKFLOW_STEPS: WorkflowStep[] = [
  {
    src: `${WORKFLOW_BASE}/quote-01-liste.png`,
    label: 'Liste',
    alt: 'Liste des devis',
    caption: 'Tous vos devis, classés comme une boîte mail pro.',
  },
  {
    src: `${WORKFLOW_BASE}/quote-02-modal-vide.png`,
    label: 'Nouveau',
    alt: 'Modal nouveau devis',
    caption: 'Création en modal — sans quitter la liste.',
  },
  {
    src: `${WORKFLOW_BASE}/quote-03-modal-client.png`,
    label: 'Client',
    alt: 'Sélection client',
    caption: 'Recherche client ou création inline.',
  },
  {
    src: `${WORKFLOW_BASE}/quote-04-modal-lignes.png`,
    label: 'Lignes',
    alt: 'Lignes du devis',
    caption: 'Prestations du catalogue, TVA et totaux en direct.',
  },
  {
    src: `${WORKFLOW_BASE}/quote-05-devis-cree.png`,
    label: 'Créé',
    alt: 'Devis créé',
    caption: 'Devis prêt — acompte, acceptation et conversion facture.',
  },
  {
    src: `${WORKFLOW_BASE}/quote-06-envoi-email.png`,
    label: 'Envoi',
    alt: 'Envoi par email',
    caption: 'Envoi au client en un clic, copie pour vous.',
  },
]

export const INVOICE_WORKFLOW_STEPS: WorkflowStep[] = [
  {
    src: `${WORKFLOW_BASE}/invoice-01-liste.png`,
    label: 'Liste',
    alt: 'Liste des factures',
    caption: 'Suivi des statuts : brouillon, envoyée, payée, en retard.',
  },
  {
    src: `${WORKFLOW_BASE}/invoice-02-modal-vide.png`,
    label: 'Nouvelle',
    alt: 'Modal nouvelle facture',
    caption: 'Même ergonomie que les devis — une seule logique.',
  },
  {
    src: `${WORKFLOW_BASE}/invoice-03-modal-client.png`,
    label: 'Client',
    alt: 'Client facture',
    caption: 'Client B2B avec SIREN déjà en base.',
  },
  {
    src: `${WORKFLOW_BASE}/invoice-04-modal-lignes.png`,
    label: 'Lignes',
    alt: 'Lignes facture',
    caption: 'Lignes, échéance et total TTC calculés.',
  },
  {
    src: `${WORKFLOW_BASE}/invoice-05-facture-creee.png`,
    label: 'Émise',
    alt: 'Facture créée',
    caption: 'PDF, paiement Stripe et historique sur la fiche.',
  },
  {
    src: `${WORKFLOW_BASE}/invoice-06-envoi-email.png`,
    label: 'Envoi',
    alt: 'Envoi facture',
    caption: 'Email au client avec lien de paiement si Stripe est actif.',
  },
]
