---
phase: 01-gold-paper-tex-ingestion-hardening
plan: "01"
subsystem: testing
tags: [vitest, latex, diagnostics, cli, gold-paper]
requires:
  - phase: 01-gold-paper-tex-ingestion-hardening
    provides: Phase context, research, validation, and execution plans
provides:
  - Gold-paper acceptance regression on the real long_nalini main.tex entrypoint
  - Reduced TeX fixtures for front matter, missing input, and unsupported references
  - CLI regression for persisted diagnostics.json output
affects: [01-02, packages/core/src/ingestion/parsers/latex-parser.ts, packages/cli/src/store.ts]
tech-stack:
  added: []
  patterns:
    - Real-paper ingestion acceptance tests backed by reduced TeX fixtures
    - Diagnostics regressions asserted at both ingestion and persisted-store boundaries
key-files:
  created: [packages/core/test/gold-paper-ingestion.test.ts, packages/core/test/fixtures/latex/gold-paper-regressions/front-matter.tex, packages/core/test/fixtures/latex/gold-paper-regressions/missing-input.tex, packages/core/test/fixtures/latex/gold-paper-regressions/unsupported-refs.tex]
  modified: [packages/core/test/ingestion-pipeline.test.ts, packages/core/test/latex-flattener.test.ts, packages/cli/test/analyze-command.test.ts]
key-decisions:
  - "Keep ref/papers/long_nalini/arXiv-2502.12268v2/main.tex as the acceptance target instead of flattening the paper."
  - "Cover INGEST-03 explicitly with citation, include, unresolved-reference, and unsupported-command diagnostics."
patterns-established:
  - "Wave 0 regressions must exercise the real paper directly and isolate edge cases with reduced fixtures."
  - "CLI acceptance tests must verify persisted diagnostics sidecars, not only in-memory warnings."
requirements-completed: [INGEST-01, INGEST-02, INGEST-03]
duration: 5min
completed: 2026-04-02
---

# Phase 01 Plan 01 Summary

**Real-paper LaTeX acceptance regression plus reduced fixtures for front matter, missing includes, and diagnostics persistence**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-02T19:02:00Z
- **Completed:** 2026-04-02T19:07:00Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Added a gold-paper acceptance test that targets `ref/papers/long_nalini/arXiv-2502.12268v2/main.tex` directly.
- Added reduced fixtures for optional-title front matter, missing required `\input`, and unresolved or unsupported reference commands.
- Added a CLI regression that requires `diagnostics.json` persistence and human-readable diagnostics output.

## Task Commits

Execution stayed green by landing the Wave 0 harness and the matching hardening work together in the phase execution commit.

1. **Task 1: Add the real-paper acceptance regression and CLI diagnostics-persistence regression** - `2dd5030` (fix)
2. **Task 2: Add reduced regression fixtures for front matter, missing-input, and unresolved-reference diagnostics** - `2dd5030` (fix)

**Plan metadata:** `b2c5689` (docs(01): add execution plans)

## Files Created/Modified

- `packages/core/test/gold-paper-ingestion.test.ts` - Gold-paper acceptance on the real `main.tex` entrypoint
- `packages/core/test/fixtures/latex/gold-paper-regressions/front-matter.tex` - Optional-title plus nested-author regression fixture
- `packages/core/test/fixtures/latex/gold-paper-regressions/missing-input.tex` - Missing required include regression fixture
- `packages/core/test/fixtures/latex/gold-paper-regressions/unsupported-refs.tex` - Unresolved and unsupported reference regression fixture
- `packages/core/test/ingestion-pipeline.test.ts` - Explicit diagnostics assertions for front matter, missing input, and unsupported refs
- `packages/core/test/latex-flattener.test.ts` - Gold-paper `.bbl` bibliography regression
- `packages/cli/test/analyze-command.test.ts` - Persisted diagnostics sidecar regression

## Decisions Made

- Kept the real `long_nalini` tree as the acceptance target so Phase 1 proves the actual product surface rather than a helper-only path.
- Counted the existing `missing_bibliography` assertion as the citation-source diagnostic and added a dedicated `missing_input` regression so INGEST-03 is fully executable.

## Deviations from Plan

None in behavior. The Wave 0 harness and green implementation landed in one execution commit to keep the tree green after TDD verification.

## Issues Encountered

- The plan checker flagged missing explicit coverage for include and citation diagnostics. The fix was to add a dedicated `missing_input` regression and tighten the Phase 1 validation docs before final verification.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 2 can now build deterministic objects and relations on top of a verified gold-paper ingestion baseline.
- The gold paper still emits 46 explicit `unresolved_reference` warnings, which Phase 2 can use as known context when improving deterministic relation coverage.

---
*Phase: 01-gold-paper-tex-ingestion-hardening*
*Completed: 2026-04-02*
