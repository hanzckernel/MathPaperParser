#!/usr/bin/env bash
set -euo pipefail

: "${PAPERPARSER_SERVICE:?Set PAPERPARSER_SERVICE to the Cloud Run service name.}"
: "${PAPERPARSER_REGION:?Set PAPERPARSER_REGION to the Cloud Run region.}"
: "${PAPERPARSER_REVISION:?Set PAPERPARSER_REVISION to the revision to restore.}"

gcloud run services update-traffic "$PAPERPARSER_SERVICE" \
  --region "$PAPERPARSER_REGION" \
  --to-revisions="${PAPERPARSER_REVISION}=100"
