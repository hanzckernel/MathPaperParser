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

## Milestone: v1.2 — Dashboard, Export & Math Rendering Hardening

**Shipped:** 2026-04-03
**Phases:** 4 | **Plans:** 4 | **Sessions:** 1

### What Was Built

- A hardened static export contract with strict `--paper latest` resolution, deterministic output replacement, and explicit `data/enrichment.json`
- Shared MathJax statement rendering with normalization for hard line breaks and package-dependent fragments plus inline raw-source fallback
- Explicit dashboard runtime guardrails for unsupported static `file://` usage and strict `#root` bootstrap enforcement
- A named repo-level acceptance proof command and aligned operator docs for the supported local export-and-serve workflow

### What Worked

- Sequencing the work as export contract -> math rendering -> runtime guardrails -> operator proof kept each phase narrow and verifiable.
- The named acceptance bundle made closeout evidence much easier to rerun than the earlier scattered test-command pattern.

### What Was Inefficient

- The archive helper still required a manual pass to collapse the live roadmap and evolve `PROJECT.md` after moving the archive files.
- Nyquist validation artifacts were still absent for phases 10-13, so audit confidence relied on verification reports plus a fresh acceptance rerun.

### Patterns Established

- Export-contract hardening should happen before UI/runtime debugging when static data completeness is part of the symptom surface.
- Browser math rendering needs a shared normalization/fallback boundary instead of scattered component-level TeX handling.
- Unsupported local runtimes should fail explicitly at the app boundary, not degrade into generic loading or blank-shell states.
- Milestone proof commands should be named at the repo root and regression-tested through docs contracts.

### Key Lessons

1. Hard line breaks and package-dependent TeX are a boundary problem; normalize fragments before browser typesetting instead of expecting rescue packages to make malformed input safe.
2. If a runtime mode is unsupported, block it explicitly with the recovery command at the top level rather than letting the failure masquerade as a data or rendering bug.

### Cost Observations

- Model mix: Balanced profile throughout execution
- Sessions: 1
- Notable: Most of the milestone cost came from end-to-end proof and contract alignment, not from the individual code changes.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | 1 | 5 | Established deterministic-bundle-first delivery with optional enrichment sidecars |
| v1.1 | 1 | 4 | Added search, corpus navigation, and real-corpus acceptance on top of the shipped bundle/store contract |
| v1.2 | 1 | 4 | Hardened export, browser math rendering, runtime guardrails, and the local operator proof workflow |

### Cumulative Quality

| Milestone | Tests | Coverage | New Runtime Deps |
|-----------|-------|----------|------------------|
| v1.0 | 66 | N/A | 0 |
| v1.1 | 77 | N/A | 0 |
| v1.2 | 26 | N/A | 1 (`mathjax`) |

### Top Lessons (Verified Across Milestones)

1. Create verification artifacts during execution, not at archival time.
2. Keep deterministic and probabilistic outputs separate whenever trust matters.
3. Real-corpus evidence quality deserves explicit assertions whenever search or matching affects the user-facing workflow.
4. Explicit product guardrails are cheaper to debug than ambiguous runtime failures.
