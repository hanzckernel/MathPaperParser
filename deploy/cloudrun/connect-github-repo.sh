#!/usr/bin/env bash
set -euo pipefail

: "${PAPERPARSER_PROJECT:?Set PAPERPARSER_PROJECT to the Google Cloud project ID.}"

TRIGGER_REGION="${PAPERPARSER_TRIGGER_REGION:-global}"
PROJECT_NUMBER="$(
  gcloud projects describe "${PAPERPARSER_PROJECT}" --format='value(projectNumber)'
)"

cat <<EOF
Connect the GitHub repository to Cloud Build by completing the browser flow at:

https://console.cloud.google.com/cloud-build/triggers;region=${TRIGGER_REGION}/connect?project=${PROJECT_NUMBER}
EOF
