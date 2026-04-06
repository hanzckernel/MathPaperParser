# Cloud Run Operator Runbook

## Supported `v1.5` Phase 23 Topology

- one long-lived Cloud Run service
- direct authenticated Cloud Run URL
- Cloud Storage bucket mounted at `/var/paperparser/store`
- explicit `roles/run.invoker` grants for named principals only
- repo-owned bootstrap, build, deploy, and metadata helpers

The first live deployment was verified on **April 6, 2026** against:

- project: `paperparser-492322`
- region: `europe-west1`
- service: `paperparser`
- Artifact Registry repository: `paperparser`
- store bucket: `paperparser-store-paperparser-492322`

## Prerequisites

- `gcloud` authenticated for the target project
- Cloud Run, Artifact Registry, Cloud Build, and Cloud Storage APIs available in the project
- permission to create or verify the runtime service account, Artifact Registry repository, and mounted store bucket

## 1. Bootstrap Or Verify GCP Resources

```bash
export PAPERPARSER_PROJECT=paperparser-492322
export PAPERPARSER_REGION=europe-west1
export PAPERPARSER_SERVICE=paperparser
export PAPERPARSER_ARTIFACT_REPOSITORY=paperparser
export PAPERPARSER_RUNTIME_SERVICE_ACCOUNT=paperparser-runtime@paperparser-492322.iam.gserviceaccount.com
export PAPERPARSER_STORE_BUCKET=paperparser-store-paperparser-492322

deploy/cloudrun/bootstrap.sh
```

The helper enables required APIs, creates missing resources where practical, ensures the runtime service account can write to the mounted bucket, and prints the canonical environment values for the deploy path.

## 2. Build And Publish The Image

```bash
export PAPERPARSER_IMAGE_TAG="$(git rev-parse --short HEAD)"
export PAPERPARSER_IMAGE="$(deploy/cloudrun/build-image.sh)"
echo "$PAPERPARSER_IMAGE"
```

The build helper uses Cloud Build and pushes the immutable image to Artifact Registry.

## 3. Deploy

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

## 4. Grant Invoker Access

```bash
PAPERPARSER_MEMBER='user:alice@example.com' deploy/cloudrun/grant-invoker.sh
```

Repeat for each named user or service account that should access the service.

## 5. Fetch Service Metadata

```bash
deploy/cloudrun/service-metadata.sh
```

The helper returns the deployed service name, canonical service URL, latest ready revision, and runtime service account.

## 6. Verify

Fetch the authenticated service URL and identity token:

```bash
SERVICE_URL="$(deploy/cloudrun/service-metadata.sh | node -e "let data=''; process.stdin.on('data', (chunk) => data += chunk); process.stdin.on('end', () => console.log(JSON.parse(data).status.url));")"
TOKEN="$(gcloud auth print-identity-token)"
echo "$SERVICE_URL"
```

Then verify:

- open the authenticated service URL in a browser
- `curl -H "Authorization: Bearer $TOKEN" "$SERVICE_URL/health"`
- `curl -H "Authorization: Bearer $TOKEN" "$SERVICE_URL/ready"`
- upload a small paper through the dashboard or API and confirm data appears in the mounted store

Use `/health` and `/ready` for Cloud Run probes and live smoke. The app still serves `/healthz` and `/readyz` locally for backward compatibility, but Cloud Run-facing operator checks should avoid `*z` probe paths.

## 7. Upgrade

Build and publish a new image, update `PAPERPARSER_IMAGE`, then rerun:

```bash
deploy/cloudrun/deploy.sh
```

Cloud Run will create a new revision.

## 8. Roll Back

List revisions:

```bash
gcloud run revisions list --project "$PAPERPARSER_PROJECT" --service "$PAPERPARSER_SERVICE" --region "$PAPERPARSER_REGION"
```

Route all traffic back to a prior revision:

```bash
PAPERPARSER_REVISION='paperparser-00012-abc' deploy/cloudrun/rollback.sh
```

## Operational Limits

- The mounted bucket uses Cloud Storage FUSE semantics, not a local POSIX disk.
- Do not assume file locking or high-write multi-instance coordination.
- Treat this as a low-concurrency persistence bridge for the current filesystem-backed store.
