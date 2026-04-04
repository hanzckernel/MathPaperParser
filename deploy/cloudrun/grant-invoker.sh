#!/usr/bin/env bash
set -euo pipefail

: "${PAPERPARSER_SERVICE:?Set PAPERPARSER_SERVICE to the Cloud Run service name.}"
: "${PAPERPARSER_REGION:?Set PAPERPARSER_REGION to the Cloud Run region.}"
: "${PAPERPARSER_MEMBER:?Set PAPERPARSER_MEMBER to a named principal such as user:alice@example.com.}"

case "$PAPERPARSER_MEMBER" in
  allUsers|allAuthenticatedUsers)
    echo "Unsupported public principal for PaperParser shared deployment: $PAPERPARSER_MEMBER" >&2
    exit 1
    ;;
esac

gcloud run services add-iam-policy-binding "$PAPERPARSER_SERVICE" \
  --region "$PAPERPARSER_REGION" \
  --member "$PAPERPARSER_MEMBER" \
  --role roles/run.invoker
