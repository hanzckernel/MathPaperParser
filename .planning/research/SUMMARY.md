# Research Summary: PaperParser v1.4

**Milestone:** `v1.4 GCP Cloud Run Deployment Hardening`
**Status:** Complete
**Date:** 2026-04-04
**Confidence:** HIGH

## Executive Summary

PaperParser’s next milestone should not treat “deploy to GCP” as a packaging-only task. The repo’s own deployment-readiness note already identifies concrete blockers: remote filesystem-path ingestion, unbounded uploads, missing health/readiness endpoints, no supported same-origin web/API topology, and no versioned deployment artifact. Research against the latest official Google Cloud documentation confirms that Cloud Run is a good target, but only if the app is hardened around Cloud Run’s real operating model rather than local-machine assumptions.

The recommended approach is a **combined web/API Cloud Run service** deployed from a **versioned container image in Artifact Registry**, with **same-origin browser traffic by default**, **bounded persistence via a Cloud Storage volume mount**, and **explicit access/ingress controls** rather than direct public exposure of the current API. That gives the repo one supported GCP path without prematurely redesigning every storage and auth layer in the same milestone.

## Key Findings

### Recommended Stack

- Cloud Run service as the first supported shared deployment target
- Artifact Registry for image storage
- Checked-in Dockerfile as the supported packaging artifact
- Combined Node runtime serving both static dashboard assets and `/api/*`
- Cloud Storage volume mount as the bounded bridge for the current file-backed store
- Cloud Logging through stdout/stderr with structured JSON logs

### Feature Table Stakes

- Supported Cloud Run deployment artifact and deploy workflow
- Same-origin web/API serving model
- Removal or restriction of unsafe deployed ingestion paths
- Request/upload limits plus health/readiness endpoints
- GCP runbook for deploy, config, persistence, upgrades, and rollback
- Acceptance proof that the Cloud Run path is reproducible

### Watch Out For

1. Do not deploy the current localhost-first API surface unchanged.
2. Do not split origins by default and then hope CORS sorts itself out.
3. Do not treat a mounted Cloud Storage bucket like normal local disk.
4. Do not leave ingress/public endpoint behavior implicit.
5. Do not stop at “container runs” without operator and acceptance proof.

## Recommended Planning Shape

Natural phase split:
1. **Server Deployment Boundary Hardening**
   - remove unsafe remote path analysis in deployed mode
   - add request/upload limits
   - add health/readiness and structured logs
2. **Cloud Run Packaging and Topology**
   - build combined web/API container
   - serve static dashboard assets from the deployed runtime
   - define ingress/access strategy for Cloud Run
3. **Persistence, Runbook, and Acceptance**
   - wire the store path to a bounded GCP persistence strategy
   - document rollout/rollback/operator steps
   - prove the Cloud Run target end to end

## Best Next Step for Requirements

Define requirement categories as:
- Deployment Packaging
- Topology and Access
- API Safety
- Persistence and Operability
- Reliability / Acceptance

## Sources

### Primary

- https://cloud.google.com/run/docs/quickstarts/build-and-deploy/deploy-nodejs-service
- https://cloud.google.com/run/docs/deploying-source-code
- https://cloud.google.com/artifact-registry/docs/docker/pushing-and-pulling
- https://cloud.google.com/run/docs/configuring/healthchecks
- https://cloud.google.com/run/docs/configuring/request-timeout
- https://cloud.google.com/run/docs/configuring/services/cloud-storage-volume-mounts
- https://cloud.google.com/run/docs/securing/ingress
- https://cloud.google.com/run/docs/authenticating/overview
- https://cloud.google.com/run/docs/logging

### Local

- `docs/deployment_readiness.md`
- `packages/cli/src/server.ts`
- `packages/cli/src/index.ts`
- `packages/web/src/App.tsx`

---
*Research completed: 2026-04-04*
*Ready for requirements: yes*
