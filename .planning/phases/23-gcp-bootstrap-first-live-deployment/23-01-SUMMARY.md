# Phase 23 Plan 01 Summary

## Outcome

Phase 23 is complete. The repo now owns the bootstrap, image build, deploy, and service-metadata path for the long-lived PaperParser Cloud Run service, and that path was executed successfully against the real GCP environment.

## Delivered

- Added `.gcloudignore` so Cloud Build uploads the bounded repo surface instead of ignored local artifacts.
- Added `deploy/cloudrun/bootstrap.sh` to enable required APIs, verify or create the Artifact Registry repository, runtime service account, and mounted store bucket, and print the canonical deploy variables.
- Added `deploy/cloudrun/build-image.sh` to publish the image through Cloud Build to Artifact Registry.
- Added `deploy/cloudrun/service-metadata.sh` to return the deployed service name, canonical service URL, latest ready revision, and runtime service account.
- Hardened `deploy/cloudrun/deploy.sh` so project-scoped deploys work cleanly under `set -u`.
- Fixed the CLI entrypoint in `packages/cli/src/index.ts` so long-running `serve` and `mcp` commands do not exit immediately in deployed environments.
- Added hosted probe-safe `/health` and `/ready` aliases in `packages/cli/src/server.ts` while preserving `/healthz` and `/readyz` compatibility routes.
- Updated the Cloud Run runbook, shared-access notes, smoke proof, root README, and deployment-readiness notes to match the real hosted path.

## Live GCP Evidence

Environment:

- project: `paperparser-492322`
- region: `europe-west1`
- service: `paperparser`
- repository: `paperparser`
- bucket: `paperparser-store-paperparser-492322`

Final published image:

- tag: `phase23-probesafe`
- digest: `sha256:7ab7185adbdd2b13f5c486ad7a4229565a2f49dea4e10372869052030e2dfac5`
- Cloud Build: `2d835934-2ccc-4123-bb88-4fabaced64b9`

Live service after deploy:

- latest ready revision: `paperparser-00007-8fn`
- canonical service URL: `https://paperparser-ilk6eypuhq-ew.a.run.app`
- direct run URL observed during deploy: `https://paperparser-652654562529.europe-west1.run.app`

Authenticated live verification:

- `GET /health` returned `{ "ok": true }`
- `GET /ready` returned `{ "ok": true, "storePath": "/var/paperparser/store", "runtimeMode": "deployed" }`
- `GET /api/papers` returned an empty but valid mounted-store listing

## Root-Cause Fixes Discovered During Execution

- The first live deploy exposed a real production bug in `packages/cli/src/index.ts`: `process.exit(runCli(...))` terminated long-running `serve` and `mcp` processes immediately after startup. That is now fixed and covered by `packages/cli/test/cli-entrypoint.test.ts`.
- The live Cloud Run front end did not behave reliably for `/healthz`, so the hosted operator contract now uses `/health` and `/ready` for smoke and runbook checks while preserving the old aliases in-process for compatibility.

## Verification

Local verification:

- `npm test -- packages/cli/test/cloud-run-bootstrap-contract.test.ts packages/cli/test/cloud-run-runbook-contract.test.ts packages/cli/test/cloud-run-security-contract.test.ts packages/cli/test/cli-entrypoint.test.ts packages/cli/test/serve-app.test.ts`
- `npm run test:acceptance:v1.4`
- `npm run typecheck`

Live verification:

- `deploy/cloudrun/bootstrap.sh`
- `deploy/cloudrun/build-image.sh`
- `deploy/cloudrun/deploy.sh`
- `deploy/cloudrun/service-metadata.sh`
- authenticated `curl` to `/health`, `/ready`, and `/api/papers`

## Follow-On For Phase 24

- Reuse the new bootstrap/build/deploy/metadata helpers as the stable base for Cloud Build CI validation and immutable image publishing.
- Keep the hosted probe contract on `/health` and `/ready` in all future smoke and CD automation.
