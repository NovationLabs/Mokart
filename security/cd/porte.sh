#!/usr/bin/env bash
set -euo pipefail
RACINE="$(git rev-parse --show-toplevel)"
cd "$RACINE"

[ -f .env ] || cp .env.example .env
nettoyer() {
  docker compose -f docker-compose.prod.yml logs --tail=50 api || true
  docker compose -f docker-compose.prod.yml down -v >/dev/null 2>&1 || true
}
trap nettoyer EXIT

"$RACINE/security/ci/conteneurs.sh" --images

docker compose -f docker-compose.prod.yml up --build -d
API_URL=http://localhost:8081 APP_URL=http://localhost:8000 WEB_URL=http://localhost:8080 ENVIRONNEMENT=production \
  "$RACINE/security/cd/verifier.sh"
