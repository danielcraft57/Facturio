# Pièces de dépôt — immatriculation PA (DGFiP)

**PDF prêts à joindre** (brouillons — signature électronique niveau avancé 2 **à appliquer** avant dépôt).

Dépôt : [immatpdp](https://demarche.numerique.gouv.fr/commencer/immatpdp)

## Fichiers PDF (juin 2026)

| PDF | Pièce |
|-----|-------|
| `DanielCraft – Securite donnees personnelles RGPD – 202606.pdf` | Moyens sécurité RGPD art. 32 |
| `DanielCraft – Descriptif emission reception – 202606.pdf` | Processus envoi / réception |
| `DanielCraft – Descriptif authentification – 202606.pdf` | Dispositif auth utilisateurs |
| `DanielCraft – Descriptif extraction transmission – 202606.pdf` | Extraction / transmission admin |
| `DanielCraft – Protocole communication PPF – 202606.pdf` | Protocole sécurisé PPF (brouillon) |
| `DanielCraft – Declaration hebergement UE – 202606.pdf` | Engagement UE — **à signer** |
| `DanielCraft – Declaration annuaire central – 202606.pdf` | Annuaire + audit 1 an — **à signer** |

## Régénérer les PDF

Sources Markdown : sous-dossier `source/` (si présent) ou fichiers `*.md` à la racine.

```bash
python scripts/accreditation-pa/generate-pieces-depot-pdf.py
```

## Hors repo (à joindre manuellement)

- Kbis < 3 mois
- Attestation régularité fiscale < 3 mois
- Certificat **ISO/IEC 27001** valide (bloquant)
- SecNumCloud (si cloud tiers)
- CNI représentant légal

## Signature

Les PDF générés ne sont **pas** signés électroniquement. Le guide DGFiP exige des PDF signés (niveau avancé 2 minimum) avant dépôt.
