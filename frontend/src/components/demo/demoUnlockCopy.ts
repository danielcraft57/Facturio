import type { DemoExploreStepId } from '../../utils/demoExploreStorage'

/** Message affiché au déblocage d'une étape de quête démo. */
export const DEMO_UNLOCK_COPY: Record<DemoExploreStepId, { title: string; message: string }> = {
  'see-invoice': {
    title: 'Facture consultée',
    message: 'PDF, statuts et score conformité — comme pour vos vrais clients.',
  },
  'see-quote': {
    title: 'Devis consulté',
    message: 'Acompte, acceptation et conversion facture en un flux.',
  },
  'see-efacture': {
    title: 'Conformité 2026',
    message: 'Indicateur sur chaque facture — la PA arrivera plus tard.',
  },
}
