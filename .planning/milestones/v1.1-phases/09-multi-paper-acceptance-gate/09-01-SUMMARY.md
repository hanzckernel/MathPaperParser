---
phase: 09-multi-paper-acceptance-gate
plan: "01"
subsystem: milestone-acceptance
tags: [acceptance, corpus, cli, api, verification]
requires:
  - phase: 09-multi-paper-acceptance-gate
    provides: Context, research, and execution plan for the milestone proof gate
provides:
  - Real-corpus acceptance proof for `analyze -> validate -> search -> inspect`
  - Shared-store proof across `long_nalini`, `medium_Mueller.flat.tex`, and `short_Petri.tex`
  - Final matcher cleanup so cross-paper evidence stays explainable on the accepted corpus
affects: [Milestone v1.1, packages/cli/test/gold-paper-acceptance.test.ts, packages/cli/test/serve-app.test.ts]
tech-stack:
  added: []
  patterns:
    - Milestone acceptance tests built on the existing local store and serve API instead of bespoke harnesses
    - Narrow matcher cleanup driven by failing real-corpus assertions rather than speculative tuning
key-files:
  created: []
  modified: [packages/core/src/services/corpus-query-service.ts, packages/cli/test/gold-paper-acceptance.test.ts, packages/cli/test/serve-app.test.ts]
key-decisions:
  - "Keep Phase 9 focused on proof and narrow matcher cleanup instead of introducing new surfaces."
  - "Prefer meaningful real-corpus evidence terms such as `hyperbolic` / `surface` over weaker TeX-heavy overlaps in the acceptance proof."
patterns-established:
  - "Milestone closeout should prove the user workflow on the real accepted corpus, not only on synthetic fixtures."
  - "Cross-paper acceptance quality is enforced by real assertions on evidence terms, not just by non-empty result sets."
requirements-completed: [ACC-01, ACC-02, ACC-03]
duration: 16min
completed: 2026-04-03
---

# Phase 09 Plan 01 Summary

**Prove the full `v1.1` workflow on the real three-paper corpus**

## Performance

- **Duration:** 16 min
- **Completed:** 2026-04-03
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Extended the `long_nalini` acceptance test to prove the current milestone workflow instead of only the old export-centric flow:
  - `analyze`
  - `enrich`
  - `validate`
  - `search`
  - `inspect`
- Added a new shared-store acceptance proof covering:
  - `long_nalini`
  - `medium_Mueller.flat.tex`
  - `short_Petri.tex`
- Verified real-corpus search anchors on all three papers:
  - `hyperbolic`
  - `torsion`
  - `Cheeger constant`
- Added real-corpus API acceptance that exercises:
  - corpus listing
  - paper-local query
  - node context inspection
  - cross-paper related navigation
- Tightened the corpus matcher so the accepted real-corpus related result prefers the more meaningful `hyperbolic` / `surface` overlap over weaker TeX-ish or overly generic terms.

## Task Commits

1. **Task 1-2: Add the real-corpus acceptance gate and tighten matcher evidence** - pending phase commit

## Verification

- `npx vitest run packages/cli/test/gold-paper-acceptance.test.ts packages/cli/test/serve-app.test.ts`
- `npm test`
- `npm run typecheck`
- `npm run build`

## Milestone Readiness

- All `v1.1` requirements are now covered by shipped code and passing automated verification.
- The milestone is ready for audit and closeout.

---
*Phase: 09-multi-paper-acceptance-gate*
*Completed: 2026-04-03*
