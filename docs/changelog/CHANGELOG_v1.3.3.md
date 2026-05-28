# Changelog v1.3.3 — Devis public, acompte/solde, PDF et envoi SOL (mai 2026)

## Frontend (1.3.3)

- Parcours public devis renforcé :
  - page `accepter` sans flash radio au chargement
  - choix `paiement 100%` ou `acompte 10%` selon le contexte
  - état verrouillé quand le devis est refusé/expiré
- Page publique de refus revue :
  - confirmation avant refus
  - meilleure gestion des statuts déjà traités
- Facture client en ligne :
  - meilleur récapitulatif acompte/solde
  - libellé contextualisé (`Voir facture d'acompte` quand l'acompte est déjà réglé)

## Backend (1.3.3)

- Flux devis -> factures :
  - création/gestion idempotente des factures `ACO-*` (acompte) et `SOL-*` (solde)
  - blocage du paiement 100% quand un split acompte/solde existe déjà
- Règles métier SOL :
  - la facture de solde reste en brouillon tant qu'elle n'est pas envoyée explicitement par email
  - génération de lien public de paiement sans forcer un envoi
  - conservation correcte du statut `SENT` après envoi email réel
- Accès public harmonisé :
  - règles d'accès token centralisées pour les endpoints facture publique + checkout Stripe

## PDF & Email (1.3.3)

- Nouveau contrat d'engagement PDF dédié (distinct du devis/facture).
- Email `Paiement reçu` enrichi avec pièces jointes adaptées (facture + contrat selon le cas).
- Correctifs PDF majeurs :
  - correction du format monétaire (`1 100,00 €` au lieu de `1 /100,00 €`)
  - gestion multi-lignes et pagination du tableau
  - pied de page légal stabilisé (plus de chevauchement)

## Tests

- Ajout et extension des e2e sur le flux acompte/solde (`quotes-deposit.e2e-spec.ts`).
- Ajout de tests unitaires pour les utilitaires monétaires PDF et l'accès public token.
- Ajustements CI (tests frontend + e2e deposit) pour fiabiliser les runs GitHub Actions.

## Versionning

- Version applicative montée à `1.3.3`.
- Tag Git publié : `v1.3.3`.
