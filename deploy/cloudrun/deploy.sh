#!/usr/bin/env bash
set -euo pipefail

: "${PAPERPARSER_SERVICE:?Set PAPERPARSER_SERVICE to the Cloud Run service name.}"
: "${PAPERPARSER_IMAGE:?Set PAPERPARSER_IMAGE to the container image URI.}"
: "${PAPERPARSER_REGION:?Set PAPERPARSER_REGION to the Cloud Run region.}"
: "${PAPERPARSER_RUNTIME_SERVICE_ACCOUNT:?Set PAPERPARSER_RUNTIME_SERVICE_ACCOUNT to the runtime service account email.}"
: "${PAPERPARSER_STORE_BUCKET:?Set PAPERPARSER_STORE_BUCKET to the dedicated Cloud Storage bucket name.}"

PROJECT="${PAPERPARSER_PROJECT:-}"
STORE_PATH="${PAPERPARSER_STORE_PATH:-/var/paperparser/store}"
MEMORY="${PAPERPARSER_MEMORY:-1Gi}"
CPU="${PAPERPARSER_CPU:-1}"
MIN_INSTANCES="${PAPERPARSER_MIN_INSTANCES:-0}"
MAX_INSTANCES="${PAPERPARSER_MAX_INSTANCES:-3}"

if [[ -n "${PROJECT}" ]]; then
  gcloud run deploy "$PAPERPARSER_SERVICE" \
    --project "$PROJECT" \
    --image "$PAPERPARSER_IMAGE" \
    --region "$PAPERPARSER_REGION" \
    --platform managed \
    --service-account "$PAPERPARSER_RUNTIME_SERVICE_ACCOUNT" \
    --port 8080 \
    --ingress all \
    --invoker-iam-check \
    --cpu "$CPU" \
    --memory "$MEMORY" \
    --min-instances "$MIN_INSTANCES" \
    --max-instances "$MAX_INSTANCES" \
    --add-volume "name=paperparser-store,type=cloud-storage,bucket=$PAPERPARSER_STORE_BUCKET" \
    --add-volume-mount "volume=paperparser-store,mount-path=/var/paperparser/store" \
    --set-env-vars "PAPERPARSER_RUNTIME_MODE=deployed,PAPERPARSER_WEB_DIST=/app/packages/web/dist,PAPERPARSER_STORE_PATH=$STORE_PATH"
else
  gcloud run deploy "$PAPERPARSER_SERVICE" \
    --image "$PAPERPARSER_IMAGE" \
    --region "$PAPERPARSER_REGION" \
    --platform managed \
    --service-account "$PAPERPARSER_RUNTIME_SERVICE_ACCOUNT" \
    --port 8080 \
    --ingress all \
    --invoker-iam-check \
    --cpu "$CPU" \
    --memory "$MEMORY" \
    --min-instances "$MIN_INSTANCES" \
    --max-instances "$MAX_INSTANCES" \
    --add-volume "name=paperparser-store,type=cloud-storage,bucket=$PAPERPARSER_STORE_BUCKET" \
    --add-volume-mount "volume=paperparser-store,mount-path=/var/paperparser/store" \
    --set-env-vars "PAPERPARSER_RUNTIME_MODE=deployed,PAPERPARSER_WEB_DIST=/app/packages/web/dist,PAPERPARSER_STORE_PATH=$STORE_PATH"
fi
