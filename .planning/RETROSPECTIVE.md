# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — TeX MVP

**Shipped:** 2026-04-02
**Phases:** 5 | **Plans:** 9 | **Sessions:** 1

### What Was Built

- Representative-paper TeX ingestion hardening with explicit diagnostics and persisted diagnostics sidecars
- A deterministic canonical artifact with first-class mathematical objects, source anchors, provenance-aware relations, and rerun stability
- A local dependency explorer with structured edge explanations and provenance-gated optional enrichment review
- An executable end-to-end CLI acceptance workflow on `long_nalini`

### What Worked

- Reusing the existing monorepo surfaces kept the milestone focused on shipped behavior instead of infrastructure churn.
- Keeping deterministic parsing and agent enrichment as separate layers made verification straightforward and trust boundaries explicit.

### What Was Inefficient

- Phase verification reports were not generated during execution and had to be reconstructed during closeout.
- A couple of Phase 2 plan artifact names drifted from the final shipped test filenames, which created avoidable closeout noise.

### Patterns Established

- Canonical machine-readable graph first; UI, CLI, MCP, and enrichment all consume that contract.
- Sidecar artifacts can add capabilities (`diagnostics.json`, `enrichment.json`) without destabilizing the canonical bundle.
- Structural edges should remain stored for context while theorem-centric dependency traversal uses a stricter allowlist.

### Key Lessons

1. Generate `VERIFICATION.md` during phase execution if the workflow expects it later; retroactive reconstruction is wasted closeout work.
2. Provenance and evidence need to be first-class from the start in math-oriented graph tooling, because trust is the product.

### Cost Observations

- Model mix: Balanced profile throughout execution
- Sessions: 1
- Notable: The milestone fit inside the existing architecture without requiring a rewrite, which kept implementation time low.

---

## Milestone: v1.1 — Search, Hardening & Corpus

**Shipped:** 2026-04-03
**Phases:** 4 | **Plans:** 4 | **Sessions:** 1

### What Was Built

- Paper-local search with richer disambiguation metadata and direct explorer navigation across CLI, API, MCP, and the dashboard
- Deterministic TeX hardening across `long_nalini`, `medium_Mueller.flat.tex`, and `short_Petri.tex`
- A local corpus read model with explainable cross-paper navigation and paper-aware UI/API metadata
- A real-corpus acceptance gate for the three-paper workflow

### What Worked

- Building search and corpus features on the shipped canonical/stored-paper surfaces avoided architectural churn.
- Real-corpus acceptance tests exposed ranking-quality issues early enough to fix them before closeout.

### What Was Inefficient

- The milestone closeout still required manual audit assembly because Nyquist validation artifacts were never created for phases 6-9.
- Corpus matching needed one late cleanup pass because synthetic overlap was too weak a proxy for user-facing evidence quality.

### Patterns Established

- Search should accelerate the existing explorer instead of introducing a second navigation surface.
- Corpus behavior can remain a read model above paper-local bundles while still shipping across CLI, API, MCP, and web surfaces.
- Acceptance tests for ranking or matching logic need evidence-quality assertions, not just non-empty results.

### Key Lessons

1. Real-corpus acceptance should verify evidence quality whenever ranking heuristics are user-facing.
2. Keep corpus features above the canonical graph until there is an explicit milestone for merged-graph semantics.

### Cost Observations

- Model mix: Balanced profile throughout execution
- Sessions: 1
- Notable: Reusing the existing bundle/store contracts kept the milestone small enough that the main cost came from verification depth, not implementation churn.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | 1 | 5 | Established deterministic-bundle-first delivery with optional enrichment sidecars |
| v1.1 | 1 | 4 | Added search, corpus navigation, and real-corpus acceptance on top of the shipped bundle/store contract |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | 66 | N/A | 0 |
| v1.1 | 77 | N/A | 0 |

### Top Lessons (Verified Across Milestones)

1. Create verification artifacts during execution, not at archival time.
2. Keep deterministic and probabilistic outputs separate whenever trust matters.
3. Real-corpus evidence quality deserves explicit assertions whenever search or matching affects the user-facing workflow.
