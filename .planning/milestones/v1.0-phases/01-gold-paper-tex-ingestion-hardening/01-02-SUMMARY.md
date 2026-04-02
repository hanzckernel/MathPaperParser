---
phase: 01-gold-paper-tex-ingestion-hardening
plan: "02"
subsystem: api
tags: [latex, cli, diagnostics, parsing, bundle-store]
requires:
  - phase: 01-gold-paper-tex-ingestion-hardening
    provides: Wave 0 gold-paper regressions and reduced TeX fixtures
provides:
  - Brace-aware LaTeX title and author extraction for the gold paper
  - Explicit unresolved-reference diagnostics and `.bbl`-aware bibliography handling
  - Persisted diagnostics.json sidecars and CLI warning summaries
affects: [Phase 2, packages/core/src/ingestion/pipeline.ts, packages/cli/src/index.ts]
tech-stack:
  added: []
  patterns:
    - Small parser helper for brace-aware command extraction instead of broad parser replacement
    - Diagnostics sidecars persisted beside manifest, graph, and index without changing bundle schema
key-files:
  created: [packages/core/src/ingestion/parsers/latex-command-extractor.ts]
  modified: [packages/core/src/ingestion/parsers/latex-parser.ts, packages/core/src/ingestion/flatten/latex-flattener.ts, packages/cli/src/store.ts, packages/cli/src/index.ts]
key-decisions:
  - "Repair front matter with a narrow command extractor helper instead of replacing the LaTeX parser in Phase 1."
  - "Persist diagnostics as an additive diagnostics.json sidecar rather than mutating the canonical bundle schema."
patterns-established:
  - "Gold-paper front matter is parsed with brace-aware command extraction and LaTeX cleanup at the ingestion edge."
  - "Analyze output always reports diagnostics path and warning count so acceptance flows remain human-readable."
requirements-completed: [INGEST-01, INGEST-02, INGEST-03]
duration: 7min
completed: 2026-04-02
---

# Phase 01 Plan 02 Summary

**Brace-aware gold-paper front matter, explicit unresolved-reference diagnostics, `.bbl`-aware bibliography handling, and persisted CLI diagnostics sidecars**

## Performance

- **Duration:** 7 min
- **Started:** 2026-04-02T19:07:00Z
- **Completed:** 2026-04-02T19:12:32Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Replaced brittle `\title{}` and `\author{}` regexes with a brace-aware command extractor that handles optional arguments and nested braces.
- Preserved explicit `missing_input` and `missing_bibliography` diagnostics while adding structured `unresolved_reference` warnings and `.bbl`-aware bibliography handling for the gold paper.
- Persisted `diagnostics.json` beside stored bundles and surfaced diagnostics paths and warning counts in CLI analyze output.

## Task Commits

1. **Task 1: Turn the gold-paper metadata and diagnostics regressions green on the existing core ingestion path** - `2dd5030` (fix)
2. **Task 2: Persist diagnostics after analyze and surface them in the CLI acceptance path** - `2dd5030` (fix)

**Plan metadata:** `b2c5689` (docs(01): add execution plans)

## Files Created/Modified

- `packages/core/src/ingestion/parsers/latex-command-extractor.ts` - Brace-aware LaTeX command reader for front matter
- `packages/core/src/ingestion/parsers/latex-parser.ts` - Front-matter normalization plus unresolved/unsupported reference diagnostics
- `packages/core/src/ingestion/flatten/latex-flattener.ts` - `.bbl`-aware bibliography detection on the existing path
- `packages/cli/src/store.ts` - Additive `diagnostics.json` persistence in stored bundles
- `packages/cli/src/index.ts` - Analyze output now reports diagnostics path and warning summary

## Decisions Made

- Used a narrow parser helper for Phase 1 instead of broad parser replacement because the gold paper only needed front-matter extraction hardening.
- Kept `diagnostics.json` out of the canonical bundle schema so later phases can build on the existing `manifest` / `graph` / `index` contract unchanged.

## Deviations from Plan

None - plan executed as written after the coverage fix from the plan checker was folded into the validation docs.

## Issues Encountered

- `exactOptionalPropertyTypes` surfaced strict TypeScript build errors in the new helper and the CLI diagnostics type guard. Both were fixed before acceptance verification resumed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 1 acceptance is green end-to-end: targeted tests, full suite, typecheck, built CLI analyze/validate, and rerun stability check.
- Phase 2 can assume trustworthy gold-paper title/authors, persisted diagnostics, and explicit unresolved-reference warnings as its starting context.

---
*Phase: 01-gold-paper-tex-ingestion-hardening*
*Completed: 2026-04-02*
