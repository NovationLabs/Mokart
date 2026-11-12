#!/usr/bin/env bash
set -euo pipefail

GITLEAKS_VERSION="8.30.1"
GITLEAKS_SHA256="551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb"
TRIVY_VERSION="0.74.0"
TRIVY_SHA256="2ae6fe3ee734b7fdf11335663e18c75ea12dccc76062f09f164a3b0f8be4371a"
PIP_AUDIT_VERSION="2.10.1"

RACINE="$(git rev-parse --show-toplevel)"
OUTILS="${RUNNER_TEMP:-$RACINE/.security-tools}/outils"
mkdir -p "$OUTILS"
export PATH="$OUTILS:$PATH"

installer() {
  local nom="$1" url="$2" sha="$3"
  if [ -x "$OUTILS/$nom" ]; then
    return 0
  fi
  local archive
  archive="$(mktemp)"
  curl -fsSL "$url" -o "$archive"
  echo "$sha  $archive" | sha256sum -c - >/dev/null
  tar -xzf "$archive" -C "$OUTILS" "$nom"
  rm -f "$archive"
}

installer_gitleaks() {
  installer gitleaks "https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/gitleaks_${GITLEAKS_VERSION}_linux_x64.tar.gz" "$GITLEAKS_SHA256"
}

installer_trivy() {
  installer trivy "https://github.com/aquasecurity/trivy/releases/download/v${TRIVY_VERSION}/trivy_${TRIVY_VERSION}_Linux-64bit.tar.gz" "$TRIVY_SHA256"
}

resume() {
  if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
    printf '%s\n' "$@" "" >> "$GITHUB_STEP_SUMMARY"
  fi
}
