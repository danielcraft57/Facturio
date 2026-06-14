/** Contenu légal Facturio — éditeur : données alignées sur danielcraft.fr */

import { DANIELCRAFT_PUBLISHER, FACTURIO_SERVICE } from './danielcraftPublisher'

export const LEGAL_CONTROLLER = {
  name: `${DANIELCRAFT_PUBLISHER.legalName} — ${DANIELCRAFT_PUBLISHER.tradeName} (éditeur de ${FACTURIO_SERVICE.name})`,
  contact: DANIELCRAFT_PUBLISHER.email,
  dpo: DANIELCRAFT_PUBLISHER.email,
  siret: DANIELCRAFT_PUBLISHER.siret,
  address: DANIELCRAFT_PUBLISHER.address,
} as const

export type LegalSection = {
  title: string
  paragraphs: readonly string[]
  bullets?: readonly string[]
}

export const LEGAL_MENTIONS_SECTIONS: readonly LegalSection[] = [
  {
    title: '1. Éditeur du service',
    paragraphs: [
      `Le service en ligne ${FACTURIO_SERVICE.name} (${FACTURIO_SERVICE.description}) est édité par :`,
    ],
    bullets: [
      `${DANIELCRAFT_PUBLISHER.legalName} — ${DANIELCRAFT_PUBLISHER.tradeName}`,
      DANIELCRAFT_PUBLISHER.legalForm,
      `Adresse : ${DANIELCRAFT_PUBLISHER.address}`,
      `Email : ${DANIELCRAFT_PUBLISHER.email}`,
      `Téléphone : ${DANIELCRAFT_PUBLISHER.phone}`,
      `SIRET : ${DANIELCRAFT_PUBLISHER.siret}`,
      `SIREN : ${DANIELCRAFT_PUBLISHER.siren}`,
      `TVA : ${DANIELCRAFT_PUBLISHER.vatMention}`,
      `Site corporate : ${DANIELCRAFT_PUBLISHER.website}`,
    ],
  },
  {
    title: '2. Directeur de la publication',
    paragraphs: [`${DANIELCRAFT_PUBLISHER.legalName}.`],
  },
  {
    title: '3. Hébergement',
    paragraphs: [
      'L’application Facturio est hébergée sur une infrastructure cloud (Union européenne visée). Les coordonnées détaillées de l’hébergeur peuvent être communiquées sur demande à ' +
        DANIELCRAFT_PUBLISHER.email +
        '.',
      'Le site vitrine ' +
        DANIELCRAFT_PUBLISHER.websiteLabel +
        ' peut être hébergé séparément ; voir les mentions légales du site corporate.',
    ],
  },
  {
    title: '4. Propriété intellectuelle',
    paragraphs: [
      'Le logiciel Facturio, sa marque, son interface et sa documentation sont protégés par le droit d’auteur. Toute reproduction ou extraction non autorisée est interdite.',
      'Les contenus que vous saisissez (factures, devis, clients) restent votre propriété ; vous accordez à l’éditeur une licence technique limitée pour les héberger et les traiter aux fins du service.',
    ],
  },
  {
    title: '5. Données personnelles',
    paragraphs: [
      'Le traitement des données liées à votre compte Facturio est décrit dans la politique de confidentialité (/privacy). Pour le site danielcraft.fr, voir ' +
        DANIELCRAFT_PUBLISHER.website +
        '/politique-confidentialite.',
    ],
  },
  {
    title: '6. Cookies',
    paragraphs: [
      'Facturio utilise un cookie de session strictement nécessaire à l’authentification et, avec votre accord, des préférences locales (voir bannière cookies). Aucun cookie publicitaire tiers sur l’application.',
    ],
  },
  {
    title: '7. Droit applicable',
    paragraphs: [
      'Le droit français est applicable. En cas de litige, les tribunaux français seront compétents, sous réserve des dispositions impératives applicables aux consommateurs.',
    ],
  },
]

