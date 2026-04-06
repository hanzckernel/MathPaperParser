# Phase 24 Plan 01 Summary

## Outcome

Phase 24 is complete. The repo now ships a checked-in Cloud Build validation and image-release contract for the supported Cloud Run path, with separate fast and release gates, mainline-only publishing, commit-SHA tags, and digest-backed image identity for downstream deploy steps.

## Delivered

- Added `cloudbuild.validate.yaml` as the fast Cloud Build validation contract.
- Added `cloudbuild.release.yaml` as the heavier release gate and immutable image-publish contract.
- Added `deploy/cloudrun/assert-mainline.sh` to block release publishing outside the configured main branch.
- Added `deploy/cloudrun/resolve-image-digest.sh` to surface the pushed Artifact Registry digest as the canonical deployment identity.
- Added `npm run ci:cloudbuild:fast` and `npm run ci:cloudbuild:release` to make the pipeline gates explicit and runnable locally.
- Tightened `.gcloudignore` to exclude local generated runtime state such as `packages/web/public/` from Cloud Build uploads.
- Updated Cloud Run operator docs, smoke docs, the root README, and deployment-readiness notes to use the Cloud Build pipeline contract and digest handoff path.

## Contract Decisions Now Enforced

- Cloud Build is the checked-in pipeline source of truth for this phase.
- Validation is split:
  - `ci:cloudbuild:fast` for a quicker deployment-contract gate
  - `ci:cloudbuild:release` for the heavier release gate
- Release publishing is restricted to the configured main branch.
- Published images use commit-SHA tags and downstream deploy steps must consume the resolved digest-backed `imageRef`.
- Local generated sample or runtime artifacts are excluded from release inputs rather than silently uploaded.

## Verification

Local verification passed:

- `npm test -- packages/cli/test/cloud-build-pipeline-contract.test.ts`
- `npm run ci:cloudbuild:fast`
- `npm run ci:cloudbuild:release`
- `npm test -- packages/cli/test/cloud-build-pipeline-contract.test.ts packages/cli/test/cloud-run-runbook-contract.test.ts packages/cli/test/cloud-run-bootstrap-contract.test.ts`

The release gate itself also re-ran:

- `npm run typecheck`
- `npm run test:acceptance:v1.4`

## Follow-On For Phase 25

- Connect the checked-in Cloud Build release contract to the hosted source of truth.
- Replace manual/operator auth assumptions with the bounded secretless CI/CD auth path.
- Reuse the digest-backed image identity from Phase 24 instead of inventing a second deploy artifact contract.
