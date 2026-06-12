# Roadmap — Nouvelles fonctionnalités (juin 2026)

Plan produit consolidé à partir de l’état réel de **`main`** (juin 2026), des branches actives et des documents existants.

**Documents liés** : [ROADMAP_EXECUTION_2026](./ROADMAP_EXECUTION_2026.md) · [FACTURATION_ELECTRONIQUE_2026](./FACTURATION_ELECTRONIQUE_2026.md) · [MONETISATION](./MONETISATION.md) · [mobile/docs/ROADMAP.md](../../mobile/docs/ROADMAP.md) · [frontend/UX_WOW_ROADMAP.md](../../frontend/UX_WOW_ROADMAP.md)

**Légende** : ✅ livré sur `main` · 🔄 en cours / branche · ⬜ à faire

---

## 1. État des lieux (`main`, juin 2026)

### Socle opérationnel

| Domaine | Statut | Détail |
|---------|--------|--------|
| Facturation | ✅ | Devis, factures, PDF, email, liens publics, dossiers (inbox / envoyé / archivé) |
| Paiements | ✅ | Stripe, acomptes 10 % / 30 % (API), soldes, remboursements |
| Avoirs & crédits | ✅ | Imputation, crédit client, opérations diverses, fiche client finance |
| Catalogue | ✅ | Produits (livrables, technos, visuels), packs, onboarding seed |
| Comptabilité backend | ✅ | Écritures auto, balance, grand livre, FEC API |
| E-facture (fondations) | 🔄 | Score conformité, XML pré-Factur-X, champs SIREN — **pas de PA connectée** |
| Temps réel | ✅ | SSE invoices / quotes / payables / products |
| Marketing | ✅ | Landing, tarifs, simulateur réforme, packs catalogue |

### Nouveautés récentes sur `main`

| Fonctionnalité | Statut | Notes |
|----------------|--------|-------|
| **Créances** | ✅ | API `GET /receivables`, aging, relances, UI `ReceivablesPage` |
| **Dettes payables** | ✅ | Créanciers, dettes, paiements, envoi email, lien public, archivage |
| **Navigation finance** | ✅ | Sidebar par statuts, dossiers, bulk archive, GA4 |
| **Sync temps réel finance** | ✅ | Patch listes créances/dettes sans refresh complet |

### Hors `main` (branches)

| Branche | Contenu | Action recommandée |
|---------|---------|------------------|
| `feature/mobile-react-native` | App Expo : auth, dashboard, factures/devis/clients/produits, création documents, swipe, sidebar paysage, tests | **Merge Q3 2026** après parité créances/dettes |
| `feature/creances-dettes` | Checkpoint local — contenu largement intégré dans `main` | À fermer après vérification delta |

---

## 2. Priorités stratégiques

```
                    URGENCE RÉGLEMENTAIRE (sept. 2026)
                              │
    ┌─────────────────────────┼─────────────────────────┐
    │                         │                         │
 P0 E-facture            P1 Rétention              P2 Croissance
 PA + mentions           Vertical + mobile          Compta UI + UX
 réception/émission      Missions + récurrence      Monétisation + API
```

| Priorité | Objectif | Échéance cible |
|----------|----------|----------------|
| **P0** | Conformité réforme B2B (réception sept. 2026) | Q2–Q3 2026 |
| **P1** | Différenciation vertical prestations + mobile | Q3 2026 |
| **P2** | Compta visible, UX premium, revenus récurrents | Q3–Q4 2026 |
| **P3** | IA, OSINT, connecteurs tiers | 2027+ |

---

## 3. Roadmap par thème

### 3.1 Conformité & e-facture (P0) — bloquant sept. 2026

> Jalon : **réception** pour toutes les entreprises TVA · **émission** ETI/GE dès sept. 2026.

| ID | Fonctionnalité | Statut | Sprint cible |
|----|----------------|--------|--------------|
| EF-1 | Mentions obligatoires réforme (modèle + PDF) | 🔄 | S1 — juin 2026 |
| EF-2 | Champs client : adresse livraison, catégorie opération | 🔄 | S1 |
| EF-3 | Factur-X PDF/A-3 complet (validation schéma) | ⬜ | S1–S2 |
| EF-4 | Contrat + client HTTP PA partenaire (sandbox) | 🔄 | S1 |
| EF-5 | Webhooks / polling statuts transmission | ⬜ | S2 |
| EF-6 | UI Paramètres : connexion PA, test, envoi e-facture | ⬜ | S2 |
| EF-7 | Journal transmissions (audit) | ⬜ | S2 |
| EF-8 | Réception factures fournisseurs (webhook PA) | ⬜ | S4 — Q4 2026 |
| EF-9 | E-reporting (B2C, international, paiements) | ⬜ | S4 — Q1 2027 |

