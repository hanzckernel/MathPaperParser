# Cloud Run Operator Runbook

## Supported v1.4 Topology

- one Cloud Run service
- direct authenticated Cloud Run URL
- Cloud Storage bucket mounted at `/var/paperparser/store`
- explicit `roles/run.invoker` grants for named principals only

## Prerequisites

- Cloud Run, Artifact Registry, and Cloud Storage APIs enabled
- a runtime service account for the Cloud Run service
- Docker authenticated to Artifact Registry

## 1. Build And Push The Image

```bash
export PAPERPARSER_IMAGE="REGION-docker.pkg.dev/PROJECT_ID/REPOSITORY/paperparser:$(git rev-parse --short HEAD)"
docker build -t "$PAPERPARSER_IMAGE" .
docker push "$PAPERPARSER_IMAGE"
```

## 2. Create The Store Bucket

```bash
export PAPERPARSER_STORE_BUCKET="paperparser-store-PROJECT_ID"
gcloud storage buckets create "gs://$PAPERPARSER_STORE_BUCKET" \
  --location="$PAPERPARSER_REGION" \
  --uniform-bucket-level-access
```

Grant the runtime service account write access:

```bash
gcloud storage buckets add-iam-policy-binding "gs://$PAPERPARSER_STORE_BUCKET" \
  --member="serviceAccount:$PAPERPARSER_RUNTIME_SERVICE_ACCOUNT" \
  --role="roles/storage.objectUser"
```

## 3. Deploy

```bash
deploy/cloudrun/deploy.sh
```

Required variables before deploy:

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

## 5. Verify

```bash
SERVICE_URL="$(gcloud run services describe "$PAPERPARSER_SERVICE" --region "$PAPERPARSER_REGION" --format='value(status.url)')"
echo "$SERVICE_URL"
```

Then verify:

- open the authenticated service URL in a browser
- `curl "$SERVICE_URL/healthz"`
- `curl "$SERVICE_URL/readyz"`
- upload a small paper through the dashboard or API and confirm data appears in the mounted store

## 6. Upgrade

Build and push a new image, update `PAPERPARSER_IMAGE`, then rerun:

```bash
deploy/cloudrun/deploy.sh
```

Cloud Run will create a new revision.

## 7. Roll Back

List revisions:

```bash
gcloud run revisions list --service "$PAPERPARSER_SERVICE" --region "$PAPERPARSER_REGION"
```

Route all traffic back to a prior revision:

```bash
PAPERPARSER_REVISION='paperparser-00012-abc' deploy/cloudrun/rollback.sh
```

## Operational Limits

- The mounted bucket uses Cloud Storage FUSE semantics, not a local POSIX disk.
- Do not assume file locking or high-write multi-instance coordination.
- Treat this as a low-concurrency persistence bridge for the current filesystem-backed store.
