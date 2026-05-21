#!/usr/bin/env bash
# Télécharge frontend/dist depuis l’artefact GitHub Actions (workflow CI, push main).
# Nécessite un token : GITHUB_TOKEN ou fichier /var/lib/facturio/github-token (chmod 600).
#
# Usage : fetch-frontend-dist.sh <commit-sha>

set -euo pipefail

SHA="${1:?SHA du commit (ex. sortie de git rev-parse origin/main)}"
REPO="${GITHUB_REPO:-danielcraft57/Facturio}"
APP_DIR="${APP_DIR:-/opt/facturio}"
TOKEN_FILE="${GITHUB_TOKEN_FILE:-/var/lib/facturio/github-token}"
ARTIFACT_NAME="frontend-dist-${SHA}"
DEST="${APP_DIR}/frontend/dist"

if [ -z "${GITHUB_TOKEN:-}" ] && [ -f "$TOKEN_FILE" ]; then
  GITHUB_TOKEN="$(tr -d '\r\n' < "$TOKEN_FILE")"
fi
if [ -z "${GITHUB_TOKEN:-}" ]; then
  echo "[fetch-frontend-dist] GITHUB_TOKEN ou $TOKEN_FILE requis" >&2
  echo "  PAT GitHub (lecture repo + actions) : https://github.com/settings/tokens" >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "[fetch-frontend-dist] Node.js requis pour lire l’API GitHub" >&2
  exit 1
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "[fetch-frontend-dist] recherche artefact $ARTIFACT_NAME sur $REPO..."

ARTIFACT_ID=""
PAGE=1
while [ -z "$ARTIFACT_ID" ]; do
  RESP="$(curl -fsSL \
    -H "Accept: application/vnd.github+json" \
    -H "Authorization: Bearer ${GITHUB_TOKEN}" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "https://api.github.com/repos/${REPO}/actions/artifacts?per_page=100&page=${PAGE}")"

  ARTIFACT_ID="$(node -e "
    const j = JSON.parse(process.argv[1]);
    const a = (j.artifacts || []).find((x) => x.name === process.argv[2] && !x.expired);
    process.stdout.write(a ? String(a.id) : '');
  " "$RESP" "$ARTIFACT_NAME")"

  if [ -n "$ARTIFACT_ID" ]; then
    break
  fi

  COUNT="$(node -e "process.stdout.write(String((JSON.parse(process.argv[1]).artifacts||[]).length))" "$RESP")"
  if [ "$COUNT" -lt 100 ]; then
    break
  fi
  PAGE=$((PAGE + 1))
  if [ "$PAGE" -gt 20 ]; then
    break
  fi
done

if [ -z "$ARTIFACT_ID" ]; then
  echo "[fetch-frontend-dist] artefact introuvable pour $SHA" >&2
  echo "  Attendre la fin du workflow CI sur main (Actions → CI → job frontend)." >&2
  exit 1
fi

echo "[fetch-frontend-dist] téléchargement artefact #$ARTIFACT_ID..."
curl -fsSL \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer ${GITHUB_TOKEN}" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  -L "https://api.github.com/repos/${REPO}/actions/artifacts/${ARTIFACT_ID}/zip" \
  -o "$TMP/artifact.zip"

command -v unzip >/dev/null 2>&1 || { echo "unzip requis" >&2; exit 1; }
mkdir -p "$TMP/extract"
unzip -q "$TMP/artifact.zip" -d "$TMP/extract"

if [ ! -f "$TMP/extract/index.html" ]; then
  echo "[fetch-frontend-dist] index.html absent dans l’artefact" >&2
  exit 1
fi

rm -rf "${DEST}.old" "${DEST}.new"
mkdir -p "$(dirname "$DEST")"
mv "$TMP/extract" "${DEST}.new"
if [ -d "$DEST" ]; then
  mv "$DEST" "${DEST}.old"
fi
mv "${DEST}.new" "$DEST"
rm -rf "${DEST}.old"

sudo chown -R www-data:www-data "$DEST" 2>/dev/null || true
sudo chmod -R 755 "$DEST" 2>/dev/null || true

echo "[fetch-frontend-dist] OK → $DEST"
