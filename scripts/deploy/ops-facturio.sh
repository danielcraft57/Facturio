#!/usr/bin/env bash
# Raccourcis exploitation Facturio (plans SaaS, purge factures).
# Usage : ./scripts/deploy/ops-facturio.sh <commande> <email|org:id> [options…]
#
# Exemples (sur node10, après chmod +x) :
#   /opt/facturio/scripts/deploy/ops-facturio.sh plan-show daniel@danielcraft.fr
#   /opt/facturio/scripts/deploy/ops-facturio.sh plan-pro daniel@danielcraft.fr
#   /opt/facturio/scripts/deploy/ops-facturio.sh plan-agency daniel@danielcraft.fr --months=12
#   /opt/facturio/scripts/deploy/ops-facturio.sh invoices-purge daniel@danielcraft.fr --stripe --confirm
#
# Doc : docs/deployment/SCRIPTS_EXPLOITATION_PRODUCTION.md

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SERVER_DIR="${FACTURIO_SERVER_DIR:-$REPO_ROOT/server}"

if [[ ! -d "$SERVER_DIR" ]]; then
  echo "Répertoire serveur introuvable : $SERVER_DIR" >&2
  exit 1
fi

usage() {
  cat <<'EOF'
Usage: ops-facturio.sh <commande> <email|org:id> [options…]

Plans SaaS (set-organization-plan.js) :
  plan-show TARGET
  plan-free TARGET              → free + --clear-subscription
  plan-pro TARGET [opts]        → pro (--months, --expires, --dry-run)
  plan-efacture TARGET [opts]   → pro-efacture
  plan-agency TARGET [opts]     → agency (alias agence)
  plan-list [--plan=FREE|PRO|AGENCY|…]

Factures / quota Free (purge-organization-invoices.js) :
  invoices-usage TARGET
  invoices-list TARGET [filtres]
  invoices-purge TARGET [filtres] --confirm

Filtres factures : --all | --this-month | --stripe | --paid | --status=SENT,PAID | --ids=id1,id2
  invoices-purge sans --confirm = dry-run

Variables :
  FACTURIO_SERVER_DIR  (défaut : <repo>/server)

Doc : docs/deployment/SCRIPTS_EXPLOITATION_PRODUCTION.md
EOF
}

run_node() {
  (cd "$SERVER_DIR" && node "$@")
}

cmd="${1:-}"
shift || true

case "$cmd" in
  plan-show)
    [[ $# -ge 1 ]] || { usage; exit 1; }
    run_node scripts/set-organization-plan.js show "$1"
    ;;
  plan-free)
    [[ $# -ge 1 ]] || { usage; exit 1; }
    target=$1
    shift
    run_node scripts/set-organization-plan.js set "$target" free --clear-subscription "$@"
    ;;
  plan-pro)
    [[ $# -ge 1 ]] || { usage; exit 1; }
    target=$1
    shift
    run_node scripts/set-organization-plan.js set "$target" pro "$@"
    ;;
  plan-efacture|plan-pro-efacture)
    [[ $# -ge 1 ]] || { usage; exit 1; }
    target=$1
    shift
    run_node scripts/set-organization-plan.js set "$target" pro-efacture "$@"
    ;;
  plan-agency|plan-agence)
    [[ $# -ge 1 ]] || { usage; exit 1; }
    target=$1
    shift
    run_node scripts/set-organization-plan.js set "$target" agency "$@"
    ;;
  plan-list)
    run_node scripts/set-organization-plan.js list "$@"
    ;;
  invoices-usage)
    [[ $# -ge 1 ]] || { usage; exit 1; }
    run_node scripts/purge-organization-invoices.js usage "$1"
    ;;
  invoices-list)
    [[ $# -ge 1 ]] || { usage; exit 1; }
    target=$1
    shift
    run_node scripts/purge-organization-invoices.js list "$target" "$@"
    ;;
  invoices-purge)
    [[ $# -ge 1 ]] || { usage; exit 1; }
    target=$1
    shift
    if [[ " $* " != *" --confirm "* ]]; then
      echo "⚠️  Mode simulation (ajoutez --confirm pour supprimer)." >&2
    fi
    run_node scripts/purge-organization-invoices.js purge "$target" "$@"
    ;;
  -h|--help|help|"")
    usage
    exit 0
    ;;
  *)
    echo "Commande inconnue : $cmd" >&2
    usage
    exit 1
    ;;
esac
