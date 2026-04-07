# Cloud Run Operator Runbook

## Supported `v1.5` Hosted Topology

- one long-lived Cloud Run service
- direct authenticated Cloud Run URL
- Cloud Storage bucket mounted at `/var/paperparser/store`
- explicit `roles/run.invoker` grants for named principals only
- GitHub as the hosted source of truth on `main`
- a dedicated Cloud Build deploy service account
- repo-owned bootstrap, trigger, build, deploy, and metadata helpers

The first live deployment was verified on **April 6, 2026** against:

- project: `paperparser-492322`
- region: `europe-west1`
- service: `paperparser`
- Artifact Registry repository: `paperparser`
- store bucket: `paperparser-store-paperparser-492322`

## Prerequisites

- `gcloud` authenticated for the target project
- Cloud Run, Artifact Registry, Cloud Build, and Cloud Storage APIs available in the project
- permission to create or verify the runtime service account, the Cloud Build deploy service account, Artifact Registry repository, mounted store bucket, and Cloud Build trigger

The repo-local helper `deploy/cloudrun/gcloud.sh` and the Cloud Run shell helpers default `CLOUDSDK_CONFIG` to `.gcloud/` at the repo root, which avoids sandbox friction around `~/.config/gcloud`.

## 1. Bootstrap Or Verify GCP Resources

```bash
export PAPERPARSER_PROJECT=paperparser-492322
export PAPERPARSER_REGION=europe-west1
export PAPERPARSER_SERVICE=paperparser
export PAPERPARSER_ARTIFACT_REPOSITORY=paperparser
export PAPERPARSER_BUILD_SERVICE_ACCOUNT=paperparser-cloudbuild@paperparser-492322.iam.gserviceaccount.com
export PAPERPARSER_RUNTIME_SERVICE_ACCOUNT=paperparser-runtime@paperparser-492322.iam.gserviceaccount.com
export PAPERPARSER_STORE_BUCKET=paperparser-store-paperparser-492322

deploy/cloudrun/bootstrap.sh
```

The helper enables required APIs, creates missing resources where practical, ensures the runtime service account can write to the mounted bucket, grants the dedicated Cloud Build service account the bounded roles needed to publish and deploy, and prints the canonical environment values for the hosted path.

## 2. Connect The GitHub Repository To Cloud Build

On the first setup only, complete the repository connection flow:

```bash
export PAPERPARSER_TRIGGER_REGION=global
deploy/cloudrun/connect-github-repo.sh
```

Open the printed URL, authenticate with GitHub, and connect `hanzckernel/MathPaperParser` to Cloud Build. This one-time browser step is required before trigger sync can succeed.

## 3. Sync The GitHub `main` Trigger

```bash
export PAPERPARSER_TRIGGER_REGION=global
export PAPERPARSER_GITHUB_OWNER=hanzckernel
export PAPERPARSER_GITHUB_REPO=MathPaperParser

deploy/cloudrun/sync-github-trigger.sh
```

This helper creates or updates the Cloud Build GitHub trigger for `main`, points it at `cloudbuild.release.yaml`, and runs it under the dedicated `paperparser-cloudbuild@...` service account instead of key JSON or the legacy default path.

## 4. Validate The Repo-Owned Pipeline Gates

```bash
deploy/cloudrun/gcloud.sh builds submit --config=cloudbuild.validate.yaml .
```

The fast Cloud Build gate installs dependencies, runs `npm run ci:cloudbuild:fast`, and fails before any release publish step.

## 5. Build, Publish, And Deploy The Release Image

```bash
deploy/cloudrun/gcloud.sh builds submit \
  --config=cloudbuild.release.yaml \
  --substitutions=SHORT_SHA="$(git rev-parse --short HEAD)",BRANCH_NAME=main,_LOCATION=europe-west1,_REPOSITORY=paperparser,_IMAGE=paperparser,_SERVICE=paperparser,_RUNTIME_SERVICE_ACCOUNT=paperparser-runtime@paperparser-492322.iam.gserviceaccount.com,_BUILD_SERVICE_ACCOUNT=paperparser-cloudbuild@paperparser-492322.iam.gserviceaccount.com,_STORE_BUCKET=paperparser-store-paperparser-492322 .
```

The release Cloud Build config runs `npm run ci:cloudbuild:release`, enforces mainline-only image publishing, tags the image with `$SHORT_SHA`, pushes it to Artifact Registry, resolves `cloudrun-image.json`, deploys from the exact digest-backed image via `deploy/cloudrun/deploy-from-image-ref.sh`, emits `cloudrun-release.json` with the deployed revision and image identity, and then blocks on `deploy/cloudrun/live-smoke.sh`.

You can resolve the published digest again later from the repo-owned helper:

