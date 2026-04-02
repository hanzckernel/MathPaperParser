---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Search, Hardening & Corpus
status: defining_requirements
stopped_at: drafting v1.1 requirements and roadmap
last_updated: "2026-04-02T23:06:33Z"
last_activity: 2026-04-03
progress:
  total_phases: 4
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-03)

**Core value:** A mathematician can feed in a TeX paper and get a trustworthy dependency artifact that makes the logical structure of the paper easier to navigate.
**Current focus:** Defining the `v1.1 Search, Hardening & Corpus` milestone

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-04-03 — Started milestone `v1.1 Search, Hardening & Corpus` and scoped it around search, parser hardening, and local corpus support.

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 9
- Average duration: 8.2 min
- Total execution time: 1.2 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Gold-Paper TeX Ingestion Hardening | 2 | 12 min | 6 min |
| 2. Canonical Objects & Deterministic Relations | 3 | 22 min | 7.3 min |
| 3. Deterministic Dependency Explorer | 1 | 5 min | 5 min |
| 4. Optional Agent Enrichment Review | 2 | 30 min | 15 min |
| 5. Gold-Paper Acceptance Gate | 1 | 9 min | 9 min |

**Recent Trend:**
- Last 5 plans: 02-03, 03-01, 04-01, 04-02, 05-01
- Trend: Stable and complete

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md. The milestone established:

- The deterministic canonical TeX bundle is the trusted baseline artifact.
- The local HTML explorer is a consumer of that artifact, not the source of truth.
- Agent inference is an optional second-pass sidecar with provenance, confidence, and review metadata.
- `long_nalini` is the representative acceptance paper for the shipped v1 scope.

### Pending Todos

- Plan Phase 6 for search and explorer navigation.
- Use `medium_Mueller.flat.tex` and `short_Petri.tex` as the additional corpus acceptance papers.

### Blockers/Concerns

- The representative paper still emits unresolved-reference diagnostics, and the milestone now commits to reducing that baseline rather than only documenting it.
- Corpus scope is local-first and explainable; cross-paper navigation should not drift into speculative global linking.
- The milestone corpus now spans three papers, which raises the hardening bar for Phase 7 and the acceptance bar for Phase 9.

## Session Continuity

Last session: 2026-04-03 CEST
Stopped at: `v1.1` milestone started; next step is planning Phase 6 from the approved roadmap
Resume file: .planning/REQUIREMENTS.md
