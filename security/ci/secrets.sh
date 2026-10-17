#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/outils.sh"
cd "$RACINE"

installer_gitleaks

if gitleaks git . --redact --no-banner --report-format json --report-path "$OUTILS/gitleaks.json"; then
  resume "### Secrets" "" "Aucun secret détecté dans l'historique git."
else
  nb="$(python3 -c 'import json,sys;print(len(json.load(open(sys.argv[1]))))' "$OUTILS/gitleaks.json" 2>/dev/null || echo "?")"
  resume "### Secrets" "" "**$nb secret(s) détecté(s).** Révoquer chaque secret chez son fournisseur avant de le retirer du code : il reste lisible dans l'historique git."
  exit 1
fi
