#!/usr/bin/env bash
set -euo pipefail

EXPECTED_BRANCH="${PAPERPARSER_MAIN_BRANCH:-main}"
REF_NAME="${PAPERPARSER_REF_NAME:-${BRANCH_NAME:-}}"

if [[ -z "${REF_NAME}" ]]; then
  echo "Set PAPERPARSER_REF_NAME or BRANCH_NAME before publishing a release image." >&2
  exit 1
fi

if [[ "${REF_NAME}" != "${EXPECTED_BRANCH}" ]]; then
  echo "Ref ${REF_NAME} is not allowed to publish release images; expected ${EXPECTED_BRANCH}." >&2
  exit 1
fi
