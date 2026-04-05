# Research Summary: PaperParser v1.5

**Milestone:** `v1.5 GCP Deployment & CI/CD`
**Status:** Complete
**Date:** 2026-04-05
**Confidence:** HIGH

## Executive Summary

`v1.5` should not invent a second deployment shape. The repo already ships a supported Cloud Run contract from `v1.4`: one same-origin service, authenticated direct access, Artifact Registry images, and a mounted Cloud Storage persistence bridge. The next milestone should operationalize that exact path by executing the first live GCP deployment and then automating it through CI/CD.

The recommended delivery shape is:

- keep the existing **Artifact Registry -> Cloud Run** runtime contract
- execute the first live deployment through the checked-in `deploy/cloudrun/*.sh` path
- add **secretless CI/CD authentication** instead of long-lived service-account keys
- publish one checked-in automation path that validates, builds, publishes, deploys, and smoke-checks the same Cloud Run service
- treat source-control integration as an explicit part of the milestone, because the current repo has **no configured git remote**

For CI/CD, the research points to two viable patterns:

1. **Lean first-step recommendation:** a checked-in CI/CD pipeline using a hosted repo workflow plus Google-auth integration through **Workload Identity Federation**
2. **Heavier GCP-native promotion path:** Cloud Build triggers plus optional Cloud Deploy for staged promotions

For this repo, the first recommendation is the better `v1.5` target. It is narrower, aligns with the existing repo-owned scripts, and gets to a real deploy faster. Cloud Deploy is a valid follow-on when there are multiple environments or approval gates to manage.

## Key Findings

### Recommended Stack

- Existing multi-stage `Dockerfile`
- Artifact Registry for immutable image publishing
- Cloud Run as the single deployed runtime
- Existing mounted Cloud Storage bucket contract for the current store
- Secretless CI/CD auth via Workload Identity Federation rather than exported key JSON
- One checked-in automation path for test -> build -> publish -> deploy -> smoke

### Feature Table Stakes

- real GCP deployment executed from the repo-owned Cloud Run path
- repeatable GCP bootstrap for service account, Artifact Registry, bucket, and deploy configuration
- checked-in CI validation before deploy
- checked-in CD for image publish and Cloud Run rollout
- rollback and smoke verification integrated into the automated delivery story
- explicit source-host / trigger wiring instead of assuming CI exists somewhere outside the repo

### Watch Out For

1. Do not add CI/CD that deploys a different Cloud Run shape than the one `v1.4` documented.
2. Do not use long-lived service-account key JSON if Workload Identity Federation is possible.
3. Do not assume GitHub Actions, Cloud Build triggers, or any other source integration exists yet; the repo currently has no remote configured.
4. Do not let CI/CD reopen anonymous access or bypass the current access model through different deploy flags.
5. Do not treat “workflow succeeded” as enough without a smoke proof against the live service.

## Recommended Planning Shape

Natural phase split:
1. **Live GCP Environment Bootstrap**
   - define the supported project, registry, bucket, and service-account setup
   - make first live deployment reproducible from repo-owned scripts
2. **Release Pipeline Automation**
   - add CI validation and image publishing
   - add secretless GCP authentication for the pipeline
   - deploy the same Cloud Run service contract automatically
3. **Smoke, Rollback, And Operator Controls**
   - add post-deploy smoke coverage
   - keep rollback first-class
   - document the supported automated delivery path

## Best Next Step for Requirements

Define requirement categories as:
- GCP Environment
- Delivery Pipeline
- Deployment Safety
- Operability / Release Proof

## Sources

### Primary

- https://cloud.google.com/build/docs/deploying-builds/deploy-cloud-run
- https://docs.cloud.google.com/build/docs/automating-builds/create-manage-triggers
- https://cloud.google.com/deploy/docs/deploy-app-run
- https://cloud.google.com/artifact-registry/docs/docker/pushing-and-pulling
- https://github.com/google-github-actions/auth
- https://github.com/google-github-actions/deploy-cloudrun

### Local

- `deploy/cloudrun/deploy.sh`
- `deploy/cloudrun/README.md`
- `deploy/cloudrun/RUNBOOK.md`
- `deploy/cloudrun/SMOKE.md`
- `package.json`

---
*Research completed: 2026-04-05*
*Ready for requirements: yes*
