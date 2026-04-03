---
phase: 13-export-acceptance-operator-guidance
plan: "01"
subsystem: acceptance-proof-and-docs
tags: [docs, acceptance, regression, workflow, vitest]
requires:
  - phase: 13-export-acceptance-operator-guidance
    provides: Context and execution plan for milestone acceptance proof and operator guidance
provides:
  - Named `v1.2` acceptance-proof command at the repo root
  - Top-level docs aligned with export completeness, MathJax rendering, and static HTTP serving requirements
  - Regression coverage for the operator-guidance contract itself
  - Reproducible local workflow for the hardened export/dashboard path
affects: [README.md, docs/user_guide.md, docs/deployment_readiness.md, package.json]
tech-stack:
  added: []
  patterns:
    - Publish milestone proof as a named repo command rather than as an implied set of scattered test invocations
    - Keep quickstart guidance in README and detailed operator behavior in the user guide
key-files:
  created:
    - packages/web/test/operator-guidance-docs.test.ts
  modified:
    - package.json
    - README.md
    - docs/user_guide.md
    - docs/deployment_readiness.md
key-decisions:
  - "The completed Phase 10-12 regression bundle is exposed as `npm run test:acceptance:v1.2`."
  - "The docs now state that static exports always include `enrichment.json`, use bundled MathJax rendering, and must be served over HTTP."
  - "The operator guidance stays explicitly local-first and does not imply public-production readiness."
patterns-established:
  - "Operator-facing workflow promises are protected by small docs-contract tests, not just prose edits."
  - "Milestone proof commands should be named and reproducible from the repo root."
requirements-completed: [REL-01, REL-02]
duration: 16min
completed: 2026-04-03
---

# Phase 13 Plan 01 Summary

**Publish the acceptance proof and operator guidance for the hardened local workflow**

## Performance

- **Duration:** 16 min
- **Completed:** 2026-04-03
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Added `npm run test:acceptance:v1.2` at the repo root to bundle the focused Phase 10-12 regression proof into one reproducible command.
- Added a docs-contract regression test to keep the acceptance command and critical operator guidance from drifting.
- Updated `README.md` to point users to the acceptance proof command and to describe the static export/runtime/MathJax behavior at a high level.
- Updated `docs/user_guide.md` to document `data/enrichment.json`, the HTTP-only static export serving requirement, bundled MathJax normalization/fallback behavior, and the accepted proof workflow.
- Updated `docs/deployment_readiness.md` to align the local proof command and HTTP serving recommendation with the non-production positioning.

## Task Commits

1. **Task 1-3: Add the docs regression, publish the acceptance command, and align the operator guidance** - pending phase commit

## Verification

- `PATH=/opt/homebrew/bin:$PATH npm test -- packages/web/test/operator-guidance-docs.test.ts`
- `PATH=/opt/homebrew/bin:$PATH npm run test:acceptance:v1.2`
- `PATH=/opt/homebrew/bin:$PATH npm run typecheck`

## Next Phase Readiness

- `v1.2` is fully implemented and documented. The next operational step is milestone audit/completion and archival, not more feature work inside this roadmap.

---
*Phase: 13-export-acceptance-operator-guidance*
*Completed: 2026-04-03*
