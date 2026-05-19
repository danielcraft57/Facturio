# Architecture — solution compatible Facturio

## Schéma cible

```
┌──────────────────────────────────────────────────────────────┐
│  Facturio (SaaS)                                              │
│  · Organisation (SIRET, SIREN, TVA, adresse)                    │
│  · Clients B2B (SIREN, TVA, adresse)                          │
│  · Devis · Factures · Lignes · Paiements                      │
│  · Module e-invoicing (conformité, XML, statuts)              │
└────────────────────────────┬─────────────────────────────────┘
                             │ HTTPS (API interne)
                             ▼
┌──────────────────────────────────────────────────────────────┐
│  Connecteur PA (à développer)                                 │
│  · Auth OAuth / clé API partenaire                           │
│  · submitInvoice · getStatus · directoryLookup                │
│  · webhooks réception · e-reporting                           │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│  Plateforme Agréée partenaire                                 │
│  · Réseau B2B · Annuaire · DGFiP / PPF                        │
└────────────────────────────┬─────────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
        Client B2B                   Administration
```

## Rôles

| Composant | Rôle réglementaire |
|-----------|-------------------|
| Facturio | Préparation métier, UX, archivage PDF/XML, conformité données |
| PA partenaire | Transmission réseau, statuts lifecycle, e-reporting |
| Utilisateur | Responsable du contenu fiscal des factures |

## Flux émission (cible)

1. Utilisateur finalise une facture B2B dans Facturio.
2. Rapport de conformité = 100 % (SIRET émetteur, SIREN client, lignes, facture envoyée).
3. Génération Factur-X (PDF/A-3 + XML validé).
4. Envoi PA → statuts `PENDING_PA` → `SENT` → `DELIVERED`.
5. Archivage hash + horodatage en base.

## Flux réception (cible)

1. Webhook PA → facture fournisseur entrante.
2. Parsing Factur-X / UBL → brouillon achat ou écriture compta.
3. Notification utilisateur.

## Implémentation actuelle (mai 2026)

- Étapes 1–2 et export XML simplifié : **oui** (`server/src/e-invoicing/`).
- Étapes 3–5 réseau PA : **non**.

Code : voir [E_INVOICING.md](../development/E_INVOICING.md).
