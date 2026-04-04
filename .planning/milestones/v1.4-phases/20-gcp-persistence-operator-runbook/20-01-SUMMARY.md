---
phase: 20-gcp-persistence-operator-runbook
plan: "01"
requirements-completed:
  - STORE-01
  - OPS-02
duration: 23min
completed: 2026-04-04
---

# Phase 20 Summary

Phase 20 made the Cloud Run path operable. The deploy helper now mounts a dedicated Cloud Storage bucket into `/var/paperparser/store`, the repo ships a rollback helper, and the operator runbook covers the supported workflow from image build/push through rollback.

## Delivered

- Extended `deploy/cloudrun/deploy.sh` with the supported bucket mount contract.
- Added `deploy/cloudrun/rollback.sh` for deterministic revision rollback.
- Added `deploy/cloudrun/RUNBOOK.md` covering build/push, bucket creation, service-account bucket access, deploy, invoker grants, verify, upgrade, and rollback.
- Updated the deployment docs to describe the Cloud Storage FUSE bridge and its low-concurrency limitations explicitly.
- Added mocked contract tests for the bucket mount and rollback helper.

## Verification

- `PATH=/opt/homebrew/bin:$PATH npm test -- packages/cli/test/cloud-run-runbook-contract.test.ts packages/cli/test/cloud-run-security-contract.test.ts`
- `PATH=/opt/homebrew/bin:$PATH npm run typecheck`

## Follow-on Constraints

- Phase 21 must publish the named Cloud Run smoke proof for the now-packaged, secured, and mounted deployment path.
- The mounted bucket remains a bridge for the current store contract, not a general high-write storage design.
