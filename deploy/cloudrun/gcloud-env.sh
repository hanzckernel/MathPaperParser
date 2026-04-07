#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(
  cd "$(dirname "${BASH_SOURCE[0]}")" && pwd
)"
REPO_ROOT="$(
  cd "${SCRIPT_DIR}/../.." && pwd
)"

if [[ -z "${CLOUDSDK_CONFIG:-}" ]]; then
  export CLOUDSDK_CONFIG="${REPO_ROOT}/.gcloud"
fi

mkdir -p "${CLOUDSDK_CONFIG}"

if command -v gcloud >/dev/null 2>&1; then
  GCLOUD_BIN="$(command -v gcloud)"
elif [[ -x "/opt/homebrew/bin/gcloud" ]]; then
  GCLOUD_BIN="/opt/homebrew/bin/gcloud"
else
  echo "gcloud is not installed or not available on PATH." >&2
  exit 127
fi

gcloud_cmd() {
  "${GCLOUD_BIN}" "$@"
}