```bash
export PAPERPARSER_IMAGE_TAG="$(git rev-parse --short HEAD)"
deploy/cloudrun/resolve-image-digest.sh
```

Use the returned `imageRef` value for later deploy steps instead of rebuilding or relying on a floating tag.

If you prefer hosted automation over manual submission, push the validated commit to GitHub `main`. The synced Cloud Build trigger runs the same `cloudbuild.release.yaml` contract automatically.

## 6. Hosted Release Smoke Artifact

Every hosted release writes:

- `cloudrun-image.json` for the immutable Artifact Registry digest
- `cloudrun-release.json` for the deployed revision and image identity
- `cloudrun-smoke.json` for the blocking authenticated live smoke proof

The hosted smoke step runs `deploy/cloudrun/live-smoke.sh` after deploy, verifies `/health`, `/ready`, and `/api/papers` against the authenticated Cloud Run URL, and fails the release if any of those checks fail.

## 7. Deploy Manually From A Resolved Digest

```bash
deploy/cloudrun/deploy.sh
```

Required variables before deploy:

- `PAPERPARSER_PROJECT`
- `PAPERPARSER_SERVICE`
- `PAPERPARSER_IMAGE`
- `PAPERPARSER_REGION`
- `PAPERPARSER_RUNTIME_SERVICE_ACCOUNT`
- `PAPERPARSER_STORE_BUCKET`

Manual deploy remains available for recovery or controlled roll-forward, but the supported hosted path is now GitHub `main` -> Cloud Build -> Cloud Run.

## 8. Grant Invoker Access

```bash
PAPERPARSER_MEMBER='user:alice@example.com' deploy/cloudrun/grant-invoker.sh
```

Repeat for each named user or service account that should access the service.

## 9. Fetch Service Metadata

```bash
deploy/cloudrun/service-metadata.sh
```

The helper returns the deployed service name, canonical service URL, latest ready revision, and runtime service account.

The hosted release path also writes `cloudrun-release.json` through `deploy/cloudrun/release-metadata.sh`, which combines the exact image digest with the deployed revision for later smoke and rollback steps.

## 10. Verify

Fetch the authenticated service URL and identity token:

```bash
SERVICE_URL="$(deploy/cloudrun/service-metadata.sh | node -e "let data=''; process.stdin.on('data', (chunk) => data += chunk); process.stdin.on('end', () => console.log(JSON.parse(data).status.url));")"
TOKEN="$(deploy/cloudrun/gcloud.sh auth print-identity-token)"
echo "$SERVICE_URL"
```

Then verify:

- open the authenticated service URL in a browser
- `curl -H "Authorization: Bearer $TOKEN" "$SERVICE_URL/health"`
- `curl -H "Authorization: Bearer $TOKEN" "$SERVICE_URL/ready"`
- `curl -H "Authorization: Bearer $TOKEN" "$SERVICE_URL/api/papers"`
- confirm `cloudrun-smoke.json` captured the deployed `serviceUrl`, `currentRevision`, `imageRef`, and rollback guidance

Use `/health` and `/ready` for Cloud Run probes and live smoke. The app still serves `/healthz` and `/readyz` locally for backward compatibility, but Cloud Run-facing operator checks should avoid `*z` probe paths.

## 11. Upgrade

Re-run the release Cloud Build config so the heavier gate passes and a new immutable image is published. Then set `PAPERPARSER_IMAGE` to the returned digest-backed `imageRef` and rerun:

```bash
deploy/cloudrun/deploy.sh
```

Cloud Run will create a new revision.

## 12. Roll Back

List revisions:

```bash
deploy/cloudrun/gcloud.sh run revisions list --project "$PAPERPARSER_PROJECT" --service "$PAPERPARSER_SERVICE" --region "$PAPERPARSER_REGION"
```

Route all traffic back to a prior revision:

```bash
PAPERPARSER_REVISION='paperparser-00012-abc' deploy/cloudrun/rollback.sh
```

When hosted smoke fails, use the `previousRevision` and `rollbackCommand` fields from `cloudrun-smoke.json` directly instead of guessing from the console.

## 13. Failure Recovery

- smoke fails after deploy:
  rerun `deploy/cloudrun/live-smoke.sh` locally against the same service to confirm whether the failure is reproducible
- smoke confirms the bad revision:
  execute the `rollbackCommand` emitted in `cloudrun-smoke.json`
- after rollback:
  run `deploy/cloudrun/service-metadata.sh` and authenticated `curl` checks on `/health`, `/ready`, and `/api/papers`
- before redeploying:
  fix the pipeline or app issue on `main`, then let the hosted trigger produce a new immutable image and revision

## Operational Limits

- The mounted bucket uses Cloud Storage FUSE semantics, not a local POSIX disk.
- Do not assume file locking or high-write multi-instance coordination.
- Treat this as a low-concurrency persistence bridge for the current filesystem-backed store.
