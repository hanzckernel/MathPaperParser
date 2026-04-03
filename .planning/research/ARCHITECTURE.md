# Architecture Research: PaperParser v1.4

**Milestone:** `v1.4 GCP Cloud Run Deployment Hardening`
**Status:** Complete
**Date:** 2026-04-04
**Confidence:** HIGH

## Existing Architecture to Reuse

- The CLI server already exposes the paper APIs from `packages/cli/src/server.ts`
- The React dashboard already builds as static assets in `packages/web`
- The dashboard already supports API mode through `?api=...`
- The current persistent store is file-backed under `.paperparser-data/`
- The current deployment-readiness doc already enumerates the concrete blockers

## Recommended Integration Shape

### 1. One deployed runtime, not split web and API by default

Recommended shape:
- Build the React dashboard as static assets
- Serve those assets from the same Node runtime that exposes `/api/*`
- Keep browser traffic same-origin by default

Why:
- The repo currently has no supported CORS deployment contract
- Same-origin avoids inventing a second deployment problem while the service is still being hardened

### 2. Deploy through Cloud Run as a containerized service

Recommended shape:
- Multi-stage Docker build from the monorepo
- Final image runs the Node server and serves both static web assets and API routes
- Container listens on the Cloud Run `PORT`

Why:
- Cloud Run expects an HTTP container
- A committed container artifact is a stronger repo-level contract than ad hoc manual deployment

### 3. Bounded persistence bridge for the current store

Recommended shape:
- Keep the current store-path contract in application code
- Mount a Cloud Storage bucket into the container as the deployed store path
- Treat this as a bounded compatibility bridge, not a permanent local-disk abstraction

Why:
- It minimizes milestone churn versus a full persistence redesign
- It supports the current file-backed bundle layout with explicit operational constraints

### 4. Access and ingress boundary

Recommended shape:
- Keep the service authenticated by default
- If shared browser access is needed, use a deliberate ingress model rather than direct public exposure
- Favor an external Application Load Balancer when you need load-balancer features such as IAP or future Cloud Armor controls

Why:
- The repo has no product-level auth yet
- The current API cannot safely be treated as a public anonymous internet API

### 5. Operability boundary

Add:
- `/healthz`
- `/readyz`
- structured logs to stdout/stderr
- explicit request and upload limits

Do not treat:
- Cloud Run deployment success
as equivalent to
- application readiness for real traffic

## Suggested Build Order

1. Harden the current server surface for deployed mode
2. Add combined web/API serving and container packaging
3. Wire Cloud Run runtime config and persistence
4. Add ingress/access policy and operator docs
5. Add acceptance proof for the GCP deployment path

## Sources

- Local code:
  - `packages/cli/src/server.ts`
  - `packages/cli/src/index.ts`
  - `packages/web/src/App.tsx`
  - `packages/web/src/lib/data-source.ts`
- Local docs:
  - `docs/deployment_readiness.md`
  - `README.md`
- Official docs:
  - https://cloud.google.com/run/docs/quickstarts/build-and-deploy/deploy-nodejs-service
  - https://cloud.google.com/run/docs/securing/ingress
  - https://cloud.google.com/run/docs/configuring/services/cloud-storage-volume-mounts
