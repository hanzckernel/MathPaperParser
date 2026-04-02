# Requirements: PaperParser

**Defined:** 2026-04-03
**Core Value:** A mathematician can feed in a TeX paper and get a trustworthy dependency artifact that makes the logical structure of the paper easier to navigate.

## v1 Requirements

### Search

- [x] **SEARCH-01**: User can search a stored parsed paper by label, title, or object name.
- [x] **SEARCH-02**: User can see enough result context to distinguish matches before navigating, including object type and paper-local identity.
- [x] **SEARCH-03**: User can jump directly from a search result to the relevant object view in the local explorer.
- [x] **SEARCH-04**: User gets consistent search behavior across the shipped local surfaces that already read the canonical stored-paper bundle.

### Hardening

- [ ] **HARD-01**: User sees fewer unresolved-reference diagnostics on `ref/papers/long_nalini/arXiv-2502.12268v2/main.tex` than the `v1.0` baseline, while remaining gaps stay explicit.
- [ ] **HARD-02**: User can parse both `ref/papers/medium_Mueller.flat.tex` and `ref/papers/short_Petri.tex` in addition to `long_nalini` without manual graph repair steps.
- [ ] **HARD-03**: Parser handles the broader set of TeX reference, bibliography, inclusion, and fixture-specific patterns encountered across `long_nalini`, `medium_Mueller.flat.tex`, and `short_Petri.tex`.
- [ ] **HARD-04**: Unsupported or ambiguous TeX constructs still produce explicit diagnostics instead of silent failure or invented deterministic links.
- [ ] **HARD-05**: Deterministic parsing remains rerun-stable and keeps the canonical artifact valid for downstream CLI, API, dashboard, and MCP consumers.

### Corpus

- [ ] **CORP-01**: User can store and list multiple parsed papers in the local corpus without collisions between paper IDs, bundles, or diagnostics.
- [ ] **CORP-02**: User can switch the explorer between stored papers without manual rebuilding or file shuffling.
- [ ] **CORP-03**: User can follow cross-paper navigation when the system has explicit or explainable evidence for the link.
- [ ] **CORP-04**: Cross-paper views preserve paper boundaries and show which paper each object and relation belongs to.

### Acceptance

- [ ] **ACC-01**: User can complete the local `analyze -> validate -> search -> inspect` workflow on `long_nalini`.
- [ ] **ACC-02**: User can complete the same workflow on a local corpus containing `long_nalini`, `medium_Mueller.flat.tex`, and `short_Petri.tex`.
- [ ] **ACC-03**: Milestone verification covers search navigation, parser hardening, and corpus behavior without requiring manual graph editing.

## v2 Requirements

### Inputs

- **INPUT-01**: User can ingest PDF or OCR-derived inputs in addition to TeX sources.

### Collaboration

- **COLLAB-01**: User can export a shareable artifact for collaborators without relying on the original local workspace.
- **COLLAB-02**: Collaborators can review or annotate a parsed dependency graph without changing the canonical trust model.

### Corpus

- **CORP-05**: User can search across the entire local corpus from one global entry point instead of searching one paper at a time.

## Out of Scope

| Feature | Reason |
|---------|--------|
| PDF or OCR ingestion in `v1.1` | TeX hardening and corpus quality need to stabilize before adding a noisier input mode |
| Collaborator-facing review workflows in `v1.1` | The approved milestone is local-first for one mathematician, not multi-user review |
| Hosted or internet-facing deployment | Current value is local-first and single-user |
| Manual graph editing | Would mask parser and corpus quality issues instead of fixing them at the source |
| Treating agent-inferred cross-paper links as canonical truth | Corpus navigation must remain explainable and trustworthy |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEARCH-01 | Phase 6 | Completed |
| SEARCH-02 | Phase 6 | Completed |
| SEARCH-03 | Phase 6 | Completed |
| SEARCH-04 | Phase 6 | Completed |
| HARD-01 | Phase 7 | Pending |
| HARD-02 | Phase 7 | Pending |
| HARD-03 | Phase 7 | Pending |
| HARD-04 | Phase 7 | Pending |
| HARD-05 | Phase 7 | Pending |
| CORP-01 | Phase 8 | Pending |
| CORP-02 | Phase 8 | Pending |
| CORP-03 | Phase 8 | Pending |
| CORP-04 | Phase 8 | Pending |
| ACC-01 | Phase 9 | Pending |
| ACC-02 | Phase 9 | Pending |
| ACC-03 | Phase 9 | Pending |

**Coverage:**
- v1 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-03*
*Last updated: 2026-04-03 after milestone v1.1 definition*
