# Deployment Readiness

## Verdict

As of **March 11, 2026**, PaperParser v2 alpha is ready for:

- local development
- internal demos
- static dashboard exports
- controlled self-hosting on trusted networks

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

### 1. Remote clients can request server-side file reads

`POST /api/papers` accepts JSON with an `inputPath`, then resolves that path on the server and analyzes the file from local disk.

Relevant implementation:

- `packages/cli/src/server.ts`
  - `resolveInputPath(...)`
  - `handleAnalyzeRequest(...)`
  - `analyzeAndStore(...)`

This is acceptable for a local developer tool, but it is not acceptable for an internet-facing service. A remote caller should not be able to tell the server process which filesystem path to open.

### 2. Upload handling is unbounded

The server buffers the full request body in memory before creating the `Request`, and uploaded files are materialized with `arrayBuffer()` before being written to disk.

Relevant implementation:

- `packages/cli/src/server.ts`
  - `readBody(...)`
  - `toWebRequest(...)`
  - `persistUploadedFile(...)`

There are no documented or enforced limits for:

- request body size
- upload file size
- concurrent uploads
- rate limiting

That is a denial-of-service risk in production.

### 3. No authentication or authorization layer

All current API routes are open once the process is reachable:

- `GET /api/papers`
- `POST /api/papers`
- `GET /api/papers/:paperId/{manifest,graph,index,validate,query,context,impact}`

This is fine for localhost-only use. It is not enough for a shared or public deployment.

### 4. No production operability surface

The route table only exposes paper operations. There is no health or readiness endpoint, no metrics endpoint, and no structured deployment runbook for the current v2 stack.

The repo also does not currently ship:

- `.github/workflows/` CI for the v2 monorepo
- a `Dockerfile`
- a `docker-compose` file
- a `Procfile`

You can still deploy manually, but the project does not yet provide a supported production packaging story.

### 5. Dashboard/API deployment topology is still implicit

The React dashboard can run in:

- static mode with local `./data/*.json`
- API mode via `?api=...`

The current Node server does not also serve the web bundle, and the API responses do not include CORS headers. In practice that means a browser deployment needs a same-origin reverse proxy or a deliberate API gateway setup. That topology is not yet documented as a supported production path.

### 6. PDF is still a beta target, not a shipped alpha feature

The v2 pipeline recognizes `.pdf` inputs but throws an explicit "not implemented in alpha yet" error. The UI keeps PDF visible to signal planned beta work, not production availability.

## Minimum Release Checklist

Before calling the API stack production-ready, the repo should have all of the following:

1. Remove the JSON `inputPath` ingest route or restrict it to a tightly controlled allowlist that is not reachable from untrusted clients.
2. Add request-size limits, upload-size limits, rate limiting, and safer streaming upload handling.
3. Add authentication and authorization for mutating and data-reading endpoints.
4. Add `/healthz` and `/readyz` endpoints plus basic structured request logging.
5. Decide and document the supported deployment topology:
   same-origin reverse proxy, static export only, or a combined web/API server.
6. Add a supported deployment artifact:
   container image, process-manager config, or another versioned production entrypoint.
7. Add CI that runs `build`, `test`, and `typecheck` on every change.
8. Publish an operator runbook covering store path, persistence, backups, log collection, upgrades, and rollback.

## Practical Recommendation

Use PaperParser v2 alpha in one of these ways today:

- local CLI plus local dashboard export
- localhost API for personal use
- internal trusted-network demo behind a reverse proxy

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

Do not expose the current `serve` process directly to the public internet.
