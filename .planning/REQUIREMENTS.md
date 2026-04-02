# Requirements: PaperParser

**Defined:** 2026-04-02
**Core Value:** A mathematician can feed in a TeX paper and get a trustworthy dependency artifact that makes the logical structure of the paper easier to navigate.

## v1 Requirements

### Ingestion

- [ ] **INGEST-01**: User can analyze a TeX paper or TeX project rooted at `main.tex` and produce a parsed artifact without requiring PDF input.
- [ ] **INGEST-02**: User can parse one representative heavy TeX paper with the include, macro, and package handling required by that paper.
- [ ] **INGEST-03**: User receives explicit parser diagnostics for unresolved references, citations, includes, or unsupported constructs instead of silent failure.

### Objects

- [ ] **OBJ-01**: User gets first-class extracted objects for sections, theorems, lemmas, corollaries, definitions, propositions, proofs, equations, and citations.
- [ ] **OBJ-02**: Each extracted object has a stable identifier that survives downstream querying and visualization.
- [ ] **OBJ-03**: Each extracted object preserves a source anchor back to the original TeX file and span.

### Relations

- [ ] **REL-01**: User gets deterministic explicit relations derived from labels, references, citations, and other directly declared TeX links.
- [ ] **REL-02**: User gets deterministic structural relations derived from document structure such as containment or proof-to-object attachment.
- [ ] **REL-03**: Each relation records its provenance as `explicit`, `structural`, or `agent_inferred`.
- [ ] **REL-04**: Each visible deterministic relation includes evidence that explains why the edge exists.

### Explorer

- [ ] **EXPL-01**: User can open a local interactive HTML explorer generated from the canonical parsed artifact.
- [ ] **EXPL-02**: User can inspect an extracted object and see its dependencies in the explorer.
- [ ] **EXPL-03**: User can inspect a relation in the explorer and see a structured explanation of why the edge exists.
- [ ] **EXPL-04**: User can filter visible relations by provenance so deterministic and agent-inferred edges are not mixed by default.

### Enrichment

- [ ] **ENRICH-01**: User can run an optional second-pass agent enrichment step on an existing deterministic artifact.
- [ ] **ENRICH-02**: Agent-inferred relations are stored separately from the deterministic canonical artifact and do not overwrite it.
- [ ] **ENRICH-03**: Each agent-inferred relation includes confidence and evidence or explanation that can be reviewed in the explorer.

### Acceptance

- [ ] **ACC-01**: User can parse the representative heavy TeX paper end-to-end and inspect its dependency artifact locally without manual graph editing.
- [ ] **ACC-02**: Re-running deterministic parsing on the same TeX input produces stable canonical output apart from explicitly versioned parser metadata.

## v2 Requirements

### Search

- **SEARCH-01**: User can search by label, title, or object name across the parsed paper.
- **SEARCH-02**: User can jump directly from search results to the relevant object view in the explorer.

### Corpus

- **CORPUS-01**: User can manage and compare multiple parsed papers in one local library.
- **CORPUS-02**: User can navigate cross-paper citation and dependency relationships.

### Inputs

- **INPUT-01**: User can ingest PDF or OCR-derived inputs in addition to TeX sources.

### Collaboration

- **COLLAB-01**: User can export a shareable artifact for collaborators without relying on the original local workspace.
- **COLLAB-02**: Multiple users can review or annotate a parsed dependency graph.

## Out of Scope

| Feature | Reason |
|---------|--------|
| PDF ingestion in this milestone | TeX-only scope is the deliberate constraint for making dependency parsing trustworthy first |
| Public internet deployment | Current success is local-first for one mathematician, not a hosted service |
| Multi-user collaboration | Adds product and security scope that does not help the first milestone |
| Manual graph editing UI | Would mask parser and inference quality problems instead of fixing them |
| Canonical graph database backend | The existing JSON bundle is sufficient for the local-first first milestone |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INGEST-01 | Phase 1 | Completed |
| INGEST-02 | Phase 1 | Completed |
| INGEST-03 | Phase 1 | Completed |
| OBJ-01 | Phase 2 | Completed |
| OBJ-02 | Phase 2 | Completed |
| OBJ-03 | Phase 2 | Completed |
| REL-01 | Phase 2 | Completed |
| REL-02 | Phase 2 | Completed |
| REL-03 | Phase 2 | Completed |
| REL-04 | Phase 2 | Completed |
| EXPL-01 | Phase 3 | Completed |
| EXPL-02 | Phase 3 | Completed |
| EXPL-03 | Phase 3 | Completed |
| EXPL-04 | Phase 4 | Completed |
| ENRICH-01 | Phase 4 | Completed |
| ENRICH-02 | Phase 4 | Completed |
| ENRICH-03 | Phase 4 | Completed |
| ACC-01 | Phase 5 | Completed |
| ACC-02 | Phase 2 | Completed |

**Coverage:**
- v1 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-02*
*Last updated: 2026-04-02 after Phase 5 completion*
