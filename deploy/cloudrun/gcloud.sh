#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/gcloud-env.sh"

gcloud_cmd "$@"
