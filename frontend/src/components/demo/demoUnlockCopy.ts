import type { DemoExploreStepId } from '../../utils/demoExploreStorage'

/** Message affiché au déblocage d'une étape de quête démo. */
export const DEMO_UNLOCK_COPY: Record<DemoExploreStepId, { title: string; message: string }> = {
  'see-invoice': {
    title: 'Facture consultée',
    message: 'PDF, statuts et score conformité — c\'est votre aha moment Facturio.',
  },
  'see-quote': {
    title: 'Devis consulté',
    message: 'Encore une étape et vous maîtrisez tout le flux commercial.',
  },
  'see-efacture': {
    title: 'Conformité 2026 vue',
    message: 'Vous savez où vous en êtes avant la PA — prêt à émettre vos vraies factures.',
  },
}
