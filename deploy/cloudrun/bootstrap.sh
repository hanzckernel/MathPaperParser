#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/gcloud-env.sh"

: "${PAPERPARSER_PROJECT:?Set PAPERPARSER_PROJECT to the Google Cloud project ID.}"
: "${PAPERPARSER_REGION:?Set PAPERPARSER_REGION to the Cloud Run and Artifact Registry region.}"

ARTIFACT_REPOSITORY="${PAPERPARSER_ARTIFACT_REPOSITORY:-paperparser}"
BUILD_SERVICE_ACCOUNT="${PAPERPARSER_BUILD_SERVICE_ACCOUNT:-paperparser-cloudbuild@${PAPERPARSER_PROJECT}.iam.gserviceaccount.com}"
SERVICE="${PAPERPARSER_SERVICE:-paperparser}"
RUNTIME_SERVICE_ACCOUNT="${PAPERPARSER_RUNTIME_SERVICE_ACCOUNT:-paperparser-runtime@${PAPERPARSER_PROJECT}.iam.gserviceaccount.com}"
STORE_BUCKET="${PAPERPARSER_STORE_BUCKET:-paperparser-store-${PAPERPARSER_PROJECT}}"
IMAGE_NAME="${PAPERPARSER_IMAGE_NAME:-paperparser}"
IMAGE_TAG="${PAPERPARSER_IMAGE_TAG:-$(git rev-parse --short HEAD 2>/dev/null || echo latest)}"
IMAGE_URI="${PAPERPARSER_REGION}-docker.pkg.dev/${PAPERPARSER_PROJECT}/${ARTIFACT_REPOSITORY}/${IMAGE_NAME}:${IMAGE_TAG}"
BUILD_SERVICE_ACCOUNT_ID="${BUILD_SERVICE_ACCOUNT%%@*}"
SERVICE_ACCOUNT_ID="${RUNTIME_SERVICE_ACCOUNT%%@*}"

gcloud_cmd services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  storage.googleapis.com \
  --project="${PAPERPARSER_PROJECT}"

if ! gcloud_cmd artifacts repositories describe "${ARTIFACT_REPOSITORY}" \
  --project="${PAPERPARSER_PROJECT}" \
  --location="${PAPERPARSER_REGION}" >/dev/null 2>&1; then
  gcloud_cmd artifacts repositories create "${ARTIFACT_REPOSITORY}" \
    --project="${PAPERPARSER_PROJECT}" \
    --repository-format=docker \
    --location="${PAPERPARSER_REGION}" \
    --description="PaperParser Cloud Run images"
fi

if ! gcloud_cmd iam service-accounts describe "${RUNTIME_SERVICE_ACCOUNT}" \
  --project="${PAPERPARSER_PROJECT}" >/dev/null 2>&1; then
  gcloud_cmd iam service-accounts create "${SERVICE_ACCOUNT_ID}" \
    --project="${PAPERPARSER_PROJECT}" \
    --display-name="PaperParser Cloud Run Runtime"
fi

if ! gcloud_cmd iam service-accounts describe "${BUILD_SERVICE_ACCOUNT}" \
  --project="${PAPERPARSER_PROJECT}" >/dev/null 2>&1; then
  gcloud_cmd iam service-accounts create "${BUILD_SERVICE_ACCOUNT_ID}" \
    --project="${PAPERPARSER_PROJECT}" \
    --display-name="PaperParser Cloud Build Deployer"
fi

if ! gcloud_cmd storage buckets describe "gs://${STORE_BUCKET}" >/dev/null 2>&1; then
  gcloud_cmd storage buckets create "gs://${STORE_BUCKET}" \
    --project="${PAPERPARSER_PROJECT}" \
    --location="${PAPERPARSER_REGION}" \
    --uniform-bucket-level-access
fi

gcloud_cmd storage buckets add-iam-policy-binding "gs://${STORE_BUCKET}" \
  --member="serviceAccount:${RUNTIME_SERVICE_ACCOUNT}" \
  --role="roles/storage.objectUser" >/dev/null

gcloud_cmd projects add-iam-policy-binding "${PAPERPARSER_PROJECT}" \
  --member="serviceAccount:${BUILD_SERVICE_ACCOUNT}" \
  --role="roles/artifactregistry.writer" >/dev/null

gcloud_cmd projects add-iam-policy-binding "${PAPERPARSER_PROJECT}" \
  --member="serviceAccount:${BUILD_SERVICE_ACCOUNT}" \
  --role="roles/run.admin" >/dev/null

gcloud_cmd projects add-iam-policy-binding "${PAPERPARSER_PROJECT}" \
  --member="serviceAccount:${BUILD_SERVICE_ACCOUNT}" \
  --role="roles/logging.logWriter" >/dev/null

gcloud_cmd iam service-accounts add-iam-policy-binding "${RUNTIME_SERVICE_ACCOUNT}" \
  --project="${PAPERPARSER_PROJECT}" \
  --member="serviceAccount:${BUILD_SERVICE_ACCOUNT}" \
  --role="roles/iam.serviceAccountUser" >/dev/null

gcloud_cmd iam service-accounts add-iam-policy-binding "${BUILD_SERVICE_ACCOUNT}" \
  --project="${PAPERPARSER_PROJECT}" \
  --member="serviceAccount:${BUILD_SERVICE_ACCOUNT}" \
  --role="roles/iam.serviceAccountOpenIdTokenCreator" >/dev/null

cat <<EOF
PAPERPARSER_PROJECT=${PAPERPARSER_PROJECT}
PAPERPARSER_REGION=${PAPERPARSER_REGION}
PAPERPARSER_SERVICE=${SERVICE}
PAPERPARSER_ARTIFACT_REPOSITORY=${ARTIFACT_REPOSITORY}
PAPERPARSER_BUILD_SERVICE_ACCOUNT=${BUILD_SERVICE_ACCOUNT}
PAPERPARSER_RUNTIME_SERVICE_ACCOUNT=${RUNTIME_SERVICE_ACCOUNT}
PAPERPARSER_STORE_BUCKET=${STORE_BUCKET}
PAPERPARSER_IMAGE=${IMAGE_URI}
EOF
