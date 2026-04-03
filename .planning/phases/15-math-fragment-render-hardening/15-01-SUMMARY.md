---
phase: 15-math-fragment-render-hardening
plan: "01"
subsystem: dashboard-math-rendering
tags: [dashboard, web, mathjax, normalization, vitest]
requires:
  - phase: 11-dashboard-math-rendering-repair
    provides: Shared MathJax statement boundary on the current reading surfaces
  - phase: 14-residual-tex-parser-hardening
    provides: Cleaner accepted-corpus statement text with fewer parser-side gaps
provides:
  - Accepted-corpus-first list-environment flattening inside the shared MathJax boundary
  - Bounded readable wrapper and spacing normalization for statement fragments
  - `cases` display salvage without broad browser-side package emulation
  - Explicit fallback preservation for figure and other out-of-scope environments
affects: [Phase 16, packages/web/src/lib/math-render.tsx, packages/web/test/math-render.test.ts]
tech-stack:
  added: []
  patterns:
    - Normalize readable TeX wrappers and list environments before MathJax sees the fragment
    - Prefer bounded render salvage for accepted-corpus statement shapes instead of raw-source fallback
    - Keep unsupported structure explicit instead of broadening compatibility claims
key-files:
  created: []
  modified: [packages/web/src/lib/math-render.tsx, packages/web/test/math-render.test.ts]
key-decisions:
  - "Targeted accepted-corpus list and wrapper-heavy fragments first rather than broad synthetic coverage."
  - "Used bounded `cases` salvage as the adjacent display-like class instead of drifting into general package emulation."
  - "Kept `figure` and similarly unclear environments on the explicit fallback path."
patterns-established:
  - "Readable list and wrapper-heavy statement fragments should be flattened into honest prose-plus-math output before MathJax typesetting."
  - "Render hardening can broaden coverage without mutating canonical bundle text or hiding unsupported structures."
requirements-completed: [MATH-04, MATH-05, MATH-06]
duration: 6min
completed: 2026-04-03
---

# Phase 15: Math Fragment Render Hardening Summary

**Accepted-corpus-first normalization now salvages list-heavy, wrapper-heavy, and bounded `cases` statement fragments instead of dropping them into raw-source fallback**

## Performance

- **Duration:** 6 min
- **Completed:** 2026-04-03
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments

- Expanded the shared `prepareMathStatementText()` pipeline so `itemize` and `enumerate` fragments flatten into readable prose-plus-math output rather than triggering whole-block fallback.
- Added bounded wrapper cleanup for `\emph`, `\text`, `\textbf`, `\textit`, `\mathrm`, `\mbox`, `\quad`, and `\qquad`.
- Added `cases` salvage as the adjacent display-like class for this phase, converting it into readable typeset output without relying on `amsmath` browser support.
- Kept `figure` on the explicit fallback path so the render boundary stays honest about out-of-scope structure.
- Proved the new behavior with direct helper regressions, then re-ran the existing statement-surface wiring proof and workspace typecheck.

## Task Commits

1. **Task 1-3: Add regressions, expand normalization, and re-prove surface wiring** - pending phase commit
2. **Plan metadata:** `87da67d` (docs: plan phase 15 render hardening)

## Files Created/Modified

- `packages/web/src/lib/math-render.tsx` - Added list flattening, readable-wrapper stripping, spacing cleanup, and bounded `cases` salvage to the shared normalization pipeline.
- `packages/web/test/math-render.test.ts` - Added accepted-corpus-first regressions for list environments, wrapper commands, `cases`, and preserved figure fallback.

## Decisions Made

- Focused on the accepted-corpus fallback drivers first instead of widening into broader synthetic compatibility work.
- Chose `cases` as the single adjacent display-like salvage class for this phase.
- Preserved explicit fallback for `figure` and other clearly out-of-scope environments.

## Deviations from Plan

### Auto-fixed Issues

**1. [Plan drift] Surface wiring did not require new regression edits**
- **Found during:** Task 3 (surface proof)
- **Issue:** The planned file list included `packages/web/test/proof-graph-render.test.ts`, but the existing surface contract tests were already sufficient.
- **Fix:** Re-ran the existing proof-graph render test unchanged instead of adding redundant assertions.
- **Verification:** `PATH=/opt/homebrew/bin:$PATH npm test -- packages/web/test/proof-graph-render.test.ts`

---

**Total deviations:** 1 auto-fixed (redundant planned test edit avoided)
**Impact on plan:** No scope creep. The unchanged surface test still proved the required wiring.

## Issues Encountered

- The main accepted-corpus fallback pressure came from readable list environments rather than from MathJax runtime loading or surface wiring.

## User Setup Required

None.

## Next Phase Readiness

- Phase 16 can prove the upgraded `analyze -> validate -> inspect` path on the accepted corpus plus the new hard-case render regressions.
- The remaining render residuals are now a smaller explicit slice of unsupported structures rather than a broad class of list-heavy theorem statements.

---
*Phase: 15-math-fragment-render-hardening*
*Completed: 2026-04-03*
