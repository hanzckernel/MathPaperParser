# Feature Research: PaperParser v1.5

**Milestone:** `v1.5 GCP Deployment & CI/CD`
**Status:** Complete
**Date:** 2026-04-05
**Confidence:** HIGH

## Category: Live GCP Deployment

### Table stakes

- first real deployment of the existing Cloud Run service shape
- explicit GCP project, region, Artifact Registry, runtime service account, and store bucket setup
- one reproducible repo-backed deploy path that operators can run without hidden local state

### Differentiators

- one bootstrap script or declarative setup path for first-time environment creation
- immutable image/version naming aligned with deploy and rollback history

### Anti-features

- “deployment support” that still stops at local smoke tests
- operator docs that assume the environment already exists

## Category: CI Validation

### Table stakes

- automated typecheck and acceptance coverage before deploy
- deterministic build step for the production image
- explicit failure behavior that blocks rollout on broken validation

### Differentiators

- split fast CI from slower release gates
- path filters or matrix strategy to keep validation cost reasonable

### Anti-features

- deploy-on-push without the existing acceptance bundle
- CI that only lints or typechecks but never proves the deploy contract

## Category: CD To Cloud Run

### Table stakes

- publish image to Artifact Registry
- deploy the exact published image to Cloud Run
- preserve the existing access, ingress, and mounted-store contract
- capture live service URL / revision info for smoke and rollback

### Differentiators

- traffic-safe deploy controls such as `no_traffic` or staged revision promotion where needed
- release metadata attached to deployed revisions

### Anti-features

- rebuilding different artifacts in deploy versus CI
- pipeline flags that drift from `deploy/cloudrun/deploy.sh`

## Category: Auth And Source Integration

### Table stakes

- secretless or otherwise explicitly bounded pipeline authentication
- documented repository/trigger integration for the chosen CI/CD engine
- minimal required IAM surface for build/deploy automation

### Differentiators

- Workload Identity Federation with repository-level claim restrictions
- environment separation between validation and deployment principals

### Anti-features

- copying service-account JSON keys into CI secrets by default
- leaving the source-host / trigger path implicit when the repo has no remote configured today

## Category: Release Proof And Operations

### Table stakes

- post-deploy smoke verification against the live service
- rollback path documented and preserved in automation
- release/operator guidance updated for the automated path

### Differentiators

- revision-aware smoke output that links build SHA to deployed revision
- separate smoke commands for local proof versus live environment proof

### Anti-features

- CI/CD that ends at “deploy succeeded” without live verification
- rollback that remains manual-only while deployment becomes automated

## Research Takeaway

The natural scope split is:
1. live GCP environment execution
2. validation/build/publish automation
3. deploy/smoke/rollback automation and docs

## Sources

- Official docs:
  - https://cloud.google.com/build/docs/deploying-builds/deploy-cloud-run
  - https://docs.cloud.google.com/build/docs/automating-builds/create-manage-triggers
  - https://cloud.google.com/deploy/docs/deploy-app-run
  - https://github.com/google-github-actions/auth
  - https://github.com/google-github-actions/deploy-cloudrun
- Local docs:
  - `deploy/cloudrun/README.md`
  - `deploy/cloudrun/RUNBOOK.md`
  - `deploy/cloudrun/SMOKE.md`
