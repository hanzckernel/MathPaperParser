# Roadmap: PaperParser

## Overview

This roadmap stays narrow on the approved v1 success bar: one representative heavy TeX paper should parse deterministically into the existing `manifest` / `graph` / `index` bundle, expose trustworthy dependency structure for a local mathematician, and only then allow optional agent enrichment as a clearly separate layer. Search, PDF ingestion, collaboration, hosted deployment, and graph-database work are intentionally excluded from the phase structure because they do not move that milestone forward.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: Gold-Paper TeX Ingestion Hardening** - Make one heavy `main.tex` project ingest reliably with explicit diagnostics.
- [ ] **Phase 2: Canonical Objects & Deterministic Relations** - Emit a stable canonical artifact with typed objects, source anchors, and provenance-aware deterministic edges.
- [ ] **Phase 3: Deterministic Dependency Explorer** - Let a local mathematician inspect deterministic dependencies and edge evidence in a local HTML explorer.
- [ ] **Phase 4: Optional Agent Enrichment Review** - Add opt-in agent-proposed relations as a separate reviewable layer.
- [ ] **Phase 5: Gold-Paper Acceptance Gate** - Prove the milestone on the representative heavy paper without manual graph editing.

## Phase Details

### Phase 1: Gold-Paper TeX Ingestion Hardening
**Goal**: Users can parse the representative heavy TeX project from `main.tex` with explicit diagnostics and without relying on PDF input.
**Depends on**: Nothing (first phase)
**Requirements**: INGEST-01, INGEST-02, INGEST-03
**Success Criteria** (what must be TRUE):
  1. User can analyze a TeX paper or TeX project rooted at `main.tex` and receive a parsed artifact without requiring PDF input.
  2. The representative heavy TeX paper parses with the include, macro, and package handling required by that paper.
  3. User receives explicit diagnostics for unresolved references, citations, includes, or unsupported constructs instead of silent failure.
**Plans**: TBD

### Phase 2: Canonical Objects & Deterministic Relations
**Goal**: Users can trust the deterministic canonical artifact as the source of truth for extracted math objects and deterministic dependencies.
**Depends on**: Phase 1
**Requirements**: OBJ-01, OBJ-02, OBJ-03, REL-01, REL-02, REL-03, REL-04, ACC-02
**Success Criteria** (what must be TRUE):
  1. User gets first-class extracted objects for sections, theorems, lemmas, corollaries, definitions, propositions, proofs, equations, and citations in the canonical artifact.
  2. Each extracted object keeps a stable identifier and a source anchor back to the original TeX file and span.
  3. User gets deterministic explicit and structural relations that are stored with distinct provenance and evidence explaining why each visible deterministic edge exists.
  4. Re-running deterministic parsing on the same TeX input produces stable canonical output apart from explicitly versioned parser metadata.
**Plans**: TBD

### Phase 3: Deterministic Dependency Explorer
**Goal**: Users can inspect deterministic dependencies locally and understand why those edges exist without starting from raw TeX.
**Depends on**: Phase 2
**Requirements**: EXPL-01, EXPL-02, EXPL-03
**Success Criteria** (what must be TRUE):
  1. User can open a local interactive HTML explorer generated from the canonical parsed artifact.
  2. User can inspect an extracted object and see its dependencies in the explorer.
  3. User can inspect a relation in the explorer and see a structured explanation of why the edge exists.
**Plans**: TBD
**UI hint**: yes

### Phase 4: Optional Agent Enrichment Review
**Goal**: Users can optionally review agent-proposed semantic dependencies without letting probabilistic output overwrite the canonical artifact.
**Depends on**: Phase 3
**Requirements**: EXPL-04, ENRICH-01, ENRICH-02, ENRICH-03
**Success Criteria** (what must be TRUE):
  1. User can run an optional second-pass agent enrichment step on an existing deterministic artifact.
  2. Agent-inferred relations are stored separately from the deterministic canonical artifact and do not overwrite it.
  3. Each agent-inferred relation includes confidence and supporting evidence or explanation that the user can review.
  4. User can filter visible relations by provenance in the explorer so deterministic edges are the default view and agent-inferred edges are opt-in.
**Plans**: TBD
**UI hint**: yes

### Phase 5: Gold-Paper Acceptance Gate
**Goal**: Users can complete the full accepted local workflow on one representative heavy TeX paper and treat it as the milestone proof point.
**Depends on**: Phase 4
**Requirements**: ACC-01
**Success Criteria** (what must be TRUE):
  1. User can parse the representative heavy TeX paper end-to-end and inspect its dependency artifact locally without manual graph editing.
  2. User can repeat the representative-paper workflow from parse to local inspection without inserting manual repair steps between those stages.
  3. User can use the resulting artifact for the milestone’s intended workflow: inspect objects, inspect dependencies, and inspect edge explanations on that one paper.
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Gold-Paper TeX Ingestion Hardening | 0/TBD | Not started | - |
| 2. Canonical Objects & Deterministic Relations | 0/TBD | Not started | - |
| 3. Deterministic Dependency Explorer | 0/TBD | Not started | - |
| 4. Optional Agent Enrichment Review | 0/TBD | Not started | - |
| 5. Gold-Paper Acceptance Gate | 0/TBD | Not started | - |
