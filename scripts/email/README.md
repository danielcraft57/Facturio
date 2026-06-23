# Assets email PrestaFacture

Images WebP servies par le frontend : `frontend/public/images/email/`.

## Régénération

```bash
python scripts/email/generate_email_assets.py
```

Prérequis : Pillow (`pip install pillow`).

## Fichiers

| Fichier | Usage |
|---------|--------|
| `prestafacture-icon-48.webp` / `96.webp` | Logo dans l'en-tête des emails |
| `header-default.webp` | Factures, auth, abonnement |
| `header-quote.webp` | Devis |
| `header-success.webp` | Paiement reçu, facture payée |
| `header-warning.webp` | Relances |
| `header-danger.webp` | Remboursements |

Les URLs des images utilisent `FRONTEND_URL` ou `PUBLIC_APP_URL` (défaut en dev : `http://localhost:5173`).

## Prévisualisation locale (sans déploiement)

1. Démarrer le frontend (sert les WebP) :

```bash
npm run dev --prefix frontend
```

2. Générer les pages HTML de démo :

```bash
npm run email:preview
```

3. Ouvrir `server/tmp/email-previews/index.html` dans le navigateur.

Pour tester l’envoi SMTP local (Mailpit sur le port 1025) : `node server/scripts/test-email.js vous@example.com` avec le backend configuré dans `server/.env`.

### Test SMTP avec template complet

```bash
npm run build --prefix server
node server/scripts/test-email-branded.js votre@email.com
```

Envoie un devis test avec images **CID** (visible dans Gmail depuis localhost).
