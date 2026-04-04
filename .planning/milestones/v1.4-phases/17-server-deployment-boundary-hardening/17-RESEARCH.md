# Phase 17 Research: Server Deployment Boundary Hardening

**Date:** 2026-04-04
**Status:** Complete

## Goal

Find the smallest app-layer change set that makes the current `serve` API safe enough to underlie a future Cloud Run deployment without dragging packaging, ingress, or persistence work into this phase.

## Current Server Seams

- `packages/cli/src/server.ts`
  - `readBody()` buffers every non-GET request body with no limit
  - `toWebRequest()` converts the buffered body into a `Request`
  - `handleAnalyzeRequest()` accepts either JSON `inputPath` or multipart upload
  - there are no `/healthz` or `/readyz` routes
  - there is no app-level structured request logging
- `packages/cli/src/index.ts`
  - `runServe()` wires the server with only `storePath` and `cwd`
- `packages/cli/test/serve-app.test.ts`
  - current tests assume JSON `inputPath` analysis remains allowed at the request boundary

## Recommended Phase-17 Shape

### 1. Introduce an explicit runtime mode

Add a server/runtime option that distinguishes:
- `local`
- `deployed`

Recommended default:
- direct test helpers and current CLI behavior stay `local` unless explicitly set otherwise

Why:
- Phase 17 needs a deploy-safe boundary without breaking the existing local developer workflow all at once
- Later Cloud Run phases can wire the deployed mode through env/config without redesigning the server core again

### 2. Gate JSON `inputPath` analysis behind local mode

Recommended behavior:
- in `local` mode: keep current JSON `inputPath` behavior
- in `deployed` mode: reject JSON `inputPath` analysis with an explicit 400/403-style failure and guidance toward the supported upload path

Why:
- This is the repo’s clearest internet-facing safety bug today
- It is testable at the `handlePaperParserRequest()` boundary

### 3. Add raw body limits before `Request` creation

Recommended behavior:
- check `content-length` if present
- enforce an accumulation cap while reading chunks
- reject early with explicit failure when the limit is exceeded

Why:
- This directly addresses the unbounded buffering problem in `readBody()`
- It improves both JSON and multipart requests without a full streaming redesign

### 4. Add upload-specific limit checks

Recommended behavior:
- keep a general request-body cap
- also validate uploaded file size after `formData()` parsing for clearer errors

Why:
- total body size and uploaded file size are not always the same thing from an operator perspective

### 5. Add `/healthz` and `/readyz`

Recommended behavior:
- `/healthz`: process is alive
- `/readyz`: store path can be resolved and basic startup dependencies are usable

Why:
- Simple app-level readiness is enough for this phase
- It creates a clean handoff to Cloud Run health check wiring later

### 6. Emit structured request/error logs

Recommended behavior:
- JSON log lines to stdout/stderr
- fields should include event, method, path, status, runtime mode, and error message when relevant

Why:
- Cloud Run can ingest stdout/stderr directly into Cloud Logging
- Phase 17 only needs enough structure to distinguish readiness, rejected requests, and internal failures

## Suggested File Set

- `packages/cli/src/server.ts`
- `packages/cli/src/index.ts`
- `packages/cli/test/serve-app.test.ts`

Optional if needed:
- `packages/cli/test/*` for isolated request-limit helper coverage if `serve-app.test.ts` becomes too dense

## Verification Direction

- direct request/response tests for:
  - deployed-mode JSON `inputPath` rejection
  - bounded request-body failure
  - bounded multipart failure
  - `/healthz`
  - `/readyz`
- `npm run typecheck`

## Out of Scope for This Phase

- Dockerfile or container image work
- static asset serving from the Node runtime
- auth/authz and ingress policy
- GCP persistence wiring

---

*Phase: 17-server-deployment-boundary-hardening*
*Research completed: 2026-04-04*
