/**
 * Libellés e-facture pour l'application (hors pages marketing).
 * Alignés sur la posture produit : pas de promesse PA connectée tant que le module n'est pas livré.
 */

/** Fonctionnalités e-facture disponibles aujourd'hui dans l'app. */
export const EFACTURE_LIVE_IN_APP = [
  'Indicateur de conformité par organisation et par facture',
  'Contrôles SIRET, SIREN client B2B et mentions obligatoires',
  'Préparation à la facturation électronique sur le palier Pro + e-facture',
] as const

/** Modules e-facture annoncés mais non livrés — ne pas exposer d'actions utilisateur dessus. */
export const EFACTURE_ROADMAP_IN_APP = [
  'Connexion à une Plateforme Agréée partenaire (émission / réception B2B)',
  'E-reporting (flux complémentaires réglementaires)',
] as const

/** Rappel court affiché dans les écrans Paramètres et fiche facture. */
export const EFACTURE_IN_APP_DISCLAIMER =
  'Disponible aujourd\'hui : indicateur de conformité et contrôles sur vos factures. La connexion à une plateforme agréée et les déclarations complémentaires sont en cours de développement ; vous serez informé à l\'activation, sans surcoût abusif par rapport au palier Pro + e-facture réservé.'

/** Libellé chip quand le plan e-facture est actif mais la PA n'est pas encore connectée. */
export const PA_CONNECTOR_CHIP_LABEL = 'Plateforme agréée : en cours de déploiement'

/** Rappel court pour popin beta, toasts lifecycle et emails (même formulation). */
export const EFACTURE_NOT_LIVE_SHORT =
  'Connexion plateforme agréée et déclarations complémentaires : en développement — aucune transmission officielle dans l\'app aujourd\'hui.'

