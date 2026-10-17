#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/outils.sh"
cd "$RACINE"

rapport="$OUTILS/score.md"
statut=0
python3 security/grc/mokart_grc.py --format markdown --sortie "$rapport" --bloquer-critiques --seuil "${SCORE_MINIMUM:-0}" || statut=$?
python3 security/grc/mokart_grc.py --format json --sortie "$OUTILS/score.json" || true
cat "$rapport"
if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
  cat "$rapport" >> "$GITHUB_STEP_SUMMARY"
fi
exit "$statut"
