#!/usr/bin/env bash
set -euo pipefail

: "${PAPERPARSER_PROJECT:?Set PAPERPARSER_PROJECT to the Google Cloud project ID.}"
: "${PAPERPARSER_REGION:?Set PAPERPARSER_REGION to the Artifact Registry region.}"

ARTIFACT_REPOSITORY="${PAPERPARSER_ARTIFACT_REPOSITORY:-paperparser}"
IMAGE_NAME="${PAPERPARSER_IMAGE_NAME:-paperparser}"
IMAGE_TAG="${PAPERPARSER_IMAGE_TAG:-$(git rev-parse --short HEAD 2>/dev/null || echo latest)}"
IMAGE_URI="${PAPERPARSER_REGION}-docker.pkg.dev/${PAPERPARSER_PROJECT}/${ARTIFACT_REPOSITORY}/${IMAGE_NAME}:${IMAGE_TAG}"

gcloud builds submit --project="${PAPERPARSER_PROJECT}" --tag="${IMAGE_URI}" .

printf '%s\n' "${IMAGE_URI}"

