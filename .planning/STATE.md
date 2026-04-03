---
gsd_state_version: 1.0
milestone: v1.3
milestone_name: Parse/Render Hardening
status: phase_planned
stopped_at: phase 14 planned; ready for execution
last_updated: "2026-04-03T20:20:14Z"
last_activity: 2026-04-03
progress:
  total_phases: 3
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-03)

**Core value:** A mathematician can feed in a TeX paper and get a trustworthy dependency artifact that makes the logical structure of the paper easier to navigate.
**Current focus:** Phase 14 planning for `v1.3 Parse/Render Hardening`

## Current Position

Phase: 14. Residual TeX Parser Hardening
Plan: 14-01
Status: Planned; execution ready
Last activity: 2026-04-03 — Planned Phase 14 around multiline heading labels, multi-label targets, bounded cleveref resolution, and duplicate-label diagnostics.

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**

- Total plans completed: 15
- Average duration: 15.3 min
- Total execution time: 3.8 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Gold-Paper TeX Ingestion Hardening | 2 | 12 min | 6 min |
| 2. Canonical Objects & Deterministic Relations | 3 | 22 min | 7.3 min |
| 3. Deterministic Dependency Explorer | 1 | 5 min | 5 min |
| 4. Optional Agent Enrichment Review | 2 | 30 min | 15 min |
| 5. Gold-Paper Acceptance Gate | 1 | 9 min | 9 min |
| 6. Searchable Bundle Index & Explorer Navigation | 1 | 12 min | 12 min |
| 7. TeX Hardening & Diagnostic Reduction | 1 | 18 min | 18 min |
| 8. Local Corpus Library & Cross-Paper Navigation | 1 | 24 min | 24 min |
| 9. Multi-Paper Acceptance Gate | 1 | 16 min | 16 min |
| 10. Export Contract Hardening | 1 | 20 min | 20 min |
| 11. Dashboard Math Rendering Repair | 1 | 28 min | 28 min |
| 12. Dashboard Bootstrap & Runtime Guardrails | 1 | 18 min | 18 min |
| 13. Export Acceptance & Operator Guidance | 1 | 16 min | 16 min |

**Recent Trend:**

- Last 5 plans: 09-01, 10-01, 11-01, 12-01, 13-01
- Trend: Stable; shifting from export/dashboard hardening into narrower parser/render hardening

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md. The milestone established:

- The deterministic canonical TeX bundle is the trusted baseline artifact.
- The local HTML explorer is a consumer of that artifact, not the source of truth.
- Agent inference is an optional second-pass sidecar with provenance, confidence, and review metadata.
- `long_nalini` is the representative acceptance paper for the shipped v1 scope.
- Phase 7 intentionally left figure references as explicit residual diagnostics instead of expanding the canonical node schema mid-milestone.
- Phase 8 keeps corpus behavior as a read model above paper-local canonical bundles.
- Phase 8 limits cross-paper navigation to explainable deterministic evidence terms rather than speculative global links.
- Phase 9 tightened acceptance to prefer meaningful real-corpus evidence terms such as `hyperbolic` and `surface`.
- Phase 10 will harden the export contract before touching more visible dashboard behavior.
- Phase 11 will repair dashboard math rendering with MathJax plus fragment normalization, without changing the canonical bundle contract.
- Phase 11 established a shared statement-rendering boundary with render-time normalization and explicit inline fallback for unsupported fragments.
- Phase 12 will treat unsupported static runtime conditions as explicit product behavior rather than undefined failure.
- Phase 12 established a dedicated top-level blocker for unsupported static `file://` usage while leaving API mode unblocked.
- Phase 13 established `npm run test:acceptance:v1.2` as the reproducible milestone proof and aligned the operator docs with the hardened local workflow.
- `v1.3` is scoped to parser/render hardening only; corpus-wide search is deferred to the next milestone.

### Pending Todos

- Execute Plan 14-01.

### Blockers/Concerns

- `long_nalini` still emits a bounded residual of `22` unresolved references and `2` unsupported reference-command diagnostics, so future parser work should not assume a perfectly clean gold paper.
- Unsupported TeX beyond the current normalization set still falls back to raw source instead of full browser-ready math rendering.
- The next parser hardening work should reduce residual diagnostics without weakening deterministic trust or canonical bundle stability.

## Session Continuity

Last session: 2026-04-03 CEST
Stopped at: Phase 14 planned; next step is execution of `14-01`
Resume file: .planning/ROADMAP.md
