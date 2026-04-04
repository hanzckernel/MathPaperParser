# Phase 20 Research: GCP Persistence & Operator Runbook

**Date:** 2026-04-04
**Status:** Complete

## Goal

Turn the secured Cloud Run deployment path into a repeatable operator workflow with one supported persistence bridge for the current filesystem-backed store.

## Official Cloud Run Findings

### 1. Cloud Run can mount Cloud Storage buckets directly as volumes

From the official Cloud Run volume-mount docs and `gcloud run deploy` reference:
- a Cloud Storage bucket can be mounted into a Cloud Run service with `--add-volume ... type=cloud-storage,bucket=...`
- the mount is exposed at a normal container path with `--add-volume-mount`
- the service identity needs `roles/storage.objectUser` for write access

Implication for PaperParser:
- the current filesystem-backed store can stay intact for `v1.4`
- the supported store path can remain `/var/paperparser/store`
- the runtime service account must be documented clearly

### 2. Cloud Storage volume mounts use Cloud Storage FUSE semantics

From the official volume-mount and Cloud Storage FUSE docs:
- the mount uses Cloud Storage FUSE
- mount caching consumes container memory
- write/read consistency and filesystem semantics are not identical to a local POSIX disk

Implication for PaperParser:
- the runbook must call out low-concurrency expectations and the absence of file locking
- this is a bridge for the current store contract, not a high-write data-plane solution

### 3. Rollback is a standard Cloud Run traffic operation

From the official `gcloud run services update-traffic` docs:
- rollback to a revision is `gcloud run services update-traffic SERVICE --to-revisions=REVISION=100`

Implication for PaperParser:
- the runbook can provide a precise rollback command
- a small rollback helper script is reasonable and locally testable

## Recommended Phase-20 Shape

### 1. Extend the deploy helper to mount the store bucket

Recommended behavior:
- require `PAPERPARSER_STORE_BUCKET`
- add Cloud Storage volume and volume mount flags to the existing deploy helper

### 2. Add a rollback helper

Recommended behavior:
- `deploy/cloudrun/rollback.sh`
- require service, region, and revision name
- call `gcloud run services update-traffic ... --to-revisions=REVISION=100`

### 3. Publish a Cloud Run operator runbook

Recommended coverage:
- prerequisites and APIs
- build/push image
- create bucket
- grant bucket access to the runtime service account
- deploy
- grant invokers
- verify health/readiness and browser access
- upgrade and rollback

### 4. Prove the contract with mocked `gcloud`

Recommended tests:
- deploy helper mounts the bucket at `/var/paperparser/store`
- rollback helper uses `update-traffic --to-revisions=...=100`

## Suggested File Set

- `deploy/cloudrun/deploy.sh`
- `deploy/cloudrun/rollback.sh`
- `deploy/cloudrun/RUNBOOK.md`
- `deploy/cloudrun/README.md`
- `packages/cli/test/cloud-run-runbook-contract.test.ts`
- `README.md`
- `docs/deployment_readiness.md`

## Verification Direction

- mocked `gcloud` tests for deploy mount + rollback command
- `npm run typecheck`

## Out of Scope for This Phase

- changing the store implementation away from the filesystem contract
- live acceptance against a GCP project
- deeper load-balancer or custom-domain operations

---

*Phase: 20-gcp-persistence-operator-runbook*
*Research completed: 2026-04-04*
