# Modules natifs Expo — recommandations PrestaFacture Mobile

Packages à envisager par phase, avec lien vers le cas d’usage mobile / tablette.

## Déjà installés (v0.1)

| Package | Usage |
|---------|--------|
| `expo-secure-store` | JWT, empreinte appareil |
| `expo-router` | Navigation fichier |
| `expo-application` | Version app, device id fallback |
| `expo-linking` | Deep links (`verify-device`, facture publique) |
| `react-native-svg` | Graphiques dashboard |
| `@react-native-async-storage/async-storage` | Fallback web dev |

---

## Phase 1 — MVP terrain

```bash
npx expo install expo-file-system expo-sharing expo-intent-launcher
npx expo install expo-document-picker expo-image-picker
npx expo install @react-native-community/netinfo
```

| Package | Intérêt PrestaFacture |
|---------|------------------|
| **expo-file-system** | Télécharger PDF facture/devis en cache |
| **expo-sharing** | Partager PDF vers email / Drive |
| **expo-document-picker** | Joindre pièce à une facture |
| **expo-image-picker** | Photo justificatif / logo client |
| **@react-native-community/netinfo** | Bannière hors-ligne, file d’attente sync |

```bash
npx expo install expo-notifications expo-device
```

| Package | Intérêt |
|---------|---------|
| **expo-notifications** | Push « paiement reçu », « facture en retard » (backend à brancher) |
| **expo-device** | Métadonnées pour `deviceFingerprint` enrichi |

---

## Phase 2 — UX pro tablette

```bash
npx expo install expo-haptics expo-blur
npx expo install react-native-reanimated  # déjà présent
```

| Package | Intérêt |
|---------|---------|
| **expo-haptics** | Retour tactile validation paiement |
| **expo-blur** | Modales, bottom sheets iOS-like |
| **expo-screen-orientation** | Verrouiller paysage sur tablette dashboard |

```bash
npx expo install expo-print
```

| **expo-print** | Aperçu impression facture sur tablette |

---

## Phase 3 — Biométrie & sécurité

```bash
npx expo install expo-local-authentication
```

| **expo-local-authentication** | Déverrouiller l’app (Face ID / empreinte) avant d’afficher CA et IBAN |

---

## LLM sur Android (et iOS) — architecture recommandée

### ⚠️ Ne pas embarquer le modèle dans l’apk en v1

- Taille (Go), RAM, batterie, mises à jour modèle impossibles.
- Clés API OpenAI/Gemini dans l’app = **fuite garantie** (reverse engineering).

### Option A — Assistant cloud (recommandé)

```
[App mobile] --HTTPS JWT--> [PrestaFacture API] --API--> [OpenAI / Anthropic / Mistral]
```

- Nouveau module Nest : `POST /assistant/chat` avec garde-fous (quota org, pas de données hors org).
- Mobile : simple chat UI + streaming SSE depuis le backend.
- Packages mobile : **aucun LLM local**, seulement `fetch` / SSE.

### Option B — LLM **on-device** Android (expérimental)

Pour une démo « mode avion » ou confidentialité extrême :

| Approche | Package / techno | Commentaire |
|----------|------------------|-------------|
| **MLC / llama.cpp** | Module natif custom (dev client EAS) | Lourd à maintenir ; pas de package Expo officiel stable |
| **Google AI Edge / Gemini Nano** | API Android 14+ via config plugin Expo | Disponibilité **limitée** aux appareils compatibles ; API encore jeune |
| **react-native-executorch** (Meta) | Experimental | PyTorch Edge ; build natif complexe |
| **Ollama sur LAN** | `expo` + URL locale | Tablette en WiFi → `http://192.168.x.x:11434` ; pas store-friendly |

**Expo pertinent pour l’option B :**

- `expo-dev-client` + module natif custom si vous investissez dans ExecuTorch / llama.cpp.
- `expo-speech` + **expo-av** pour dictée vocale → envoyer texte au backend (souvent mieux qu’un SLM local pour la facturation).

```bash
npx expo install expo-speech expo-av
```

| **expo-speech** | Synthèse vocale réponses assistant |
| **expo-av** | Enregistrement note vocale → transcription côté serveur (Whisper API) |

### Option C — Hybride « smart fields »

Sans chatbot complet :

- Backend : `POST /invoices/suggest-lines` (texte libre → lignes facture JSON).
- Mobile : champ « Décrivez la prestation » + bouton magic wand.

---

## Matrice décision LLM

| Besoin | Solution |
|--------|----------|
| « Rédige ma facture » | Cloud via API PrestaFacture |
| Confidentialité maximale | LAN Ollama ou modèle on-device (coût dev élevé) |
| Saisie mains libres | `expo-av` + Whisper serveur |
| Résumé dashboard | Prompt serveur sur `GET /dashboard/stats` (pas de modèle mobile) |

---

## Installation type (phase 1)

```bash
cd mobile
npx expo install expo-file-system expo-sharing @react-native-community/netinfo expo-notifications
```

Puis documenter chaque permission Android dans `app.json` (`plugins`).

---

## Références

- [Expo SDK 56 — packages](https://docs.expo.dev/versions/latest/)
- [SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [Notifications](https://docs.expo.dev/push-notifications/overview/)
- Assistant IA côté serveur : à concevoir dans `server/src/assistant/` (non existant aujourd’hui)
