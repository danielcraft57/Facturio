# Changelog — module e-facture & documentation (mai 2026)

## Produit

- Module `e-invoicing` : scores conformité org / client / facture
- Export XML simplifié EN 16931 (pré-Factur-X)
- Champ SIREN client (API, formulaires, tests)
- UI : panneau conformité (compte, facture, dashboard)
- Pages légales PrestaFacture alignées sur danielcraft.fr (mentions, CGU, CGV, confidentialité)

## Documentation

- Mise à jour [FACTURATION_ELECTRONIQUE_2026.md](../planning/FACTURATION_ELECTRONIQUE_2026.md) (état d’implémentation)
- Nouveau dossier [accreditation-pa/](../accreditation-pa/README.md) (candidature PA)
- [E_INVOICING.md](../development/E_INVOICING.md), [CI_CD.md](../development/CI_CD.md)

## Tests & CI

- Tests unitaires et e2e e-invoicing
- CI GitHub : jobs `server-unit` et `server-e2e` séparés
- `vitest run` en CI frontend

## Non inclus

- PDF/A-3 Factur-X officiel
- Connexion Plateforme Agréée
- E-reporting
