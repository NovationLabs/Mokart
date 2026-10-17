#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/outils.sh"
cd "$RACINE"

echec=0
python3 -m pip install --quiet --disable-pip-version-check "pip-audit==${PIP_AUDIT_VERSION}"
resume "### Dépendances" ""

for fichier in api/requirements.txt ai-front/requirements.txt; do
  if python3 -m pip_audit -r "$fichier" --progress-spinner off; then
    resume "$fichier : aucune vulnérabilité connue."
  else
    resume "**$fichier : vulnérabilités connues, voir le log du job.**"
    echec=1
  fi
done

epingles="$OUTILS/ai-backend.txt"
(cd ai-backend && uv export --frozen --no-dev --no-emit-project --no-hashes --format requirements-txt --quiet) \
  | grep -E '^[A-Za-z0-9]' | cut -d' ' -f1 > "$epingles"
if python3 -m pip_audit --no-deps --disable-pip -r "$epingles" --progress-spinner off; then
  resume "ai-backend/uv.lock : aucune vulnérabilité connue."
else
  resume "**ai-backend/uv.lock : vulnérabilités connues, voir le log du job.**"
  echec=1
fi

for projet in app web; do
  (cd "$projet" && npm install --package-lock-only --ignore-scripts --no-audit --no-fund --silent)
  bilan="$(cd "$projet" && npm audit --omit=dev --json 2>/dev/null || true)"
  compte="$(printf '%s' "$bilan" | python3 -c 'import json,sys
v=json.load(sys.stdin).get("metadata",{}).get("vulnerabilities",{})
print(v.get("critical",0), v.get("high",0))')"
  critiques="${compte% *}"
  hautes="${compte#* }"
  if [ "$critiques" -gt 0 ]; then
    resume "**$projet : $critiques vulnérabilité(s) critique(s) npm.**"
    (cd "$projet" && npm audit --omit=dev --audit-level=critical) || true
    echec=1
  else
    resume "$projet : aucune vulnérabilité critique npm, $hautes élevée(s) à traiter."
  fi
done

exit "$echec"