export const PRIVACY_SECTIONS: readonly LegalSection[] = [
  {
    title: 'Responsable du traitement',
    paragraphs: [
      `Pour l’utilisation de la plateforme Facturio (compte, abonnement, support), le responsable du traitement est ${LEGAL_CONTROLLER.name}. Contact : ${LEGAL_CONTROLLER.contact}.`,
      'Pour les données de vos propres clients (factures, devis, CRM), vous êtes responsable de traitement en tant que prestataire ; Facturio agit en qualité de sous-traitant pour l’hébergement et le traitement technique de ces données.',
    ],
  },
  {
    title: 'Données collectées',
    paragraphs: [
      'Compte : email, nom, mot de passe chiffré (bcrypt), dates de consentement CGU / confidentialité.',
      'Organisation : identité légale, coordonnées, paramètres métier.',
      'Clients & documents : données nécessaires aux devis et factures (identité, adresse, montants, lignes).',
      'Paiements : les cartes bancaires ne transitent pas par nos serveurs ; Stripe traite les paiements (voir sous-traitants).',
      'Cookies : cookie de session HTTP-only (authentification) ; préférence de consentement cookies (localStorage).',
    ],
  },
  {
    title: 'Finalités et bases légales',
    paragraphs: [
      'Exécution du contrat (fourniture du service de facturation).',
      'Obligations légales (conservation comptable des pièces que vous émettez).',
      'Intérêt légitime (sécurité, prévention de la fraude, amélioration produit).',
      'Consentement (cookies non essentiels, le cas échéant).',
    ],
  },
  {
    title: 'Sous-traitants',
    paragraphs: [
      'Hébergement / infrastructure (serveur applicatif et base de données, Union européenne visée).',
      'Stripe (deux usages distincts) : (1) abonnement Facturio Pro — compte plateforme ; (2) paiement de vos factures — votre compte Stripe enregistré dans Paramètres. Des DPA Stripe sont à conclure par chaque prestataire pour le flux (2).',
      'Envoi d’emails (SMTP) pour vérification de compte, factures et devis.',
      'Futur : Plateforme Agréée partenaire pour la facturation électronique 2026 (module en développement).',
    ],
  },
  {
    title: 'Durées de conservation',
    paragraphs: [
      'Compte actif : durée de la relation contractuelle.',
      'Après suppression de compte : effacement ou anonymisation sous 30 jours, sauf obligation légale de conservation (pièces comptables émises par vous).',
      'Journaux techniques : durée limitée (sécurité et diagnostic).',
    ],
  },
  {
    title: 'Sécurité',
    paragraphs: [
      'Authentification par cookie HTTP-only et JWT ; mots de passe hachés (bcrypt).',
      'Clés secrètes Stripe chiffrées en base (AES-256-GCM) si SECRETS_ENCRYPTION_KEY est configuré côté serveur.',
      'En-têtes de sécurité HTTP, limitation du débit sur l’authentification et les liens publics.',
      'Isolation des données par organisation (multi-tenant).',
    ],
  },
  {
    title: 'Vos droits',
    paragraphs: [
      'Accès, rectification, effacement, limitation, portabilité, opposition — dans Paramètres → Données personnelles (export JSON) ou par email à ' +
        LEGAL_CONTROLLER.contact + '.',
      'Réclamation auprès de la CNIL : www.cnil.fr.',
    ],
  },
  {
    title: 'Transferts hors UE',
    paragraphs: [
      'Nous visons un hébergement et des sous-traitants conformes au RGPD. Certains sous-traitants (ex. Stripe) peuvent impliquer des garanties contractuelles (clauses types) — consultez leur documentation.',
    ],
  },
]

