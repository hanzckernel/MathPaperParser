#!/usr/bin/env bash
set -euo pipefail

: "${PAPERPARSER_PROJECT:?Set PAPERPARSER_PROJECT to the Google Cloud project ID.}"
: "${PAPERPARSER_REGION:?Set PAPERPARSER_REGION to the deploy region.}"

TRIGGER_REGION="${PAPERPARSER_TRIGGER_REGION:-global}"
TRIGGER_NAME="${PAPERPARSER_TRIGGER_NAME:-paperparser-main}"
ARTIFACT_REPOSITORY="${PAPERPARSER_ARTIFACT_REPOSITORY:-paperparser}"
BUILD_SERVICE_ACCOUNT="${PAPERPARSER_BUILD_SERVICE_ACCOUNT:-paperparser-cloudbuild@${PAPERPARSER_PROJECT}.iam.gserviceaccount.com}"
IMAGE_NAME="${PAPERPARSER_IMAGE_NAME:-paperparser}"
SERVICE="${PAPERPARSER_SERVICE:-paperparser}"
RUNTIME_SERVICE_ACCOUNT="${PAPERPARSER_RUNTIME_SERVICE_ACCOUNT:-paperparser-runtime@${PAPERPARSER_PROJECT}.iam.gserviceaccount.com}"
STORE_BUCKET="${PAPERPARSER_STORE_BUCKET:-paperparser-store-${PAPERPARSER_PROJECT}}"
REMOTE_URL="${PAPERPARSER_GITHUB_REMOTE:-$(git remote get-url origin 2>/dev/null || true)}"

parse_remote() {
  case "${1}" in
    git@github.com:*)
      local slug="${1#git@github.com:}"
      slug="${slug%.git}"
      printf '%s\n' "${slug}"
      ;;
    https://github.com/*)
      local slug="${1#https://github.com/}"
      slug="${slug%.git}"
      printf '%s\n' "${slug}"
      ;;
    *)
      return 1
      ;;
  esac
}

REPO_SLUG="${PAPERPARSER_GITHUB_OWNER:-}/${PAPERPARSER_GITHUB_REPO:-}"
if [[ "${REPO_SLUG}" == "/" ]]; then
  REPO_SLUG="$(parse_remote "${REMOTE_URL}")"
fi

REPO_OWNER="${PAPERPARSER_GITHUB_OWNER:-${REPO_SLUG%%/*}}"
REPO_NAME="${PAPERPARSER_GITHUB_REPO:-${REPO_SLUG##*/}}"

: "${REPO_OWNER:?Set PAPERPARSER_GITHUB_OWNER or configure origin to a GitHub repo.}"
: "${REPO_NAME:?Set PAPERPARSER_GITHUB_REPO or configure origin to a GitHub repo.}"

SERVICE_ACCOUNT_REF="projects/${PAPERPARSER_PROJECT}/serviceAccounts/${BUILD_SERVICE_ACCOUNT}"
TRIGGER_ID="$(
  gcloud builds triggers list \
    --project "${PAPERPARSER_PROJECT}" \
    --region "${TRIGGER_REGION}" \
    --format='value(id)' | head -n 1
)"

COMMON_SUBSTITUTIONS="_LOCATION=${PAPERPARSER_REGION},_REPOSITORY=${ARTIFACT_REPOSITORY},_IMAGE=${IMAGE_NAME},_SERVICE=${SERVICE},_RUNTIME_SERVICE_ACCOUNT=${RUNTIME_SERVICE_ACCOUNT},_STORE_BUCKET=${STORE_BUCKET}"

if [[ -n "${TRIGGER_ID}" ]]; then
  gcloud builds triggers update github "${TRIGGER_ID}" \
    --project "${PAPERPARSER_PROJECT}" \
    --region "${TRIGGER_REGION}" \
    --repo-owner "${REPO_OWNER}" \
    --repo-name "${REPO_NAME}" \
    --branch-pattern '^main$' \
    --build-config cloudbuild.release.yaml \
    --description "PaperParser mainline release trigger" \
    --service-account "${SERVICE_ACCOUNT_REF}" \
    --include-logs-with-status \
    --update-substitutions "${COMMON_SUBSTITUTIONS}"
else
  gcloud builds triggers create github \
    --project "${PAPERPARSER_PROJECT}" \
    --region "${TRIGGER_REGION}" \
    --name "${TRIGGER_NAME}" \
    --repo-owner "${REPO_OWNER}" \
    --repo-name "${REPO_NAME}" \
    --branch-pattern '^main$' \
    --build-config cloudbuild.release.yaml \
    --description "PaperParser mainline release trigger" \
    --service-account "${SERVICE_ACCOUNT_REF}" \
    --include-logs-with-status \
    --substitutions "${COMMON_SUBSTITUTIONS}"
fi
