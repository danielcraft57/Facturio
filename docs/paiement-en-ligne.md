# Paiement en ligne - pistes d'intégration

Actuellement Facturio enregistre les paiements manuellement (montant, date, moyen). Pour accepter les paiements en ligne par carte ou autre, voici des solutions adaptées et comment les brancher sur l'existant.

## Solutions recommandées

### 1. Stripe

- **Atouts** : très répandu, excellente doc, SDK Node.js, paiement unique et récurrent, forte conversion.
- **Intégration** : créer une "Payment Intent" côté backend pour une facture, renvoyer `clientSecret` au front ; sur la page facture publique (lien envoyé au client), afficher Stripe Elements ou un lien de paiement. Webhook pour confirmer le paiement et appeler `invoices.addPayment(id, amount, ...)`.
- **Tarifs** : ~1,5 % + 0,25 € par transaction (EU).
- **Doc** : https://stripe.com/docs/payments/accept-a-payment

### 2. Mollie

- **Atouts** : interface en français, SEPA, virement, cartes, PayPal ; API simple.
- **Intégration** : créer un paiement via l’API Mollie avec `metadata.invoiceId` et `redirectUrl` vers la page facture publique. Le client paie sur Mollie ; en webhook "paid", récupérer `metadata.invoiceId` et enregistrer le paiement via `invoices.addPayment`.
- **Tarifs** : variable selon moyen (carte ~0,29 € + pourcentage).
- **Doc** : https://docs.mollie.com/

### 3. PayPal (Checkout / Braintree)

- **Atouts** : reconnu par les particuliers, possibilité de payer sans carte.
- **Intégration** : créer une commande PayPal avec le montant de la facture et un lien de retour ; après capture, webhook ou retour serveur pour appeler `invoices.addPayment`.
- **Doc** : https://developer.paypal.com/docs/checkout/

### 4. Lyra / Payzen (ex-Sogenactif)

- **Atouts** : acteur français, conforme aux exigences des banques FR.
- **Intégration** : formulaire de paiement sécurisé ou API ; notification serveur pour valider le paiement puis `invoices.addPayment`.
- **Doc** : https://docs.lyra.com/

## Branchement dans Facturio

- **Modèle existant** : la table `Payment` est déjà liée à `Invoice` ; `invoices.addPayment(invoiceId, amount, date, method, notes)` met à jour le solde et le statut (PAID si solde à 0).
- **À ajouter** :
  1. **Backend** : un module "payments" (ou "payment-gateway") qui :
     - expose une route du type `POST /invoices/:id/create-payment-link` (ou dédiée Stripe/Mollie) pour créer une session de paiement et renvoyer une URL ou un `clientSecret`.
     - expose un endpoint webhook (ex. `POST /webhooks/stripe`) pour recevoir les événements "payment_intent.succeeded" / "paid" et appeler `InvoicesService.addPayment(...)` avec `method: 'STRIPE'` ou `'MOLLIE'`, etc.
  2. **Frontend** : sur la page publique de la facture (`/public/factures/:token`), afficher un bouton "Payer en ligne" qui redirige vers la page de paiement ou ouvre le formulaire Stripe Elements / Mollie.
  3. **Sécurité** : vérifier en webhook que le montant et la facture correspondent bien (id + solde restant), et ne pas faire confiance au seul paramètre envoyé par le client.

En résumé : garder l’existant (paiements manuels + `addPayment`), et ajouter une couche "création de session de paiement" + "webhook → addPayment" pour chaque prestataire choisi (Stripe, Mollie, etc.).