export const TERMS_SECTIONS: readonly LegalSection[] = [
  {
    title: '1. Éditeur',
    paragraphs: [
      `Les présentes conditions générales d’utilisation (CGU) régissent l’accès au service ${FACTURIO_SERVICE.name}, édité par ${DANIELCRAFT_PUBLISHER.legalName} (${DANIELCRAFT_PUBLISHER.tradeName}), ${DANIELCRAFT_PUBLISHER.legalForm}, ${DANIELCRAFT_PUBLISHER.address}, SIRET ${DANIELCRAFT_PUBLISHER.siret}, ${DANIELCRAFT_PUBLISHER.vatMention}. Contact : ${DANIELCRAFT_PUBLISHER.email}.`,
    ],
  },
  {
    title: '2. Objet',
    paragraphs: [
      FACTURIO_SERVICE.description +
        ' L’utilisation de l’application implique l’acceptation des présentes CGU et de la politique de confidentialité.',
    ],
  },
  {
    title: '3. Accès au service',
    paragraphs: [
      'Le service est accessible via navigateur web, sous réserve d’une connexion Internet et d’un compte utilisateur valide. L’éditeur peut suspendre l’accès pour maintenance, sécurité ou force majeure.',
    ],
  },
  {
    title: '4. Compte et sécurité',
    paragraphs: [
      'Vous êtes responsable de la confidentialité de vos identifiants. Signalez toute compromission à ' +
        LEGAL_CONTROLLER.contact +
        '.',
      'L’inscription requiert l’acceptation des CGU et de la politique de confidentialité, ainsi qu’un mot de passe d’au moins 8 caractères.',
    ],
  },
  {
    title: '5. Utilisation acceptable',
    paragraphs: [
      'Vous vous engagez à utiliser Facturio conformément aux lois en vigueur, sans tentative d’intrusion, de spam ou de détournement du service. Toute utilisation abusive peut entraîner la suspension du compte.',
    ],
  },
  {
    title: '6. Vos obligations métier',
    paragraphs: [
      'Vous restez seul responsable du contenu de vos devis et factures, de la TVA, des mentions légales et de la conformité à la réforme de facturation électronique 2026.',
      'Les liens publics de factures contiennent un token secret : ne les diffusez qu’aux destinataires concernés.',
    ],
  },
  {
    title: '7. Offres et limites',
    paragraphs: [
      'Le plan Free est limité (factures / mois, pas de compta FEC). Les paliers payants et le module e-facture peuvent évoluer ; les changements substantiels seront signalés.',
      'Le module e-facture (PA, Factur-X) est en développement : son activation effective sera communiquée distinctement.',
    ],
  },
  {
    title: '8. Données personnelles',
    paragraphs: [
      'Le traitement de vos données et de celles de vos clients est décrit dans la politique de confidentialité (/privacy).',
    ],
  },
  {
    title: '9. Propriété intellectuelle',
    paragraphs: [
      'Le service, sa marque et sa documentation restent la propriété de l’éditeur. Vos documents commerciaux (devis, factures) vous appartiennent.',
    ],
  },
  {
    title: '10. Modifications et droit applicable',
    paragraphs: [
      'L’éditeur peut modifier les présentes CGU ; les utilisateurs sont invités à les consulter régulièrement. Le droit français est applicable.',
      `Dernière mise à jour Facturio : ${DANIELCRAFT_PUBLISHER.facturioLegalUpdated}.`,
    ],
  },
]

