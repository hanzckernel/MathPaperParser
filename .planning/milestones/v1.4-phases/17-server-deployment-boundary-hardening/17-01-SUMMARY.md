---
phase: 17-server-deployment-boundary-hardening
plan: "01"
subsystem: deployed-server-boundary
tags: [deployment, server, limits, health, logging, vitest]
requires:
  - phase: 16-parse-render-acceptance-gate
    provides: Shipped local web/API baseline before deployment hardening begins
provides:
  - Explicit `local` versus `deployed` runtime behavior for the API boundary
  - Bounded request and upload handling with explicit `413` failures
  - `/healthz` and `/readyz` routes for later Cloud Run health-check wiring
  - Structured request and failure log events from the HTTP handler path
affects: [Phase 18, packages/cli/src/server.ts, packages/cli/src/index.ts, packages/cli/test/serve-app.test.ts]
tech-stack:
  added: []
  patterns:
    - Keep localhost-only API affordances behind an explicit runtime-mode boundary
    - Enforce size limits at both the raw HTTP boundary and the request-processing boundary
    - Add app-level health and readiness routes before platform packaging work
key-files:
  created: []
  modified: [packages/cli/src/server.ts, packages/cli/src/index.ts, packages/cli/test/serve-app.test.ts]
key-decisions:
  - "Kept JSON `inputPath` analysis available only in local mode instead of deleting the workflow outright."
  - "Used explicit request and upload size limits now rather than deferring to a full streaming redesign."
  - "Added health/readiness routes and structured logs in the server phase rather than treating them as packaging-only concerns."
patterns-established:
  - "Shared deployment hardening should introduce explicit runtime modes instead of overloading the localhost contract."
  - "Cloud-targeted server work can be proved at the request boundary before full container packaging exists."
requirements-completed: [SEC-01, SEC-02, OPS-01]
duration: 24min
completed: 2026-04-04
---

# Phase 17: Server Deployment Boundary Hardening Summary

**The API boundary now distinguishes local and deployed behavior, rejects unsafe deployed-mode ingestion, and exposes bounded health and operability surfaces for the Cloud Run milestone**

## Performance

- **Duration:** 24 min
- **Completed:** 2026-04-04
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Added a deploy-safe runtime boundary so JSON `inputPath` analysis is rejected explicitly in deployed mode while local mode keeps current developer ergonomics.
- Enforced explicit request and upload size limits with deterministic `413` failures instead of leaving the current request path unbounded.
- Added `/healthz` and `/readyz` routes for later Cloud Run health check wiring.
- Added structured request completion and failure log events on the HTTP handler path.
- Re-proved the server request boundary with new regressions and passed workspace typecheck.

## Task Commits

1. **Task 1-3: Lock the deploy-safe server contract, implement it, and re-prove it** - pending phase commit
2. **Plan metadata:** `445078a` (docs: plan phase 17 deployment boundary hardening)

## Files Created/Modified

- `packages/cli/src/server.ts` - Added runtime mode, request/upload limits, health/readiness routes, and structured request/error logging.
- `packages/cli/src/index.ts` - Wired `serve` runtime-mode and size-limit settings into the request handler.
- `packages/cli/test/serve-app.test.ts` - Added regressions for deployed-mode JSON rejection, health/readiness, oversized uploads, and oversized HTTP request bodies.

## Decisions Made

- Preserved local JSON `inputPath` workflows, but made them explicitly unavailable in deployed mode.
- Landed explicit size limits now instead of turning Phase 17 into a streaming upload rewrite.
- Treated health/readiness and structured logs as app-boundary requirements, not only later Cloud Run configuration concerns.

## Deviations from Plan

### Auto-fixed Issues

**1. [Strict TS] Optional log fields conflicted with `exactOptionalPropertyTypes`**
- **Found during:** Task 3 (typecheck)
- **Issue:** The initial structured log helper always included `storePath`, even when undefined.
- **Fix:** Emitted optional log fields only when present.
- **Files modified:** `packages/cli/src/server.ts`
- **Verification:** `PATH=/opt/homebrew/bin:$PATH npm run typecheck`

---

**Total deviations:** 1 auto-fixed (strict typing on structured logs)
**Impact on plan:** No scope creep. The fix only tightened the intended logging contract.

## Issues Encountered

- None beyond the expected red-to-green request-boundary and strict-typing loop.

## User Setup Required

None for phase exit.

## Next Phase Readiness

- Phase 18 can now package and route the service on top of an explicit deployed-mode server boundary rather than the old localhost-only contract.
- The remaining deployment risk has shifted from raw API safety into packaging, topology, security, persistence, and acceptance work.

---
*Phase: 17-server-deployment-boundary-hardening*
*Completed: 2026-04-04*
