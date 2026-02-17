# Scripts serveur

## manage-user.js

Script de gestion des utilisateurs en production (ajout, suppression, liste). A deployer avec l'application ; a executer sur le serveur dans `/opt/facturio/server` avec le `.env` et `DATABASE_URL` configurés.

- **add** : cree une organisation et un utilisateur (status ACTIVE, role ADMIN par defaut).
- **remove** : supprime l'utilisateur par email ; si l'organisation n'a plus d'utilisateur, elle est supprimee.
- **list** : affiche la liste des utilisateurs.

Voir `docs/deployment/DEPLOIEMENT_PRODUCTION.md` (section "Gestion des utilisateurs en production") pour les exemples de commandes.
