# Deployment Readiness

## Verdict

As of **April 4, 2026**, PaperParser v2 alpha is ready for:

- local development
- internal demos
- static dashboard exports
- controlled self-hosting on trusted networks
- repo-defined Cloud Run packaging trials on trusted GCP projects

It is **not ready for internet-facing production deployment**.

## What Was Verified

The following commands were run successfully on March 11, 2026:

```bash
npm run build
npm test
npm run typecheck
```

The test suite currently covers the core ingestion pipeline, CLI commands, API handlers, React data loading, export flow, and MCP server.

## Why It Is Not Production-Ready Yet

### 1. Upload handling still needs production-grade throttling

The deployed server now enforces explicit request and upload size limits, but it still buffers request bodies in memory before turning them into a `Request`, and it does not yet implement rate limiting or concurrent-upload controls.

Relevant implementation:

- `packages/cli/src/server.ts`
  - `readBody(...)`
  - `toWebRequest(...)`
  - `persistUploadedFile(...)`

The repo now documents and enforces maximum request and upload sizes, but it still lacks:

- concurrent uploads
- rate limiting
- streaming upload handling

That is a denial-of-service risk in production.

### 2. The shared deployment path is now authenticated, but only for explicitly granted Cloud Run invokers

The repo now ships a shared-deployment access path that keeps Cloud Run IAM authentication enabled and requires explicit `roles/run.invoker` grants. That closes the previous "anonymous open by default" gap for the supported Cloud Run path.

Repo-owned artifacts:

- `deploy/cloudrun/deploy.sh`
- `deploy/cloudrun/grant-invoker.sh`
- `deploy/cloudrun/README.md`

This phase intentionally supports one bounded access model only:

- direct authenticated Cloud Run service access
- named users or service accounts with `roles/run.invoker`

It still does **not** provide broader app-level multi-tenant auth, public anonymous access, or load-balancer/IAP fronting.

### 3. Persistence and operator runbook are still incomplete

The repo now ships:

- `/healthz`
- `/readyz`
- structured request logging
- a root `Dockerfile`
- a combined same-origin web/API deployment path

What is still missing for a supported internet-facing deployment:

- the supported GCP persistence story for the store path
- operator docs for deploy, upgrade, rollback, backups, and log collection
- CI for the v2 monorepo deployment path

### 4. PDF is still a beta target, not a shipped alpha feature

The v2 pipeline recognizes `.pdf` inputs but throws an explicit "not implemented in alpha yet" error. The UI keeps PDF visible to signal planned beta work, not production availability.

## Minimum Release Checklist

Before calling the API stack production-ready, the repo should have all of the following:

1. Keep deployed mode free of arbitrary remote `inputPath` reads and retain explicit request/upload limits.
2. Add rate limiting, concurrent-upload controls, and safer streaming upload handling.
3. Publish the supported GCP persistence and store-path strategy.
4. Add CI that runs `build`, `test`, and `typecheck` on every change.
5. Publish an operator runbook covering deploy, upgrades, rollback, persistence, backups, and log collection.

## Practical Recommendation

Use PaperParser v2 alpha in one of these ways today:

- local CLI plus local dashboard export
- localhost API for personal use
- internal trusted-network demo behind a reverse proxy or a tightly controlled Cloud Run deployment

For the hardened local dashboard/export path introduced in milestone `v1.2`, use:

```bash
npm run test:acceptance:v1.2
npm run typecheck
```

Static exports should be served over HTTP, for example:

```bash
cd out/paperparser-site
python3 -m http.server 8000
```

Do not expose the current `serve` process directly to the public internet without the remaining auth/access and persistence hardening work.
