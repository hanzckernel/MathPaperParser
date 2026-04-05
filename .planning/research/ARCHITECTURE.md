# Architecture Research: PaperParser v1.5

**Milestone:** `v1.5 GCP Deployment & CI/CD`
**Status:** Complete
**Date:** 2026-04-05
**Confidence:** HIGH

## Existing Architecture to Reuse

- `deploy/cloudrun/deploy.sh` already defines the supported Cloud Run runtime contract
- `deploy/cloudrun/grant-invoker.sh` already defines the supported shared-access model
- `deploy/cloudrun/rollback.sh` already defines the rollback primitive
- `deploy/cloudrun/RUNBOOK.md` already names the required GCP resources
- `npm run test:acceptance:v1.4` already proves the local deployment contract

## Recommended Integration Shape

### 1. Keep one deployment contract

Recommended shape:
- CI/CD must deploy the same image and Cloud Run flags already encoded by the repo-owned deploy path
- automation may wrap the existing scripts or re-express them declaratively, but must not drift in behavior

Why:
- `v1.4` already shipped the supported deployment contract
- `v1.5` should operationalize it, not fork it

### 2. Separate bootstrap from repeat deploy

Recommended shape:
- one bootstrap layer for project resources and IAM wiring
- one repeatable deploy layer for image publish and service rollout

Why:
- first-time GCP setup and repeat deploys have different failure modes
- the milestone needs both a “first live deploy” path and a durable CI/CD path

### 3. Secretless pipeline auth

Recommended shape:
- pipeline principal authenticates through Workload Identity Federation when a hosted workflow engine is used
- permissions are scoped to image publish, deploy, and read-back verification

Why:
- the milestone is adding hosted automation
- long-lived credential export would regress the security posture

### 4. Source integration is a first-class concern

Recommended shape:
- explicitly define how source changes trigger CI/CD
- if the repo host is not yet configured, treat that setup as milestone scope rather than an external assumption

Why:
- the local repo currently has no git remote
- “full CI/CD” is not real if no source system can trigger it

### 5. Live verification remains separate from local proof

Recommended shape:
- keep `npm run test:acceptance:v1.4` or its successor as the local contract proof
- add a live smoke path that validates the deployed URL, health/readiness, and one real request path

Why:
- local contract proof and live environment proof catch different regressions

## Suggested Build Order

1. Lock the supported GCP bootstrap inputs and first-live-deploy procedure
2. Add CI validation and image publishing
3. Add automated Cloud Run rollout with secretless auth
4. Add live smoke and rollback-aware release proof
5. Align operator docs with the automated path

## Sources

- Local code/docs:
  - `deploy/cloudrun/deploy.sh`
  - `deploy/cloudrun/grant-invoker.sh`
  - `deploy/cloudrun/rollback.sh`
  - `deploy/cloudrun/RUNBOOK.md`
  - `deploy/cloudrun/SMOKE.md`
  - `package.json`
- Official docs:
  - https://cloud.google.com/build/docs/deploying-builds/deploy-cloud-run
  - https://docs.cloud.google.com/build/docs/automating-builds/create-manage-triggers
  - https://cloud.google.com/deploy/docs/deploy-app-run
  - https://github.com/google-github-actions/auth
  - https://github.com/google-github-actions/deploy-cloudrun
