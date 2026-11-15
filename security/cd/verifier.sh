#!/usr/bin/env bash
set -uo pipefail

API_URL="${API_URL:?API_URL manquant}"
APP_URL="${APP_URL:-}"
WEB_URL="${WEB_URL:-}"
AI_URL="${AI_URL:-}"
ENVIRONNEMENT="${ENVIRONNEMENT:-dev}"

echecs=0
total=0

resume() {
  if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
    printf '%s\n' "$@" >> "$GITHUB_STEP_SUMMARY"
  fi
}

verifier() {
  local libelle="$1" attendu="$2" obtenu="$3"
  total=$((total + 1))
  if [[ "$obtenu" =~ ^($attendu)$ ]]; then
    printf 'ok      %s\n' "$libelle"
    resume "| $libelle | conforme |"
  else
    printf 'ECHEC   %s (attendu %s, obtenu %s)\n' "$libelle" "$attendu" "$obtenu"
    resume "| $libelle | **non conforme**, obtenu $obtenu |"
    echecs=$((echecs + 1))
  fi
}

code() {
  curl -s -o /dev/null -m 20 -w '%{http_code}' "$@"
}

entete() {
  local url="$1" nom="$2"
  curl -s -I -m 20 "$url" | tr -d '\r' | grep -i "^$nom:" | head -1 | cut -d: -f2- | xargs
}

attendre() {
  for _ in $(seq 1 30); do
    [ "$(code "$API_URL/health")" = "200" ] && return 0
    sleep 4
  done
}

resume "### Vérification de sécurité $ENVIRONNEMENT" "" "| Contrôle | État |" "| --- | --- |"
attendre

verifier "API joignable" "200" "$(code "$API_URL/health")"
verifier "Admin refusé sans jeton" "401" "$(code "$API_URL/admin/users")"
verifier "Admin refusé avec un jeton forgé" "401" "$(code -H 'Authorization: Bearer local-token-550e8400-e29b-41d4-a716-446655440001' "$API_URL/admin/users")"
verifier "Sessions refusées sans jeton" "401" "$(code "$API_URL/sessions/")"
verifier "Profil refusé sans jeton" "401" "$(code "$API_URL/users/profile?user_id=550e8400-e29b-41d4-a716-446655440001")"
verifier "Tableau de bord refusé sans jeton" "401" "$(code "$API_URL/dashboard/data?user_id=x&role=admin")"
verifier "Swagger fermé" "404" "$(code "$API_URL/docs")"
verifier "CORS refuse une origine inconnue" "" "$(curl -s -I -m 20 -H 'Origin: https://mokart-verification.invalid' "$API_URL/health" | tr -d '\r' | grep -i '^access-control-allow-origin:' | cut -d: -f2- | xargs)"

if [ "$ENVIRONNEMENT" = "production" ]; then
  verifier "Compte démo désactivé" "403" "$(code -X POST -H 'Content-Type: application/json' -d '{"email":"demo@mokart.com","password":"demo123456"}' "$API_URL/auth/login")"
fi

for cible in "$APP_URL" "$WEB_URL"; do
  [ -z "$cible" ] && continue
  verifier "En-tête nosniff sur $cible" "nosniff" "$(entete "$cible" x-content-type-options)"
  verifier "Protection iframe sur $cible" "SAMEORIGIN|DENY" "$(entete "$cible" x-frame-options)"
  if [[ "$cible" == https://* ]]; then
    verifier "HSTS sur $cible" "max-age=[0-9]+.*" "$(entete "$cible" strict-transport-security)"
  fi
done

if [ -n "$AI_URL" ]; then
  gros="$(python3 -c 'import json;print(json.dumps({"messages":[{"role":"user","content":"x"*70000}]}))')"
  verifier "Agent IA refuse les requêtes géantes" "413|429" "$(code -X POST -H 'Content-Type: application/json' --data "$gros" "$AI_URL/api/chat")"
fi

resume "" "$((total - echecs)) contrôles sur $total conformes."
printf '\n%s contrôles sur %s conformes\n' "$((total - echecs))" "$total"
[ "$echecs" -eq 0 ]
