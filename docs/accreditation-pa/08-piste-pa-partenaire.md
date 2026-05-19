# Piste recommandée — PA partenaire (solution compatible)

## Pourquoi cette piste en priorité

| Critère | PA partenaire | PA propre |
|---------|---------------|-----------|
| Délai mise sur le marché | 6–12 mois | 12–24 mois |
| ISO 27001 | Portée par le partenaire (souvent) | Obligatoire chez DanielCraft |
| Coût initial | API + commission | Certification + audits + infra |
| Risque réglementaire | Partagé | Entièrement interne |

**Recommandation** : commercialiser Facturio en **solution compatible** dès Q3 2026, tout en maintenant le dossier PA propre pour une décision ultérieure.

## Critères de sélection PA

1. **API REST** documentée (sandbox + production).
2. Formats : **Factur-X** minimum, UBL/CII souhaitable.
3. **Marque blanche** ou co-branding acceptable.
4. Tarification compatible avec paliers Facturio (9–29 €/mois utilisateur).
5. SLA et support technique réactif.
6. DPA / sous-traitance RGPD claire.
7. Webhooks réception + statuts lifecycle.

## Short-list (à compléter)

| PA | API | Factur-X | Marque blanche | Contact | Notes |
|----|-----|----------|----------------|---------|-------|
| _PA A_ | ☐ | ☐ | ☐ | | |
| _PA B_ | ☐ | ☐ | ☐ | | |
| _PA C_ | ☐ | ☐ | ☐ | | |

Source liste officielle : [impots.gouv.fr — PA immatriculées](https://www.impots.gouv.fr/liste-des-plateformes-de-dematerialisation-partenaires-pdp-immatriculees-sous-reserve)

## Modèle économique

- Facturio facture le **logiciel** (Pro + e-facture).
- La PA facture le **canal réglementaire** ou forfait bundle.
- Négocier **commission** (10–30 % selon volume) ou **marge revendeur**.

Voir [MONETISATION.md](../planning/MONETISATION.md).

## Intégration technique (Facturio)

1. Module `EInvoicingPaConnector` (interface + implémentation par partenaire).
2. Paramètres organisation : clés API, environnement test/prod.
3. Bouton « Envoyer via PA » sur facture conforme.
4. Webhook entrant → factures fournisseurs.
5. Logs et statuts `eInvoiceStatus` alignés sur le cycle PA.

## Jalons

| Date | Livrable |
|------|----------|
| Q2 2026 | Contrat signé + accès sandbox |
| Q3 2026 | Envoi facture test ETI en sandbox |
| **Sept. 2026** | Production pour clients Pro + e-facture |
| Q1 2027 | Réception fournisseurs |

## Lien avec le dossier PA propre

Le présent dossier d’**accréditation PA** reste utile si DanielCraft décide plus tard de s’immatriculer directement. Les preuves techniques (module e-invoicing, sécurité) sont communes aux deux pistes.
