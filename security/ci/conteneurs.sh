#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/outils.sh"
cd "$RACINE"

installer_trivy

options=(config --quiet --skip-dirs "**/node_modules" --skip-dirs HELP --skip-dirs data_test)
resume "### Conteneurs et configuration" ""

trivy "${options[@]}" --severity HIGH,CRITICAL --exit-code 0 . || true

if trivy "${options[@]}" --severity CRITICAL --exit-code 1 . >/dev/null; then
  resume "Aucun défaut critique dans les Dockerfile et docker-compose."
else
  resume "**Défaut critique dans les Dockerfile ou docker-compose, voir le log du job.**"
  exit 1
fi

if [ "${1:-}" = "--images" ]; then
  echec=0
  for service in api ai-backend ai-front; do
    fichier="$service/Dockerfile"
    [ "$service" = "api" ] && fichier="api/Dockerfile.railway"
    docker build --quiet -t "mokart-$service:ci" -f "$fichier" "$service" >/dev/null
    if trivy image --quiet --severity CRITICAL --ignore-unfixed --exit-code 1 "mokart-$service:ci"; then
      resume "Image $service : aucune vulnérabilité critique corrigeable."
    else
      resume "**Image $service : vulnérabilité critique corrigeable.**"
      echec=1
    fi
  done
  exit "$echec"
fi
