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

### 2. No authentication or authorization layer

All current API routes are open once the process is reachable:

- `GET /api/papers`
- `POST /api/papers`
- `GET /api/papers/:paperId/{manifest,graph,index,validate,query,context,impact}`

This is fine for localhost-only use. It is not enough for a shared or public deployment.

### 3. Shared-deployment access model is not locked down yet

The repo now ships a combined same-origin Cloud Run topology and a root `Dockerfile`, but the actual shared-deployment access path is still incomplete:

- there is no supported authentication layer yet
- ingress and raw-service exposure rules are not yet codified in repo-backed deployment config
- the current artifact should not be treated as anonymous-public safe by default

### 4. Persistence and operator runbook are still incomplete

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

### 5. PDF is still a beta target, not a shipped alpha feature

The v2 pipeline recognizes `.pdf` inputs but throws an explicit "not implemented in alpha yet" error. The UI keeps PDF visible to signal planned beta work, not production availability.

## Minimum Release Checklist

Before calling the API stack production-ready, the repo should have all of the following:

1. Keep deployed mode free of arbitrary remote `inputPath` reads and retain explicit request/upload limits.
2. Add rate limiting, concurrent-upload controls, and safer streaming upload handling.
3. Add authentication and authorization for mutating and data-reading endpoints.
4. Lock down the shared-deployment ingress and raw-service exposure model in repo-defined config.
5. Publish the supported GCP persistence and store-path strategy.
6. Add CI that runs `build`, `test`, and `typecheck` on every change.
7. Publish an operator runbook covering deploy, upgrades, rollback, persistence, backups, and log collection.

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
