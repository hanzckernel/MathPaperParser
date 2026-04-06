#!/usr/bin/env bash
set -euo pipefail

: "${PAPERPARSER_PROJECT:?Set PAPERPARSER_PROJECT to the Google Cloud project ID.}"
: "${PAPERPARSER_REGION:?Set PAPERPARSER_REGION to the Cloud Run region.}"
: "${PAPERPARSER_SERVICE:?Set PAPERPARSER_SERVICE to the Cloud Run service name.}"
: "${PAPERPARSER_RUNTIME_SERVICE_ACCOUNT:?Set PAPERPARSER_RUNTIME_SERVICE_ACCOUNT to the runtime service account email.}"
: "${PAPERPARSER_STORE_BUCKET:?Set PAPERPARSER_STORE_BUCKET to the dedicated Cloud Storage bucket name.}"

IMAGE_JSON="${PAPERPARSER_IMAGE_JSON:-/workspace/cloudrun-image.json}"

if [[ ! -f "${IMAGE_JSON}" ]]; then
  echo "Image metadata file not found: ${IMAGE_JSON}" >&2
  exit 1
fi

IMAGE_REF="$(
  sed -n 's/.*"imageRef":[[:space:]]*"\([^"]*\)".*/\1/p' "${IMAGE_JSON}" | head -n 1
)"

if [[ -z "${IMAGE_REF}" ]]; then
  echo "Could not extract imageRef from ${IMAGE_JSON}" >&2
  exit 1
fi

PAPERPARSER_IMAGE="${IMAGE_REF}" deploy/cloudrun/deploy.sh
