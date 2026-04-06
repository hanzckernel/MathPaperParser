#!/usr/bin/env bash
set -euo pipefail

: "${PAPERPARSER_PROJECT:?Set PAPERPARSER_PROJECT to the Google Cloud project ID.}"
: "${PAPERPARSER_REGION:?Set PAPERPARSER_REGION to the Artifact Registry region.}"

ARTIFACT_REPOSITORY="${PAPERPARSER_ARTIFACT_REPOSITORY:-paperparser}"
IMAGE_NAME="${PAPERPARSER_IMAGE_NAME:-paperparser}"
IMAGE_TAG="${PAPERPARSER_IMAGE_TAG:?Set PAPERPARSER_IMAGE_TAG to the published image tag.}"
IMAGE_URI="${PAPERPARSER_REGION}-docker.pkg.dev/${PAPERPARSER_PROJECT}/${ARTIFACT_REPOSITORY}/${IMAGE_NAME}:${IMAGE_TAG}"

IMAGE_DIGEST="$(
  gcloud artifacts docker images describe "${IMAGE_URI}" \
    --format='value(image_summary.digest)'
)"

IMAGE_REF="$(
  gcloud artifacts docker images describe "${IMAGE_URI}" \
    --format='value(image_summary.fully_qualified_digest)'
)"

cat <<EOF
{
  "imageTag": "${IMAGE_URI}",
  "imageDigest": "${IMAGE_DIGEST}",
  "imageRef": "${IMAGE_REF}"
}
EOF
