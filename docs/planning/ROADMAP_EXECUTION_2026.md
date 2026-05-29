# Roadmap d'exécution 2026 — Facturio

Plan opérationnel (branche `feat/roadmap-execution-2026`) dérivé de [STRATEGIE_ACQUISITION_INSCRIPTIONS_2026.md](./STRATEGIE_ACQUISITION_INSCRIPTIONS_2026.md).

**Légende** : ✅ fait · 🔄 en cours · ⬜ à faire

---

## Sprint 0 — Cadrage (cette branche)

| ID | Tâche | Priorité | Statut |
|----|-------|----------|--------|
| S0-1 | Document roadmap exécution (ce fichier) | P0 | ✅ |
| S0-2 | Packs catalogue : définition JSON + API install | P1 | ✅ |
| S0-3 | Simulateur échéances réforme (API + page publique) | P1 | ✅ |
| S0-4 | Onboarding : packs métier optionnels (chips) | P2 | ✅ |

---

## Sprint 1 — Conformité 2026 (Q2 2026)

| ID | Tâche | Priorité | Statut |
|----|-------|----------|--------|
| S1-1 | Mentions obligatoires réforme sur modèle facture + PDF | P0 | 🔄 |
| S1-2 | Champs client : adresse livraison, catégorie opération | P0 | 🔄 |
| S1-3 | Factur-X PDF/A-3 complet (au-delà XML seul) | P0 | ⬜ |
| S1-4 | Short-list + contrat API PA partenaire | P0 | 🔄 |
| S1-5 | Client HTTP PA (auth, submit, idempotence) | P0 | 🔄 |
| S1-6 | Webhooks / polling statuts PA | P0 | ⬜ |
| S1-7 | UI Paramètres : connexion PA, test, envoi e-facture | P0 | ⬜ |
| S1-8 | Journal transmissions (audit) | P1 | ⬜ |

---

## Sprint 2 — Vertical métier (Q2–Q3 2026)

| ID | Tâche | Priorité | Statut |
|----|-------|----------|--------|
| S2-1 | Vue **Mission** : devis → factures → paiements par projet | P1 | ⬜ |
| S2-2 | UI acompte 30/70 depuis fiche devis (existe API) | P1 | ⬜ |
| S2-3 | Modèles de devis par type (site, API, maintenance) | P1 | ⬜ |
| S2-4 | Mentions légales prestations + clause PI (templates) | P1 | ⬜ |
| S2-5 | Time tracking minimal → lignes facture TJM | P2 | ⬜ |
| S2-6 | Facturation récurrente auto (abonnements → factures) | P1 | ⬜ |

---

## Sprint 3 — Compta & exports (Q3 2026)

| ID | Tâche | Priorité | Statut |
|----|-------|----------|--------|
| S3-1 | UI Balance / Grand livre / plan comptable | P1 | ⬜ |
| S3-2 | Export FEC depuis le frontend | P1 | ⬜ |
| S3-3 | Verrouillage de périodes comptables | P2 | ⬜ |
| S3-4 | Tableau de bord échéances fiscales (URSSAF, TVA) | P2 | ⬜ |

---

## Sprint 4 — Réception & e-reporting (Q4 2026 – Q1 2027)

| ID | Tâche | Priorité | Statut |
|----|-------|----------|--------|
| S4-1 | Réception factures fournisseurs (webhook PA) | P0 | ⬜ |
| S4-2 | Boîte de réception fournisseurs (UI) | P1 | ⬜ |
| S4-3 | E-reporting B2C / international / paiements | P0 | ⬜ |
| S4-4 | Certification ISCA / attestation éditeur | P1 | ⬜ |

---

## Sprint 5 — Croissance produit (continu)

| ID | Tâche | Priorité | Statut |
|----|-------|----------|--------|
| S5-1 | Landing + SEO (réforme, vertical dev) | P1 | ✅ |
| S5-2 | PWA légère + notifications relances | P2 | ⬜ |
| S5-3 | API publique documentée + webhooks sortants | P2 | ⬜ |
| S5-4 | Import CSV clients | P2 | ⬜ |
| S5-5 | Programme parrainage | P3 | ⬜ |
| S5-6 | Devis assisté (IA) — brouillon lignes catalogue | P3 | ⬜ |

---

## Déjà livré (ne pas replanifier)

- Devis, factures, PDF, email, liens publics, Stripe
- Acomptes 10 % / 30 % (API `accept-pay` DEPOSIT)
- Avoirs, écritures compta auto, FEC API
- Module e-invoicing : score conformité, XML Factur-X simplifié
- Onboarding stack technique + clone catalogue
- Prospection ProspectLab, abonnements (UI)
- Marketing : accueil, prestations, fonctionnalités, tarifs, stratégie doc

---

## Ordre de développement recommandé

1. **Sprint 0** (cette branche) — packs catalogue + simulateur réforme  
2. **Sprint 1** — bloquant inscription sept. 2026 (PA + mentions)  
3. **Sprint 2** — rétention vertical (missions, récurrence, UI acomptes)  
4. **Sprint 3** — compta visible (différenciation vs Abby seul)  
5. **Sprint 4** — réception + e-reporting  

---

## Métriques de succès

| Métrique | Cible 6 mois |
|----------|----------------|
| Inscriptions Free / mois | 20+ |
| Conversion Free → Pro | > 8 % |
| Réservations Pro + e-facture | 5+ avant sept. 2026 |
| Temps 1er devis (onboarding) | < 15 min |
