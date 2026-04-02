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

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | 1 | 5 | Established deterministic-bundle-first delivery with optional enrichment sidecars |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | 66 | N/A | 0 |

### Top Lessons (Verified Across Milestones)

1. Create verification artifacts during execution, not at archival time.
2. Keep deterministic and probabilistic outputs separate whenever trust matters.
