/** Aligné sur server/src/common/payable-debt-legal.util.ts (affichage UI). */

export const PAYABLE_DEBT_LEGAL_INTRO =
  'Document informatif de reconnaissance de dette — sans conseil juridique. En cas de montant élevé ou de litige, consultez un professionnel du droit.'

export const PAYABLE_DEBT_LEGAL_ITEMS: ReadonlyArray<{ title: string; body: string }> = [
  {
    title: 'Reconnaissance',
    body: 'Le débiteur reconnaît devoir au créancier le montant et le motif indiqués. Une reconnaissance par le débiteur interrompt la prescription (art. 2240 C. civ.).',
  },
  {
    title: 'Prescription',
    body: 'Sauf interruption ou suspension, la créance se prescrit en principe au bout de cinq ans (art. 2224 C. civ.).',
  },
  {
    title: 'Échéance',
    body: 'La date convenue est une échéance contractuelle ; elle ne remplace pas les règles légales de prescription.',
  },
  {
    title: 'Intérêts',
    body: 'Aucun intérêt ni indemnité forfaitaire par défaut, sauf accord écrit ou texte applicable (ex. B2B, art. L. 441-10 C. com.).',
  },
  {
    title: 'Remboursement',
    body: 'Modalités (virement, espèces, etc.) convenues entre les parties. Ce document n’est pas un titre exécutoire.',
  },
  {
    title: 'Valeur probante',
    body: 'Courriel et page en ligne = trace écrite ; un acte complémentaire peut être utile en cas de litige important.',
  },
]

export const PAYABLE_DEBT_RGPD_HINT =
  'Données personnelles : coordonnées et montants traités par l’émetteur pour la reconnaissance et le suivi de la dette. Exercice des droits auprès de l’émetteur (voir fiche entreprise / politique de confidentialité).'

/** @deprecated Utiliser PAYABLE_DEBT_LEGAL_ITEMS[2] — conservé pour le helper date du formulaire. */
export const PAYABLE_DEBT_DUE_DATE_HELPER =
  'Par défaut dans 5 ans, aligné sur la prescription ordinaire (art. 2224 C. civ.). À ajuster selon votre accord avec le créancier.'
