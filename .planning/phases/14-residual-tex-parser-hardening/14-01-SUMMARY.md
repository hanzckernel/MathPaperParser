---
phase: 14-residual-tex-parser-hardening
plan: "01"
subsystem: latex-parser
tags: [latex, parser, diagnostics, labels, vitest]
requires:
  - phase: 07-tex-hardening-diagnostic-reduction
    provides: The post-v1.1 parser baseline and the earlier decision to keep figure refs explicit
provides:
  - Alias-aware label registration for existing section, theorem-like, and equation targets
  - Bounded `\cref` / `\Cref` resolution for already-known deterministic nodes
  - Explicit duplicate-label diagnostics with first-definition-wins semantics
affects: [Phase 15, Phase 16, packages/core/src/ingestion/parsers/latex-parser.ts, diagnostics]
tech-stack:
  added: []
  patterns:
    - Alias-aware LaTeX label registration with one canonical node label and additional resolvable aliases
    - First-definition-wins duplicate-label warnings instead of silent last-write overwrite
key-files:
  created: [packages/core/test/fixtures/latex/gold-paper-regressions/duplicate-labels.tex]
  modified: [packages/core/src/ingestion/parsers/latex-parser.ts, packages/core/test/ingestion-pipeline.test.ts, packages/core/test/gold-paper-ingestion.test.ts, packages/cli/test/gold-paper-acceptance.test.ts, packages/core/test/fixtures/latex/gold-paper-regressions/nested-envs.tex, packages/core/test/fixtures/latex/gold-paper-regressions/unsupported-refs.tex]
key-decisions:
  - "Kept figure references explicit and targeted the non-figure residual classes first."
  - "Registered secondary labels as aliases to the same node instead of expanding node identity or schema."
  - "Resolved duplicate labels to the first target and surfaced them through explicit warnings."
patterns-established:
  - "Existing extracted targets may own multiple LaTeX labels without requiring extra canonical nodes."
  - "Bounded cleveref support is acceptable when the target is already deterministic; unknown targets stay explicit."
requirements-completed: [HARD-06, HARD-07, HARD-08]
duration: 7min
completed: 2026-04-03
---

# Phase 14: Residual TeX Parser Hardening Summary

**Deterministic label aliasing, bounded cleveref resolution, and explicit duplicate-label diagnostics reduced the accepted-corpus residual parser budget to seven unresolved references**

## Performance

- **Duration:** 7 min
- **Started:** 2026-04-03T20:20:14Z
- **Completed:** 2026-04-03T20:26:59Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- Added executable regressions for multiline heading labels, multi-label targets, bounded `\cref` / `\Cref`, and duplicate-label semantics.
- Hardened the parser so one node can resolve multiple labels while duplicate labels remain explicit and deterministic.
- Lowered the `long_nalini` residual parser budget from `22 unresolved / 2 unsupported_reference_command` to `7 unresolved / 0 unsupported_reference_command`.

## Task Commits

Each task was completed inside the implementation pass and then summarized in planning docs:

1. **Task 1-3: Parser regressions, label registration hardening, and accepted-corpus guardrails** - `837a667` (fix)
2. **Plan metadata:** `3f4dfca` (docs: plan phase 14 parser hardening)

## Files Created/Modified

- `packages/core/src/ingestion/parsers/latex-parser.ts` - Added alias-aware label registration, multiline heading capture, bounded cleveref resolution, and duplicate-label warnings.
- `packages/core/test/ingestion-pipeline.test.ts` - Added focused regressions for the new parser contract.
- `packages/core/test/gold-paper-ingestion.test.ts` - Locked the tighter accepted-corpus warning budget.
- `packages/cli/test/gold-paper-acceptance.test.ts` - Locked the tighter persisted diagnostics budget at the CLI boundary.
- `packages/core/test/fixtures/latex/gold-paper-regressions/duplicate-labels.tex` - New duplicate-label regression fixture.
- `packages/core/test/fixtures/latex/gold-paper-regressions/nested-envs.tex` - Expanded fixture to cover multiline headings and label aliases.
- `packages/core/test/fixtures/latex/gold-paper-regressions/unsupported-refs.tex` - Recast fixture around bounded cleveref support and explicit residuals.

## Decisions Made

- Kept figure references explicit, because the non-figure residual classes were enough to materially beat the baseline without schema work.
- Treated secondary labels as aliases to an existing node rather than creating duplicate canonical nodes.
- Made duplicate labels explicit warnings with first-definition-wins semantics to preserve deterministic trust.

## Deviations from Plan

### Auto-fixed Issues

**1. [Strict TS] Optional-property warnings in parser helpers**
- **Found during:** Task 2 (parser hardening)
- **Issue:** New helper code violated `exactOptionalPropertyTypes` and line-map typing.
- **Fix:** Added explicit type guards and conditional property construction for labels, warning lines, and multiline-heading source locations.
- **Files modified:** `packages/core/src/ingestion/parsers/latex-parser.ts`
- **Verification:** `PATH=/opt/homebrew/bin:$PATH npm run typecheck`
- **Committed in:** `837a667`

**2. [Corpus guardrail drift] Duplicate-label warnings surfaced on `short_Petri`**
- **Found during:** Task 3 (accepted-corpus proof)
- **Issue:** The old corpus assertion expected only missing-asset diagnostics on `short_Petri`.
- **Fix:** Updated the real-corpus expectation to include the newly explicit duplicate-label warnings.
- **Files modified:** `packages/core/test/gold-paper-ingestion.test.ts`
- **Verification:** `PATH=/opt/homebrew/bin:$PATH npm test -- packages/core/test/gold-paper-ingestion.test.ts`
- **Committed in:** `837a667`

---

**Total deviations:** 2 auto-fixed (1 strict-typing, 1 corpus-guardrail)
**Impact on plan:** Both changes were required to keep the new parser behavior explicit and the verification layer accurate. No scope creep.

## Issues Encountered

- The accepted-corpus baseline changed more than expected because several missed labels were aliases on already-supported nodes, not independent parser gaps.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 15 can start from a cleaner extracted-text baseline instead of carrying parser alias gaps into render normalization.
- The remaining `long_nalini` residuals are now a smaller explicit slice, primarily figure-oriented references the milestone intentionally deferred.

---
*Phase: 14-residual-tex-parser-hardening*
*Completed: 2026-04-03*
