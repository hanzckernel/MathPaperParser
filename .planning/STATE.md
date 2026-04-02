# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-02)

**Core value:** A mathematician can feed in a TeX paper and get a trustworthy dependency artifact that makes the logical structure of the paper easier to navigate.
**Current focus:** Phase 3 - Deterministic Dependency Explorer

## Current Position

Phase: 3 of 5 (Deterministic Dependency Explorer)
Plan: 0 of TBD in current phase
Status: Ready to discuss and plan
Last activity: 2026-04-02 — Phase 2 completed with anchored canonical objects, provenance-aware deterministic relations, structural-edge traversal guardrails, and green repo verification.

Progress: [████░░░░░░] 40%

## Performance Metrics

**Velocity:**
- Total plans completed: 2
- Average duration: 6.8 min
- Total execution time: 0.6 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Gold-Paper TeX Ingestion Hardening | 2 | 12 min | 6 min |
| 2. Canonical Objects & Deterministic Relations | 3 | 22 min | 7.3 min |
| 3. Deterministic Dependency Explorer | 0 | 0 min | 0 min |
| 4. Optional Agent Enrichment Review | 0 | 0 min | 0 min |
| 5. Gold-Paper Acceptance Gate | 0 | 0 min | 0 min |

**Recent Trend:**
- Last 5 plans: 01-01, 01-02, 02-01, 02-02, 02-03
- Trend: Improving

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Phase 1-2: Deterministic TeX parsing remains the trusted baseline and canonical artifact.
- Phase 3: The local HTML explorer consumes the canonical artifact; it is not the source of truth.
- Phase 4: Agent inference is an optional second-pass layer with separate storage, provenance, confidence, and evidence.
- Phase 5: Success is one representative heavy TeX paper parsed well, not broad corpus coverage.
- Phase 1: `ref/papers/long_nalini/arXiv-2502.12268v2/main.tex` is the representative acceptance paper.
- Phase 1: `main.bbl` counts as satisfying the local bibliography requirement for the gold paper on the existing ingestion path.
- Phase 1: `diagnostics.json` is persisted beside `manifest.json`, `graph.json`, and `index.json` without changing canonical bundle schema.
- Phase 1: Gold-paper reruns are stable in title/authors, node and edge counts, and warning-code shape.

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 3 still needs explicit explorer planning for dependency inspection and edge-evidence presentation.
- The gold paper still emits 46 explicit `unresolved_reference` warnings. They are acceptable for deterministic Phase 2, but they remain relevant context for explorer UX and later enrichment.

## Session Continuity

Last session: 2026-04-02 21:56 CEST
Stopped at: Phase 2 completed and Phase 3 is ready to discuss/plan
Resume file: .planning/phases/02-canonical-objects-deterministic-relations/02-03-SUMMARY.md
