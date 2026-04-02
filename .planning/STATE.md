# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-02)

**Core value:** A mathematician can feed in a TeX paper and get a trustworthy dependency artifact that makes the logical structure of the paper easier to navigate.
**Current focus:** Phase 2 - Canonical Objects & Deterministic Relations

## Current Position

Phase: 2 of 5 (Canonical Objects & Deterministic Relations)
Plan: 0 of TBD in current phase
Status: Ready to discuss and plan
Last activity: 2026-04-02 — Phase 1 completed with green acceptance, persisted diagnostics, and stable gold-paper reruns.

Progress: [██░░░░░░░░] 20%

## Performance Metrics

**Velocity:**
- Total plans completed: 2
- Average duration: 6 min
- Total execution time: 0.2 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Gold-Paper TeX Ingestion Hardening | 2 | 12 min | 6 min |
| 2. Canonical Objects & Deterministic Relations | 0 | 0 min | 0 min |
| 3. Deterministic Dependency Explorer | 0 | 0 min | 0 min |
| 4. Optional Agent Enrichment Review | 0 | 0 min | 0 min |
| 5. Gold-Paper Acceptance Gate | 0 | 0 min | 0 min |

**Recent Trend:**
- Last 5 plans: 01-01, 01-02
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

- Phase 2 still needs a planning pass for source anchors, object coverage, and deterministic relation provenance.
- The gold paper still emits 46 explicit `unresolved_reference` warnings, which are acceptable in Phase 1 but likely relevant context for deterministic relation work.

## Session Continuity

Last session: 2026-04-02 21:12 CEST
Stopped at: Phase 1 completed and Phase 2 is ready to discuss/plan
Resume file: .planning/phases/01-gold-paper-tex-ingestion-hardening/01-02-SUMMARY.md