**Livrable utilisateur** : bouton « Envoyer en facture électronique » avec suivi de statut (émis, reçu, rejeté).

---

### 3.2 Finance & trésorerie (P1) — extension du socle livré

Le module créances/dettes pose les bases ; la suite vise la **vision trésorerie** unifiée.

| ID | Fonctionnalité | Statut | Détail |
|----|----------------|--------|--------|
| FIN-1 | Créances : relances automatiques planifiées | ⬜ | Cron + templates email, seuils aging |
| FIN-2 | Créances : export / impression état client | ⬜ | PDF récap impayés par client |
| FIN-3 | Dettes : échéancier & alertes avant échéance | ⬜ | Notifications in-app + email |
| FIN-4 | Dettes : rapprochement paiement ↔ compta 401 | ⬜ | Lien écritures achats |
| FIN-5 | Tableau de bord trésorerie | ⬜ | Encaissements prévus vs décaissements, courbe 90 j |
| FIN-6 | Lien créance ↔ facture ↔ mission | ⬜ | Drill-down depuis KPI dashboard |
| FIN-7 | Mobile : écrans créances & dettes | ⬜ | Après merge `feature/mobile-react-native` |

---

### 3.3 Vertical prestations services (P1) — différenciation produit

| ID | Fonctionnalité | Statut | Détail |
|----|----------------|--------|--------|
| MET-1 | Vue **Mission** (devis → factures → paiements) | ⬜ | Projet client avec timeline |
| MET-2 | UI acompte 30/70 depuis fiche devis | ⬜ | API `accept-pay` DEPOSIT déjà là |
| MET-3 | Modèles de devis par type (site, API, maintenance, IA) | ⬜ | Templates lignes + clauses |
| MET-4 | Mentions légales PI + prestations intellectuelles | ⬜ | Templates éditables org |
| MET-5 | Time tracking minimal → lignes facture TJM | ⬜ | Saisie rapide, export mission |
| MET-6 | Facturation récurrente auto (abonnements → factures) | ⬜ | UI abonnements existe, génération manquante |
| MET-7 | Unités métier : heure, forfait, mois (export Factur-X) | ⬜ | Mapping champs e-facture |

---

### 3.4 Comptabilité frontend (P2) — différenciation vs outils « compta light »

| ID | Fonctionnalité | Statut |
|----|----------------|--------|
| CPT-1 | UI Balance / Grand livre | ⬜ |
| CPT-2 | Plan comptable consultable | ⬜ |
| CPT-3 | Export FEC depuis l’interface | ⬜ |
| CPT-4 | Verrouillage de périodes comptables | ⬜ |
| CPT-5 | Dashboard échéances fiscales (TVA, URSSAF) | ⬜ |

---

### 3.5 Mobile & multi-canal (P1–P2)

| ID | Fonctionnalité | Statut | Branche |
|----|----------------|--------|---------|
| MOB-1 | MVP lecture (dashboard, listes, détail) | ✅ | `feature/mobile-react-native` |
| MOB-2 | Création facture / devis (formulaires web-like) | ✅ | idem |
| MOB-3 | Swipe actions (archiver, envoyer, supprimer) | ✅ | idem |
| MOB-4 | Sidebar paysage + responsive | ✅ | idem |
| MOB-5 | Merge dans `main` + CI typecheck/tests | ⬜ | Q3 2026 |
| MOB-6 | Push notifications (paiement, retard) | ⬜ | Backend token déjà prévu |
| MOB-7 | Créances / dettes mobile | ⬜ | Post-merge |
| MOB-8 | Build EAS (TestFlight / Play internal) | ⬜ | v1.0 mobile |

---

### 3.6 UX web premium (P2)

Voir [frontend/UX_WOW_ROADMAP.md](../../frontend/UX_WOW_ROADMAP.md).

| Phase | Contenu | Effort |
|-------|---------|--------|
| **A** | Skeletons, empty states, transitions pages, toasts unifiés | 1 sprint |
| **B** | KPI animés, widget activité temps réel enrichi | 1 sprint |
| **C** | Autosave brouillon, filtres persistants, undo bulk | 2 sprints |
| **D** | Tour produit, motion tokens, `prefers-reduced-motion` | 1 sprint |

---

### 3.7 Monétisation & croissance (P2)

| ID | Fonctionnalité | Statut |
|----|----------------|--------|
| MON-1 | Paliers Stripe Free / Pro / Pro+e-facture / Agence | ⬜ |
| MON-2 | Quotas techniques plan Free (factures/mois) | ⬜ |
| MON-3 | Page tarifs + CTA depuis danielcraft.fr | 🔄 |
| MON-4 | Programme parrainage | ⬜ |
| MON-5 | API publique documentée + webhooks sortants | ⬜ |
| MON-6 | Import CSV clients | ⬜ |

