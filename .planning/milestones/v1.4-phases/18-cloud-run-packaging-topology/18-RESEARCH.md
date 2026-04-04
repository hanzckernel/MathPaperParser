# Phase 18 Research: Cloud Run Packaging & Topology

**Date:** 2026-04-04
**Status:** Complete

## Goal

Find the smallest repo-owned change set that gives PaperParser one supported Cloud Run deployment artifact and one explicit same-origin deployed browser topology without mixing in later auth or persistence work.

## Current Seams

- `packages/cli/src/server.ts`
  - already owns the whole HTTP route table
  - currently serves only API/health routes, not the web bundle
- `packages/cli/src/index.ts`
  - owns the `serve` entrypoint
  - already carries deploy-mode/runtime-limit env wiring from Phase 17
- `packages/web/src/lib/data-source.ts`
  - defaults to static `./data`
  - only enters API mode when `?api=...` is present
- `packages/web/vite.config.ts`
  - already emits a self-contained relative-asset bundle
- repo root
  - has no `Dockerfile` or `.dockerignore`

## Recommended Phase-18 Shape

### 1. Ship a root Cloud Run container artifact

Recommended artifact:
- repo-root multi-stage `Dockerfile`
- image build runs `npm install` and `npm run build`
- runtime launches `node packages/cli/dist/index.js serve --deployed`

Why:
- It makes deployment versioned and repo-defined.
- It reuses the existing CLI server instead of inventing a second runtime.

### 2. Extend the CLI server to serve the built web bundle

Recommended behavior:
- when a web dist path is configured, serve `index.html` and built assets from that directory
- keep `/api/*`, `/healthz`, and `/readyz` behavior intact
- treat non-API browser routes as dashboard-shell requests

Why:
- This is the simplest same-origin topology.
- It avoids CORS and reverse-proxy documentation complexity in the first supported deployment path.

### 3. Add a small deployed runtime-config contract for the browser

Recommended behavior:
- inject a tiny runtime config into the served dashboard shell
- if no `?api=...` is present and the runtime config says "deployed API mode", the web app should default to same-origin API mode
- keep static export behavior unchanged when no runtime config exists

Why:
- The current web app is static-first and would otherwise fetch `./data/*.json` from the deployed shell.
- A runtime config is more explicit and testable than relying on URL rewrites or magic path inference.

### 4. Add env/flag support for the packaged web bundle path

Recommended behavior:
- `serve` accepts `--web-dist <path>`
- env fallback such as `PAPERPARSER_WEB_DIST`
- deployed container defaults can point at `packages/web/dist`

Why:
- Cloud Run packaging needs a stable contract between the built image and the server process.

### 5. Prove the topology with request/data-source tests

Recommended proof:
- CLI server tests for serving the dashboard shell and packaged assets when `webDistPath` is configured
- web data-source tests for runtime-config-driven same-origin API mode
- a lightweight artifact-contract test that the repo ships the expected Cloud Run Dockerfile shape

Why:
- These tests pin the supported topology without requiring Docker-in-Docker in this phase.

## Suggested File Set

- `Dockerfile`
- `.dockerignore`
- `packages/cli/src/server.ts`
- `packages/cli/src/index.ts`
- `packages/cli/test/serve-app.test.ts`
- `packages/web/src/lib/data-source.ts`
- `packages/web/src/App.tsx`
- `packages/web/test/bundle-data.test.ts`
- optional: `packages/cli/test/cloud-run-artifact.test.ts`
- `README.md`
- `docs/deployment_readiness.md`

## Verification Direction

- targeted request-boundary tests for packaged web serving
- targeted web source-resolution tests for runtime-config same-origin API mode
- repo typecheck

## Out of Scope for This Phase

- auth/authz and ingress lock-down
- Cloud Storage or persistence strategy
- end-to-end Cloud Run smoke execution

---

*Phase: 18-cloud-run-packaging-topology*
*Research completed: 2026-04-04*
