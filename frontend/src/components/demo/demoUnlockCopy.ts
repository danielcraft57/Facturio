import type { DemoExploreStepId } from '../../utils/demoExploreStorage'

/** Message affiché au déblocage d'une étape de quête démo. */
export const DEMO_UNLOCK_COPY: Record<
  DemoExploreStepId,
  { title: string; message: string; nextAction?: { label: string; to: string } }
> = {
  'see-invoice': {
    title: 'Facture consultée',
    message: 'PDF, statuts et score conformité — c\'est votre aha moment Facturio.',
    nextAction: { label: 'Voir un devis exemple', to: '/devis/inbox' },
  },
  'see-quote': {
    title: 'Devis consulté',
    message: 'Du brouillon à l\'accepté — même flux que vos vrais devis.',
    nextAction: { label: 'Voir mon score conformité 2026', to: '/parametres/facturation-electronique' },
  },
  'see-efacture': {
    title: 'Conformité 2026 vue',
    message: 'Vous savez où vous en êtes avant la PA — prêt à émettre vos vraies factures.',
    nextAction: { label: 'Créer mon compte gratuit', to: '/signup?from=demo' },
  },
}
