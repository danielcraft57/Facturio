# Paiement en plusieurs fois (ECH) — fonctionnement

## Documents créés à l'acceptation du devis

| Cas | Documents |
|-----|-----------|
| Paiement en N fois **sans** acompte | 1 facture **ECH** avec N lignes d'échéancier |
| Paiement en N fois **avec** acompte 10 % | **ACO** (acompte) + **ECH** (mensualités sur le solde) |

Une seule facture ECH couvre tout le solde restant. Les mensualités sont des **lignes** dans l'échéancier, pas des factures séparées.

## Statuts des mensualités

| Statut | Signification |
|--------|----------------|
| **Programmée** (`SCHEDULED`) | Future mensualité : le client ne peut pas encore payer, pas de relance |
| **À régler** (`PENDING`) | Mensualité active : payable en ligne, visible en créances, relançable |
| **Réglée** (`PAID`) | Encaissée |
| **Annulée** (`CANCELLED`) | Plan annulé |

**Une seule mensualité est active (`PENDING`) à la fois.**

## Parcours client (avec acompte)

1. Acceptation du devis → facture **ACO** envoyée (10 % à payer).
2. Paiement de l'acompte → facture **ECH** préparée (lien public), toutes les mensualités restent **programmées**.
3. **Activation de la 1re mensualité** :
   - automatiquement à **J-3** avant la date prévue (cron 8 h), **ou**
   - manuellement : bouton **Envoyer la mensualité** sur la fiche facture, **ou**
   - à l'ouverture de la page de paiement / envoi email facture (activation silencieuse).
4. Le client reçoit un email avec **Échéance 1/3 — montant à régler** (pas le total de la facture).
5. Paiement Stripe = **montant de la mensualité active** uniquement.
6. Après paiement de la mensualité N, la N+1 reste **programmée** jusqu'à J-3 ou envoi manuel.

## Parcours sans acompte

- À l'acceptation : mensualité 1 en **À régler**, les autres **programmées**.
- Le client paie la 1re mensualité tout de suite sur la page d'acceptation.

## Calcul des montants (acompte + échéancier)

Exemple : devis 1 236 € TTC, acompte 123,60 €, 3 mensualités sur le solde 1 112,40 €.

- Part théorique sur le total : 1 236 / 3 = 412 €
- **1re mensualité** : 412 − 123,60 = **288,40 €** (réduite de l'acompte)
- **2e et 3e** : répartition du reste du solde

L'acompte n'est **pas** compté comme 1re mensualité.

## Actions prestataire

| Action | Effet |
|--------|--------|
| **Envoyer** (email facture ECH) | Active la prochaine mensualité éligible + email avec montant de l'échéance |
| **Envoyer la mensualité** | Force l'activation + email d'émission |
| **Relancer l'échéance** | Relance sur la mensualité **à régler** (J-3, retard, ou manuel) |

## Variables d'environnement (cron)

- `INSTALLMENT_AUTO_RELEASE_ENABLED=0` — désactive l'activation auto J-3
- `INSTALLMENT_REMINDERS_ENABLED=0` — désactive les relances
- `INSTALLMENT_REMINDER_DAYS_BEFORE=3` — fenêtre d'activation / rappel avant échéance

## Comptabilité

- **1 écriture VE** à l'émission de la facture ECH (montant total du solde).
- **1 écriture BQ** par encaissement de mensualité (512/411).

## FAQ

**Faut-il régler la 1re échéance pour « générer » les suivantes ?**

Non. Toutes les mensualités existent dès la création (programmées). En revanche, la suivante ne devient **payable et notifiable** qu'après :
- paiement de la précédente, **et**
- activation (cron J-3, envoi manuel, ou ouverture page paiement).

**Pourquoi le client voyait le montant total ?**

Si aucune mensualité n'était en statut **À régler**, Stripe prenait le solde entier. Corrigé : activation automatique à l'envoi / à l'ouverture du paiement.

**Factures déjà créées avant la mise à jour**

Recréer un devis de test ou utiliser **Envoyer la mensualité** sur l'ECH existante pour activer la 1re ligne.
