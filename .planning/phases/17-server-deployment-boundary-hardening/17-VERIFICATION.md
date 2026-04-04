---
phase: 17-server-deployment-boundary-hardening
verified: 2026-04-04T09:41:28Z
status: passed
score: 3/3 must-haves verified
---

# Phase 17: Server Deployment Boundary Hardening Verification Report

**Phase Goal:** Make the current localhost-first server safe and diagnosable in deployed mode before any Cloud Run packaging claim.
**Verified:** 2026-04-04T09:41:28Z
**Status:** passed

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Deployed mode no longer allows arbitrary remote JSON `inputPath` analysis. | ✓ VERIFIED | `packages/cli/src/server.ts` now rejects JSON `inputPath` analysis when `runtimeMode` is `deployed`, and `packages/cli/test/serve-app.test.ts` proves the rejection explicitly. |
| 2 | Request and upload handling now fail within explicit bounds instead of accepting unbounded bodies by default. | ✓ VERIFIED | `packages/cli/src/server.ts` now enforces `maxRequestBytes` in both the Node request reader and the request boundary, plus `maxUploadBytes` on multipart uploads; `packages/cli/test/serve-app.test.ts` locks both oversized HTTP request and oversized upload failures at `413`. |
| 3 | The app now exposes health/readiness routes and structured server log events suitable for a later Cloud Run deployment phase. | ✓ VERIFIED | `packages/cli/src/server.ts` now serves `/healthz` and `/readyz`, and `createPaperParserRequestHandler()` emits structured request completion/failure log events; the request-boundary tests cover the health/readiness routes and the oversized HTTP test exercises the structured failure path. |

**Score:** 3/3 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/cli/src/server.ts` | Deployed-mode server hardening implementation | ✓ EXISTS + SUBSTANTIVE | Added runtime mode, bounded request and upload handling, `/healthz`, `/readyz`, and structured request/error logging. |
| `packages/cli/src/index.ts` | Serve entrypoint wiring for runtime mode and limits | ✓ EXISTS + SUBSTANTIVE | `serve` now accepts deployed-mode and size-limit settings and reports the selected runtime mode at startup. |
| `packages/cli/test/serve-app.test.ts` | Request-boundary proof for the safer contract | ✓ EXISTS + SUBSTANTIVE | Added explicit regressions for deployed-mode JSON rejection, health/readiness, oversized uploads, and oversized HTTP request bodies. |

**Artifacts:** 3/3 verified

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `packages/cli/src/server.ts` | `packages/cli/test/serve-app.test.ts` | request-boundary regressions | ✓ WIRED | The test file directly proves deployed-mode rejection, health/readiness routes, upload caps, and raw request-body caps. |
| `packages/cli/src/index.ts` | `packages/cli/src/server.ts` | serve runtime option wiring | ✓ WIRED | `runServe()` now passes runtime mode and optional size limits into the request handler factory. |

**Wiring:** 2/2 connections verified

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| `SEC-01` | `17-01` | Deployed PaperParser no longer accepts arbitrary remote filesystem `inputPath` analysis from untrusted clients. | ✓ SATISFIED | JSON `inputPath` analysis is rejected explicitly in deployed mode and preserved only for local-mode workflows. |
| `SEC-02` | `17-01` | Deployed PaperParser enforces explicit request and upload limits with bounded failure behavior instead of unbounded in-memory buffering. | ✓ SATISFIED | Oversized raw request bodies and oversized multipart uploads now fail explicitly at `413`. |
| `OPS-01` | `17-01` | User gets `/healthz` and `/readyz` endpoints plus structured logs sufficient to distinguish deployment, readiness, and request failures on Cloud Run. | ✓ SATISFIED | Both routes are live and structured request/error events are emitted from the HTTP handler path. |

**Coverage:** 3/3 requirements satisfied for this phase

## Anti-Patterns Found

None. Phase 17 stayed inside the app-boundary hardening scope and did not sprawl into Cloud Run packaging, auth policy, or persistence wiring.

## Human Verification Required

None for phase exit. The approved Phase 17 bar is automated request-boundary proof plus workspace typecheck.

## Gaps Summary

No blocker gaps remain for Phase 17. The remaining deployment work moves forward into packaging, security, persistence, and acceptance phases.

## Verification Metadata

- **Verification approach:** Goal-backward against ROADMAP Phase 17 success criteria
- **Must-haves source:** `17-01-PLAN.md`
- **Automated checks:** 2 passed, 0 failed
- **Human checks required:** 0
- **Current verification commands:** `PATH=/opt/homebrew/bin:$PATH npm test -- packages/cli/test/serve-app.test.ts`; `PATH=/opt/homebrew/bin:$PATH npm run typecheck`

---
*Verified: 2026-04-04T09:41:28Z*
*Verifier: Codex*
