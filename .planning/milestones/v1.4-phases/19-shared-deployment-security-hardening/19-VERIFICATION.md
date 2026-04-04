---
verified: 2026-04-04T11:01:30Z
status: passed
score: 3/3 must-haves verified
---

# Phase 19 Verification: Shared Deployment Security Hardening

## Result

Phase 19 passes. The repo now codifies one authenticated shared Cloud Run deployment model: deploy with the Cloud Run Invoker IAM check still enabled, then grant `roles/run.invoker` only to named principals through a guarded helper.

## Verified Truths

### 1. The supported shared deployment path remains authenticated by default

Evidence:
- `deploy/cloudrun/deploy.sh`
- `packages/cli/test/cloud-run-security-contract.test.ts`

What is true now:
- The repo-owned deploy helper explicitly uses `--invoker-iam-check`.
- The secure deploy path does not opt into `--no-invoker-iam-check`.
- Ingress is explicit in the deploy helper rather than left implicit.

### 2. Repo-owned access helpers reject accidental public exposure

Evidence:
- `deploy/cloudrun/grant-invoker.sh`
- `packages/cli/test/cloud-run-security-contract.test.ts`

What is true now:
- The invoker helper grants only `roles/run.invoker`.
- The helper rejects `allUsers` and `allAuthenticatedUsers`.
- Named users or service accounts remain the supported access principals.

### 3. The docs and scripted contract now match

Evidence:
- `deploy/cloudrun/README.md`
- `README.md`
- `docs/deployment_readiness.md`
- `PATH=/opt/homebrew/bin:$PATH npm test -- packages/cli/test/cloud-run-security-contract.test.ts`
- `PATH=/opt/homebrew/bin:$PATH npm run typecheck`

What is true now:
- The supported shared deployment model is documented as direct authenticated Cloud Run access.
- The readiness doc no longer claims shared deployment auth is undefined.
- The contract is locally re-proved and the repo stays typecheck-green.

## Remaining Deferred Work

- GCP persistence and operator runbook depth remain Phase 20 work.
- End-to-end Cloud Run smoke proof remains Phase 21 work.
- Rate limiting and safer upload streaming are still open deployment-hardening work.

---

*Phase: 19-shared-deployment-security-hardening*
*Verified: 2026-04-04*
