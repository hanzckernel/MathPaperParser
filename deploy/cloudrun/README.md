# Cloud Run Shared Deployment Access

PaperParser supports one shared Cloud Run access model:

- deploy the repo-owned container artifact
- keep Cloud Run Invoker IAM checks enabled
- grant `roles/run.invoker` only to named users or service accounts
- use the direct authenticated Cloud Run service URL as the supported shared endpoint

Unsupported in this phase:

- `--no-invoker-iam-check`
- `allUsers` or `allAuthenticatedUsers` invoker grants
- public-by-default service exposure
- load balancers, IAP, custom domains, or disabled default URLs

The live Phase 23 deployment path is:

1. `deploy/cloudrun/bootstrap.sh`
2. `cloudbuild.validate.yaml`
3. `cloudbuild.release.yaml`
4. `deploy/cloudrun/deploy.sh`
5. `deploy/cloudrun/service-metadata.sh`

## Deploy

Required environment variables:

- `PAPERPARSER_PROJECT`
- `PAPERPARSER_SERVICE`
- `PAPERPARSER_IMAGE`
- `PAPERPARSER_REGION`
- `PAPERPARSER_RUNTIME_SERVICE_ACCOUNT`

Optional environment variables:

- `PAPERPARSER_STORE_BUCKET` required dedicated Cloud Storage bucket for the mounted store
- `PAPERPARSER_STORE_PATH` default `/var/paperparser/store`
- `PAPERPARSER_MEMORY` default `1Gi`
- `PAPERPARSER_CPU` default `1`
- `PAPERPARSER_MIN_INSTANCES` default `0`
- `PAPERPARSER_MAX_INSTANCES` default `3`

Deploy with authenticated access still enabled:

```bash
deploy/cloudrun/deploy.sh
```

The deploy helper mounts `PAPERPARSER_STORE_BUCKET` into `/var/paperparser/store`.
The runtime service account should have `roles/storage.objectUser` on that bucket.

The checked-in release pipeline is Cloud Build:

- `cloudbuild.validate.yaml` runs the faster validation gate through `npm run ci:cloudbuild:fast`
- `cloudbuild.release.yaml` runs the heavier release gate through `npm run ci:cloudbuild:release`, restricts image publishing to `main`, publishes a commit-SHA-tagged image, and surfaces the immutable digest through `deploy/cloudrun/resolve-image-digest.sh`

Deploys must consume the digest-backed `imageRef`, not rebuild from source or rely on a floating tag.

For live Cloud Run probes and smoke checks, use `/health` and `/ready`. The app still serves `/healthz` and `/readyz` internally for compatibility, but the supported Cloud Run operator path avoids `*z` probe paths.

## Grant Access

Grant `roles/run.invoker` to a named principal:

```bash
PAPERPARSER_MEMBER='user:alice@example.com' deploy/cloudrun/grant-invoker.sh
```

The helper rejects `allUsers` and `allAuthenticatedUsers`.

## Roll Back

Restore traffic to one revision:

```bash
PAPERPARSER_REVISION='paperparser-00012-abc' deploy/cloudrun/rollback.sh
```
