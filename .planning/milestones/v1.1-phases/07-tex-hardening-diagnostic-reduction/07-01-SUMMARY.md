---
phase: 07-tex-hardening-diagnostic-reduction
plan: "01"
subsystem: deterministic-latex-parser
tags: [latex, parser, diagnostics, corpus, vitest]
requires:
  - phase: 07-tex-hardening-diagnostic-reduction
    provides: Context, research, and execution plan for measured TeX hardening
provides:
  - Deterministic parsing for nested and same-line supported LaTeX environments
  - Labeled subsection and subsubsection section targets
  - Real-corpus hardening guardrails on unresolved diagnostics
affects: [Phase 8, packages/core/src/ingestion/parsers/latex-parser.ts, packages/core/test/gold-paper-ingestion.test.ts]
tech-stack:
  added: []
  patterns:
    - Recursive extraction of supported nested environments while preserving top-level statement ownership
    - Depth-aware line scanning for same-name environment nesting such as proof-inside-proof
key-files:
  created: [packages/core/test/fixtures/latex/gold-paper-regressions/nested-envs.tex]
  modified: [packages/core/src/ingestion/parsers/latex-parser.ts, packages/core/test/ingestion-pipeline.test.ts, packages/core/test/gold-paper-ingestion.test.ts, packages/cli/test/gold-paper-acceptance.test.ts]
key-decisions:
  - "Fix the measured deterministic parser gaps in-house instead of adding a new TeX parsing dependency."
  - "Keep figure references as an explicit residual class for now instead of expanding the canonical node-kind schema during Phase 7."
patterns-established:
  - "Nested supported LaTeX environments can be resolved deterministically without attributing nested labels to the outer theorem/proof statement."
  - "Corpus hardening is tracked with concrete unresolved-diagnostic budgets, not only fixture smoke tests."
requirements-completed: [HARD-01, HARD-02, HARD-03, HARD-04, HARD-05]
duration: 18min
completed: 2026-04-03
---

# Phase 07 Plan 01 Summary

**Harden deterministic LaTeX parsing against the accepted milestone corpus**

## Performance

- **Duration:** 18 min
- **Completed:** 2026-04-03
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Added a focused regression fixture for nested theorem/equation blocks, same-line equation-like environments, and labeled subsection targets.
- Extended the deterministic parser to recognize `align`, `align*`, `gather`, `gather*`, `multline`, `multline*`, `eqnarray`, and `eqnarray*`.
- Refactored the LaTeX parser so nested supported environments are emitted as their own nodes instead of leaking labels into the outer proof/theorem node.
- Made top-level environment scanning depth-aware for same-name nesting, which fixed the remaining proof-local misses in `short_Petri`.
- Added labeled subsection and subsubsection section nodes with hierarchical numbering while keeping downstream grouping stable on top-level sections.
- Locked the real-corpus outcome in tests:
  - `long_nalini`: `22` unresolved references and `2` unsupported reference-command diagnostics
  - `medium_Mueller.flat.tex`: `0` unresolved references
  - `short_Petri.tex`: `0` unresolved references, with only `missing_bibliography` and `missing_graphics` remaining explicit

## Task Commits

1. **Task 1-3: Add parser regressions, harden deterministic LaTeX parsing, and lock corpus-level guardrails** - pending phase commit

## Verification

- `npx vitest run packages/core/test/ingestion-pipeline.test.ts`
- `npx vitest run packages/core/test/gold-paper-ingestion.test.ts packages/cli/test/gold-paper-acceptance.test.ts`
- `npm run typecheck`
- `npm test`

## Next Phase Readiness

- Phase 8 can now build on a much cleaner deterministic corpus baseline instead of mixing storage/corpus work with parser rescue.
- The residual Phase 7 diagnostics are explicit and bounded, which makes the corpus-library work easier to reason about and test.

---
*Phase: 07-tex-hardening-diagnostic-reduction*
*Completed: 2026-04-03*