---

### 3.8 Intelligence & intégrations (P3 — 2027+)

| Thème | Exemples | Référence |
|-------|----------|-----------|
| OSINT / risque client | Scoring impayés, veille SIREN | [ROADMAP.md](./ROADMAP.md) § OSINT |
| IA assistée | Brouillon devis depuis catalogue, relances rédigées | S5-6 execution 2026 |
| Connecteurs | Sage, Cegid, HubSpot, SendGrid | v1.4 roadmap historique |

---

## 4. Planning trimestriel recommandé

### Q2 2026 (juin–août) — **Conformité**

| Semaines | Focus | Livrables |
|----------|-------|-----------|
| S1–S2 | E-facture P0 | Mentions PDF, Factur-X, client PA sandbox |
| S3–S4 | E-facture UI | Paramètres PA, envoi, journal transmissions |
| Continu | Finance | Relances créances manuelles → auto (FIN-1) |

### Q3 2026 (sept.–nov.) — **Rétention & mobile**

| Focus | Livrables |
|-------|-----------|
| Vertical métier | Missions (MET-1), UI acomptes (MET-2), récurrence (MET-6) |
| Mobile | Merge branche, push notifs, parité créances |
| UX | Phase A + B UX Wow |
| **Jalon** | Réception e-facture opérationnelle avant **1er sept. 2026** |

### Q4 2026 (déc.) — **Compta & réception**

| Focus | Livrables |
|-------|-----------|
| Compta UI | Balance, grand livre, FEC frontend |
| E-facture S4 | Réception fournisseurs, boîte entrante |
| Monétisation | Paliers Stripe actifs, quotas Free |

### Q1 2027 — **Émission PME & e-reporting**

| Focus | Livrables |
|-------|-----------|
| E-facture | Émission PME, e-reporting |
| Intelligence | Devis assisté (brouillon IA) en beta |

---

## 5. Matrice effort / impact

| Fonctionnalité | Impact utilisateur | Effort | Priorité |
|----------------|-------------------|--------|----------|
| PA + envoi e-facture | ★★★★★ | Élevé | P0 |
| Factur-X PDF/A-3 | ★★★★☆ | Élevé | P0 |
| Missions / acomptes UI | ★★★★☆ | Moyen | P1 |
| Facturation récurrente | ★★★★☆ | Moyen | P1 |
| Merge mobile | ★★★★☆ | Moyen | P1 |
| Relances créances auto | ★★★☆☆ | Faible | P1 |
| Compta UI | ★★★☆☆ | Moyen | P2 |
| UX Wow phase A | ★★★☆☆ | Faible | P2 |
| API publique | ★★☆☆☆ | Moyen | P2 |
| OSINT / ML | ★★☆☆☆ | Très élevé | P3 |

---

## 6. Métriques de succès (6 mois)

| Métrique | Cible juin → déc. 2026 |
|----------|-------------------------|
| Inscriptions Free / mois | 20+ |
| Conversion Free → Pro | > 8 % |
| Réservations Pro + e-facture | 5+ avant sept. 2026 |
| Temps 1er devis (onboarding) | < 15 min |
| Taux envoi e-facture (users Pro) | > 50 % des factures B2B |
| Sessions mobile / semaine (post-merge) | Mesurer baseline M+1 |

---

## 7. Prochaines actions immédiates

1. **Finaliser Sprint 1 e-facture** — mentions PDF + sandbox PA (bloquant calendrier réglementaire).
2. **Planifier merge mobile** — revue parité API créances/dettes, puis PR `feature/mobile-react-native` → `main`.
3. **FIN-1 relances créances** — capitaliser sur `ReceivablesReminderService` déjà amorcé côté serveur.
4. **MET-2 UI acomptes** — quick win : boutons 30/70 sur fiche devis (API existante).
5. **Mettre à jour** [ROADMAP_EXECUTION_2026](./ROADMAP_EXECUTION_2026.md) après chaque sprint (statuts S1-x).

---

## 8. Notes sur les « erreurs » console web mobile

Les messages `content.js`, `Could not establish connection`, `[Violation] handler took Xms` en dev Expo web proviennent en général d’**extensions navigateur** ou du **mode dev Metro**, pas de bugs applicatifs. Voir commits `bc4b43b` (stub notifications, `requestIdleCallback`) sur `feature/mobile-react-native`.

---

*Dernière mise à jour : juin 2026 — basé sur `main` @ `d38481c` et branche `feature/mobile-react-native` @ `bc4b43b`.*
