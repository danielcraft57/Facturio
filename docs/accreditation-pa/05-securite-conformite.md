# Sécurité et conformité — dossier PA / RGPD

## Principes

- **Minimisation** des données collectées.
- **Isolation multi-tenant** par `organizationId`.
- **Chiffrement** des secrets sensibles en base (clés Stripe prestataire, tokens ProspectLab).
- **Hébergement UE** visé pour production Facturio.

## Mesures techniques implémentées

| Mesure | Détail |
|--------|--------|
| Authentification | JWT en cookie HTTP-only, bcrypt (coût 12) |
| Validation entrées | `class-validator` sur DTOs |
| En-têtes HTTP | Politique de sécurité (CSP, HSTS selon déploiement) |
| Rate limiting | Auth et routes publiques |
| Secrets | `SecretsCryptoService` AES-256-GCM si `SECRETS_ENCRYPTION_KEY` |
| RGPD | Export JSON, suppression compte, consentements inscription |

## RGPD — rôles

| Traitement | Responsable | Sous-traitant |
|------------|-------------|--------------|
| Compte Facturio | DanielCraft | — |
| Données clients des utilisateurs | **L’utilisateur** (prestataire) | Facturio (hébergement technique) |
| Paiement abonnement | DanielCraft | Stripe (plateforme) |
| Paiement factures clients | Utilisateur | Stripe (compte prestataire) |

## Sous-traitants à documenter (DPA)

- [ ] Hébergeur application
- [ ] Stripe (abonnement + Connect prestataire)
- [ ] Fournisseur email (SMTP)
- [ ] ProspectLab (prospection, plan Pro)
- [ ] **Plateforme Agréée** (dès contractualisation)

## Exigences PA (immatriculation)

- Documentation RGPD à jour (politique confidentialité, registre des traitements — à formaliser si dépôt PA).
- **ISO/IEC 27001** valide (certificat &lt; 3 ans) — voir [06-plan-certification-iso27001.md](./06-plan-certification-iso27001.md).
- Hébergement : pas de transfert hors UE sans garanties ; **SecNumCloud** si hébergeur cloud tiers.
- Rapport d’audit de conformité sous 12 mois après immatriculation.
- Journalisation des accès et des flux de facturation électronique (à renforcer avec connecteur PA).

## Continuité et sauvegarde

| Élément | Cible |
|---------|--------|
| Sauvegardes BDD | Quotidiennes, rétention 30 j (à configurer prod) |
| RTO / RPO | À définir contractuellement (SLA PA partenaire ou interne) |
| Plan de reprise | Document à rédiger avant production PA |

## Contact sécurité / incidents

**contact@danielcraft.fr** — délai de notification utilisateurs et CNIL selon gravité (72 h max si risque élevé).
