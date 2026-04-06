#!/usr/bin/env bash
set -euo pipefail

: "${PAPERPARSER_PROJECT:?Set PAPERPARSER_PROJECT to the Google Cloud project ID.}"
: "${PAPERPARSER_REGION:?Set PAPERPARSER_REGION to the Cloud Run region.}"
: "${PAPERPARSER_SERVICE:?Set PAPERPARSER_SERVICE to the Cloud Run service name.}"

RELEASE_JSON="${PAPERPARSER_RELEASE_JSON:-/workspace/cloudrun-release.json}"
IMAGE_JSON="${PAPERPARSER_IMAGE_JSON:-/workspace/cloudrun-image.json}"

read_json_field() {
  local file_path="$1"
  local field_name="$2"

  if [[ ! -f "${file_path}" ]]; then
    return 0
  fi

  python3 - "$file_path" "$field_name" <<'PY'
import json
import sys

path, field = sys.argv[1], sys.argv[2]
with open(path, "r", encoding="utf-8") as handle:
    data = json.load(handle)
value = data.get(field, "")
if value is None:
    value = ""
print(value)
PY
}

IMAGE_REF="$(read_json_field "${RELEASE_JSON}" "imageRef")"
if [[ -z "${IMAGE_REF}" ]]; then
  IMAGE_REF="$(read_json_field "${IMAGE_JSON}" "imageRef")"
fi

IFS=$'\t' read -r SERVICE_URL CURRENT_REVISION <<< "$(
  gcloud run services describe "${PAPERPARSER_SERVICE}" \
    --project="${PAPERPARSER_PROJECT}" \
    --region="${PAPERPARSER_REGION}" \
    --format='value(status.url,status.latestReadyRevisionName)'
)"

if [[ -z "${SERVICE_URL}" || -z "${CURRENT_REVISION}" ]]; then
  echo "Unable to resolve the deployed service URL and revision for smoke." >&2
  exit 1
fi

TOKEN="$(gcloud auth print-identity-token)"
AUTH_HEADER="Authorization: Bearer ${TOKEN}"

HEALTH_BODY="$(
  curl -fsS \
    -H "${AUTH_HEADER}" \
    "${SERVICE_URL}/health"
)"
READY_BODY="$(
  curl -fsS \
    -H "${AUTH_HEADER}" \
    "${SERVICE_URL}/ready"
)"
PAPERS_BODY="$(
  curl -fsS \
    -H "${AUTH_HEADER}" \
    "${SERVICE_URL}/api/papers"
)"

if [[ "${HEALTH_BODY}" != *'"ok":true'* ]]; then
  echo "Smoke failed: /health did not return ok=true." >&2
  exit 1
fi

if [[ "${READY_BODY}" != *'"ok":true'* ]]; then
  echo "Smoke failed: /ready did not return ok=true." >&2
  exit 1
fi

if [[ "${PAPERS_BODY}" != *'"papers"'* ]]; then
  echo "Smoke failed: /api/papers did not return the expected papers payload." >&2
  exit 1
fi

PREVIOUS_REVISION="$(
  gcloud run revisions list \
    --project "${PAPERPARSER_PROJECT}" \
    --service "${PAPERPARSER_SERVICE}" \
    --region "${PAPERPARSER_REGION}" \
    --sort-by='~metadata.creationTimestamp' \
    --format='value(metadata.name)' | awk -v current="${CURRENT_REVISION}" '$1 != current { print $1; exit }'
)"

ROLLBACK_COMMAND=""
if [[ -n "${PREVIOUS_REVISION}" ]]; then
  ROLLBACK_COMMAND="PAPERPARSER_PROJECT='${PAPERPARSER_PROJECT}' PAPERPARSER_REGION='${PAPERPARSER_REGION}' PAPERPARSER_SERVICE='${PAPERPARSER_SERVICE}' PAPERPARSER_REVISION='${PREVIOUS_REVISION}' deploy/cloudrun/rollback.sh"
fi

export PAPERPARSER_SMOKE_SERVICE_URL="${SERVICE_URL}"
export PAPERPARSER_SMOKE_CURRENT_REVISION="${CURRENT_REVISION}"
export PAPERPARSER_SMOKE_PREVIOUS_REVISION="${PREVIOUS_REVISION}"
export PAPERPARSER_SMOKE_IMAGE_REF="${IMAGE_REF}"
export PAPERPARSER_SMOKE_HEALTH_BODY="${HEALTH_BODY}"
export PAPERPARSER_SMOKE_READY_BODY="${READY_BODY}"
export PAPERPARSER_SMOKE_PAPERS_BODY="${PAPERS_BODY}"
export PAPERPARSER_SMOKE_ROLLBACK_COMMAND="${ROLLBACK_COMMAND}"

python3 <<'PY'
import json
import os

payload = {
    "serviceUrl": os.environ["PAPERPARSER_SMOKE_SERVICE_URL"],
    "currentRevision": os.environ["PAPERPARSER_SMOKE_CURRENT_REVISION"],
    "previousRevision": os.environ["PAPERPARSER_SMOKE_PREVIOUS_REVISION"],
    "imageRef": os.environ["PAPERPARSER_SMOKE_IMAGE_REF"],
    "checks": {
        "health": json.loads(os.environ["PAPERPARSER_SMOKE_HEALTH_BODY"]),
        "ready": json.loads(os.environ["PAPERPARSER_SMOKE_READY_BODY"]),
        "papers": json.loads(os.environ["PAPERPARSER_SMOKE_PAPERS_BODY"]),
    },
    "rollbackCommand": os.environ["PAPERPARSER_SMOKE_ROLLBACK_COMMAND"],
}
print(json.dumps(payload, indent=2))
PY
