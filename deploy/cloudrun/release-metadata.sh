#!/usr/bin/env bash
set -euo pipefail

: "${PAPERPARSER_PROJECT:?Set PAPERPARSER_PROJECT to the Google Cloud project ID.}"
: "${PAPERPARSER_REGION:?Set PAPERPARSER_REGION to the Cloud Run region.}"
: "${PAPERPARSER_SERVICE:?Set PAPERPARSER_SERVICE to the Cloud Run service name.}"

IMAGE_JSON="${PAPERPARSER_IMAGE_JSON:-/workspace/cloudrun-image.json}"

if [[ ! -f "${IMAGE_JSON}" ]]; then
  echo "Image metadata file not found: ${IMAGE_JSON}" >&2
  exit 1
fi

IMAGE_TAG="$(
  sed -n 's/.*"imageTag":[[:space:]]*"\([^"]*\)".*/\1/p' "${IMAGE_JSON}" | head -n 1
)"
IMAGE_DIGEST="$(
  sed -n 's/.*"imageDigest":[[:space:]]*"\([^"]*\)".*/\1/p' "${IMAGE_JSON}" | head -n 1
)"
IMAGE_REF="$(
  sed -n 's/.*"imageRef":[[:space:]]*"\([^"]*\)".*/\1/p' "${IMAGE_JSON}" | head -n 1
)"

IFS=',' read -r SERVICE_URL LATEST_REVISION SERVICE_NAME RUNTIME_SERVICE_ACCOUNT <<< "$(
  gcloud run services describe "${PAPERPARSER_SERVICE}" \
    --project="${PAPERPARSER_PROJECT}" \
    --region="${PAPERPARSER_REGION}" \
    --format='csv[no-heading](status.url,status.latestReadyRevisionName,metadata.name,spec.template.spec.serviceAccountName)'
)"

cat <<EOF
{
  "service": "${SERVICE_NAME}",
  "url": "${SERVICE_URL}",
  "revision": "${LATEST_REVISION}",
  "runtimeServiceAccount": "${RUNTIME_SERVICE_ACCOUNT}",
  "imageTag": "${IMAGE_TAG}",
  "imageDigest": "${IMAGE_DIGEST}",
  "imageRef": "${IMAGE_REF}"
}
EOF
