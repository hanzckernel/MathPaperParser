---
verified: 2026-04-04T11:06:15Z
status: passed
score: 3/3 must-haves verified
---

# Phase 20 Verification: GCP Persistence & Operator Runbook

## Result

Phase 20 passes. The supported Cloud Run path now has one explicit persistence bridge, one repo-backed rollback helper, and one operator runbook that covers build/push through rollback.

## Verified Truths

### 1. The Cloud Run path now has one explicit persistence bridge

Evidence:
- `deploy/cloudrun/deploy.sh`
- `packages/cli/test/cloud-run-runbook-contract.test.ts`

What is true now:
- The deploy helper requires `PAPERPARSER_STORE_BUCKET`.
- The helper mounts that bucket into `/var/paperparser/store`.
- The existing filesystem-backed store contract remains intact for `v1.4`.

### 2. Operators now have a repo-visible rollback path

Evidence:
- `deploy/cloudrun/rollback.sh`
- `packages/cli/test/cloud-run-runbook-contract.test.ts`

What is true now:
- The repo contains a rollback helper built on `gcloud run services update-traffic`.
- The helper routes traffic back to one named revision deterministically.

### 3. The runbook covers the supported operator path and states the bridge limits

Evidence:
- `deploy/cloudrun/RUNBOOK.md`
- `deploy/cloudrun/README.md`
- `README.md`
- `docs/deployment_readiness.md`
- `PATH=/opt/homebrew/bin:$PATH npm test -- packages/cli/test/cloud-run-runbook-contract.test.ts packages/cli/test/cloud-run-security-contract.test.ts`
- `PATH=/opt/homebrew/bin:$PATH npm run typecheck`

What is true now:
- The repo documents build/push, bucket setup, runtime service-account access, deploy, invoker grants, verify, upgrade, and rollback.
- The docs explicitly call out Cloud Storage FUSE limitations and low-concurrency expectations.
- The operator path is locally re-proved and the repo stays typecheck-green.

## Remaining Deferred Work

- Phase 21 still needs an explicit end-to-end Cloud Run smoke proof.
- CI automation for the deployment path remains open.
- The mounted bucket remains a bridge, not a long-term high-write storage architecture.

---

*Phase: 20-gcp-persistence-operator-runbook*
*Verified: 2026-04-04*
