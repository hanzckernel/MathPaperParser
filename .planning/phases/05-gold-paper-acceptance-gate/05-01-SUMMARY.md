---
phase: 05-gold-paper-acceptance-gate
plan: "01"
subsystem: acceptance
tags: [gold-paper, acceptance, cli, export, long-nalini]
requires:
  - phase: 05-gold-paper-acceptance-gate
    provides: Context, research, validation, and execution plan for the gold-paper workflow
provides:
  - End-to-end CLI acceptance regression on `long_nalini`
  - Verified parse/enrich/validate/export flow with separate enrichment sidecar
  - Milestone proof that the representative paper is usable without manual graph editing
affects: [Milestone closeout, .planning/ROADMAP.md, .planning/STATE.md]
tech-stack:
  added: []
  patterns:
    - CLI-driven acceptance harness for milestone proof points
    - Real-paper thresholds instead of brittle full snapshots
key-files:
  created: [packages/cli/test/gold-paper-acceptance.test.ts]
  modified: []
key-decisions:
  - "Prove the milestone on the representative heavy paper through the real CLI workflow, not only parser internals."
  - "Use robust assertions on artifact presence and non-trivial graph size instead of freezing exact graph counts."
patterns-established:
  - "Milestone proof points are executable acceptance tests backed by the shipped command surface."
  - "Gold-paper export now includes the optional enrichment sidecar as part of the local inspection artifact."
requirements-completed: [ACC-01]
duration: 9min
completed: 2026-04-02
---

# Phase 05 Plan 01 Summary

**Turn the representative-paper success bar into an executable CLI acceptance gate**

## Performance

- **Duration:** 9 min
- **Completed:** 2026-04-02
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Added an end-to-end regression that runs `analyze`, `enrich`, `validate`, and `export` on `ref/papers/long_nalini/arXiv-2502.12268v2/main.tex`.
- Verified the real workflow yields diagnostics, canonical bundle files, `enrichment.json`, and a static export ready for local inspection.
- Manually confirmed the built CLI produces a non-trivial gold-paper artifact on 2026-04-02:
  - 416 nodes
  - 617 canonical edges
  - 20 enrichment candidates
  - exported `data/enrichment.json`

## Task Commits

1. **Task 1: Add the gold-paper end-to-end acceptance regression** - `b3f6280` (test)

## Verification

- `npx vitest run packages/cli/test/gold-paper-acceptance.test.ts`
- `npm test`
- `npm run typecheck`
- `npm run build --workspace @paperparser/cli`
- Built CLI manual run on `long_nalini`: `analyze -> enrich -> validate -> export`

## Milestone Readiness

- All roadmap phases are now complete.
- The remaining closeout step is milestone archiving/tagging, which needs an explicit version choice before running `$gsd-complete-milestone`.

---
*Phase: 05-gold-paper-acceptance-gate*
*Completed: 2026-04-02*