/** CGV — abonnements et prestations SaaS Facturio (vendeur : DanielCraft). */
export const SALES_TERMS_SECTIONS: readonly LegalSection[] = [
  {
    title: '1. Identification du vendeur',
    paragraphs: [
      `Les présentes conditions générales de vente (CGV) s’appliquent aux abonnements et services payants ${FACTURIO_SERVICE.name}.`,
    ],
    bullets: [
      `${DANIELCRAFT_PUBLISHER.legalName} — ${DANIELCRAFT_PUBLISHER.tradeName}`,
      DANIELCRAFT_PUBLISHER.legalForm,
      `Adresse : ${DANIELCRAFT_PUBLISHER.address}`,
      `Email : ${DANIELCRAFT_PUBLISHER.email}`,
      `Téléphone : ${DANIELCRAFT_PUBLISHER.phone}`,
      `SIRET : ${DANIELCRAFT_PUBLISHER.siret}`,
      `TVA : ${DANIELCRAFT_PUBLISHER.vatMention}`,
    ],
  },
  {
    title: '2. Objet',
    paragraphs: [
      'Les CGV régissent la souscription aux offres Free, Pro, Pro + e-facture et Agence, ainsi que les options associées (module e-facture, etc.). Toute souscription ou paiement d’abonnement vaut acceptation des présentes CGV et des CGU.',
    ],
  },
  {
    title: '3. Offres et commande',
    paragraphs: [
      'Les tarifs en vigueur sont affichés sur la page Tarifs. La commande est effective à la validation du paiement via Stripe (abonnement plateforme Facturio) ou à l’acceptation d’un devis spécifique communiqué par email.',
      'Le plan Free est soumis à des limites d’usage (nombre de factures par mois). Les paliers payants lèvent ces limites selon les fonctionnalités décrites sur le site.',
    ],
  },
  {
    title: '4. Tarifs et facturation',
    paragraphs: [
      'Les prix sont indiqués en euros. Selon le statut fiscal de l’éditeur, les factures peuvent être émises hors TVA (art. 293 B du CGI) avec mention appropriée.',
      'Les factures d’abonnement sont envoyées par email. Le client conserve un accès à l’historique via son espace Stripe lorsque applicable.',
    ],
  },
  {
    title: '5. Paiement et renouvellement',
    paragraphs: [
      'Les abonnements sont reconduits tacitement par période mensuelle sauf résiliation depuis l’espace client ou par demande à ' +
        DANIELCRAFT_PUBLISHER.email +
        '.',
      'En cas de défaut de paiement, l’accès aux fonctionnalités payantes peut être suspendu après relance.',
      'Les pénalités de retard et l’indemnité forfaitaire pour frais de recouvrement applicables aux professionnels en retard de paiement peuvent être appliquées conformément à la réglementation en vigueur.',
    ],
  },
  {
    title: '6. Droit de rétractation',
    paragraphs: [
      'Pour les consommateurs, un délai de rétractation de 14 jours peut s’appliquer aux contrats conclus à distance, sous réserve des exceptions légales pour les contenus numériques fournis immédiatement avec accord exprès. Les professionnels ne bénéficient pas du droit de rétractation B2C.',
    ],
  },
  {
    title: '7. Module e-facture 2026',
    paragraphs: [
      'Le palier « Pro + e-facture » réserve l’accès au rapport de conformité et à l’export Factur-X. La connexion à une Plateforme Agréée partenaire est en cours de développement ; son activation effective sera communiquée distinctement sans surcoût abusif par rapport au palier réservé.',
    ],
  },
  {
    title: '8. Propriété intellectuelle et support',
    paragraphs: [
      'L’accès au logiciel est concédé sous licence d’utilisation non exclusive, personnelle et non transférable, pour la durée de l’abonnement. Le support est fourni par email à ' +
        DANIELCRAFT_PUBLISHER.email +
        ' selon le plan souscrit.',
    ],
  },
  {
    title: '9. Litiges',
    paragraphs: [
      'En cas de litige, une solution amiable sera recherchée. À défaut, les tribunaux français seront compétents.',
      `Dernière mise à jour : ${DANIELCRAFT_PUBLISHER.facturioLegalUpdated} (alignée sur les CGV ${DANIELCRAFT_PUBLISHER.websiteLabel}, ${DANIELCRAFT_PUBLISHER.legalPagesUpdated}).`,
    ],
  },
]

export const COOKIE_NOTICE =
  'Nous utilisons un cookie de session strictement nécessaire à la connexion et, avec votre accord, des préférences locales. Aucun cookie publicitaire tiers.'
