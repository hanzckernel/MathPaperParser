---
phase: 16-parse-render-acceptance-gate
plan: "01"
subsystem: acceptance-proof-and-docs
tags: [acceptance, docs, regression, workflow, vitest]
requires:
  - phase: 14-residual-tex-parser-hardening
    provides: Accepted-corpus parser hardening plus targeted fixture regressions
  - phase: 15-math-fragment-render-hardening
    provides: Accepted-corpus-first MathJax normalization regressions and shared surface proof
provides:
  - Named `v1.3` acceptance-proof command at the repo root
  - Top-level docs aligned with the current parse/render proof workflow
  - Regression coverage that keeps the current milestone proof command discoverable
  - Fresh parser/render milestone verification evidence from one repo-root command
affects: [package.json, README.md, docs/user_guide.md, packages/web/test/operator-guidance-docs.test.ts]
tech-stack:
  added: []
  patterns:
    - Publish each milestone proof as a named repo-level command instead of scattered manual test lists
    - Keep the current milestone proof prominent while preserving older milestone-specific proof commands when still useful
key-files:
  created: []
  modified: [package.json, README.md, docs/user_guide.md, packages/web/test/operator-guidance-docs.test.ts]
key-decisions:
  - "Published `test:acceptance:v1.3` as a focused parse/render proof bundle rather than replacing the older `v1.2` export/runtime proof."
  - "Reused the existing docs-contract regression instead of creating another acceptance-docs test file."
  - "Kept the `v1.3` proof bundle scoped to parser/render evidence instead of reabsorbing the full `v1.2` runtime/export surface."
patterns-established:
  - "Current milestone proof commands should stay discoverable from README and the user guide."
  - "Accepted-corpus workflow evidence and targeted hard-case regressions can share one named proof bundle."
requirements-completed: [ACC-04, ACC-05]
duration: 5min
completed: 2026-04-03
---

# Phase 16: Parse/Render Acceptance Gate Summary

**`v1.3` now closes on one named parse/render proof command backed by fresh acceptance and typecheck evidence**

## Performance

- **Duration:** 5 min
- **Completed:** 2026-04-03
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Published `npm run test:acceptance:v1.3` at the repo root as the current milestone proof bundle.
- Bundled accepted-corpus parser validation, CLI workflow proof, targeted parser regressions, targeted MathJax normalization regressions, and statement-surface wiring into one named acceptance command.
- Updated `README.md` and `docs/user_guide.md` so the current parse/render proof is discoverable while the older `v1.2` export/runtime proof remains available as an archived milestone command.
- Extended the existing docs-contract regression to keep the `v1.3` proof command and its discovery path from drifting.
- Re-ran `npm run test:acceptance:v1.3` and `npm run typecheck` successfully as fresh milestone evidence.

## Task Commits

1. **Task 1-3: Publish the `v1.3` proof command, align docs, and rerun the milestone evidence** - pending phase commit
2. **Plan metadata:** `eef63f3` (docs: plan phase 16 acceptance gate)

## Files Created/Modified

- `package.json` - Added `test:acceptance:v1.3` with the focused parse/render acceptance bundle.
- `README.md` - Points to the current `v1.3` proof command and keeps `v1.2` framed as the earlier export/runtime bundle.
- `docs/user_guide.md` - Documents the current parse/render acceptance workflow and keeps the older export/runtime proof explicit.
- `packages/web/test/operator-guidance-docs.test.ts` - Locks the root script and docs discovery path for `v1.3`.

## Decisions Made

- Added a new `v1.3` proof command instead of mutating or replacing the older `v1.2` proof.
- Reused the existing operator-guidance docs regression instead of introducing a parallel docs-only acceptance test.
- Kept the acceptance bundle focused on parser/render proof instead of dragging in unrelated export/runtime coverage.

## Deviations from Plan

None.

## Issues Encountered

- None beyond expected red-to-green docs-contract drift: the repo still advertised only `v1.2` until this phase added the new command and references.

## User Setup Required

None.

## Next Phase Readiness

- All `v1.3` phases are complete. The next workflow step is milestone audit and closeout, not additional implementation inside this roadmap.

---
*Phase: 16-parse-render-acceptance-gate*
*Completed: 2026-04-03*
