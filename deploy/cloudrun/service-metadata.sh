#!/usr/bin/env bash
set -euo pipefail

: "${PAPERPARSER_PROJECT:?Set PAPERPARSER_PROJECT to the Google Cloud project ID.}"
: "${PAPERPARSER_REGION:?Set PAPERPARSER_REGION to the Cloud Run region.}"

SERVICE="${PAPERPARSER_SERVICE:-paperparser}"

gcloud run services describe "${SERVICE}" \
  --project="${PAPERPARSER_PROJECT}" \
  --region="${PAPERPARSER_REGION}" \
  --format='json(metadata.name,status.url,status.latestReadyRevisionName,spec.template.spec.serviceAccountName)'

