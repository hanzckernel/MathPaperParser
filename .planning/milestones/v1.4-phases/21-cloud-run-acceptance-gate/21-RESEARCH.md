# Phase 21 Research: Cloud Run Acceptance Gate

**Date:** 2026-04-04
**Status:** Complete

## Goal

Package the Cloud Run milestone into one named proof command and one repo-visible smoke workflow note.

## Existing Proof Pieces

- `packages/cli/test/serve-app.test.ts`
  - deployed runtime boundary, request limits, health/readiness, same server path
- `packages/web/test/bundle-data.test.ts`
  - deployed same-origin runtime-config source resolution
- `packages/cli/test/cloud-run-artifact.test.ts`
  - Docker artifact contract
- `packages/cli/test/cloud-run-security-contract.test.ts`
  - authenticated deploy/access model
- `packages/cli/test/cloud-run-runbook-contract.test.ts`
  - mounted-bucket persistence bridge and rollback helper

## Recommended Phase-21 Shape

### 1. Publish one named acceptance command

Recommended command:
- `npm run test:acceptance:v1.4`

Recommended contents:
- the five focused deployment tests above

### 2. Publish one smoke note for operators

Recommended doc:
- `deploy/cloudrun/SMOKE.md`

Recommended content:
- run `npm run test:acceptance:v1.4`
- run `npm run typecheck`
- on a real project, follow the live verification checks from the runbook

### 3. Update top-level docs to point at the named proof

Recommended touch points:
- `README.md`
- `docs/deployment_readiness.md`

## Verification Direction

- `npm run test:acceptance:v1.4`
- `npm run typecheck`

## Out of Scope for This Phase

- live Cloud Run provisioning
- CI automation

---

*Phase: 21-cloud-run-acceptance-gate*
*Research completed: 2026-04-04*
