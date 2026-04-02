# Roadmap: PaperParser

## Overview

This roadmap advances the approved `v1.1` scope only: paper-local search, parser hardening on unresolved references and broader TeX patterns, and a local multi-paper corpus with explainable cross-paper navigation. PDF/OCR ingestion, collaborator-facing review, and hosted deployment remain deferred because they do not move the current milestone forward.

## Milestones

- ✅ **v1.0 TeX MVP** — Phases 1-5 shipped 2026-04-02
  Archives: `.planning/milestones/v1.0-ROADMAP.md`, `.planning/milestones/v1.0-REQUIREMENTS.md`, `.planning/milestones/v1.0-MILESTONE-AUDIT.md`, `.planning/milestones/v1.0-phases/`
- 🚧 **v1.1 Search, Hardening & Corpus** — Phases 6-9 planned on 2026-04-03

## Phases

**Phase Numbering:**
- Integer phases (6, 7, 8, 9): Planned milestone work
- Decimal phases (6.1, 6.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 6: Searchable Bundle Index & Explorer Navigation** - Add paper-local search and direct navigation into the explorer using the shipped stored-paper surfaces.
- [x] **Phase 7: TeX Hardening & Diagnostic Reduction** - Reduce unresolved references on the gold paper and broaden deterministic TeX coverage across `medium_Mueller.flat.tex` and `short_Petri.tex`.
- [ ] **Phase 8: Local Corpus Library & Cross-Paper Navigation** - Support multiple stored papers and explainable cross-paper navigation without collapsing paper boundaries.
- [ ] **Phase 9: Multi-Paper Acceptance Gate** - Prove the full milestone on `long_nalini`, `medium_Mueller.flat.tex`, and `short_Petri.tex` without manual graph editing.

## Phase Details

### Phase 6: Searchable Bundle Index & Explorer Navigation
**Goal**: Users can find objects in a parsed paper by label, title, or object name and jump directly into the explorer.
**Depends on**: Existing `v1.0` stored-paper and explorer surfaces
**Requirements**: SEARCH-01, SEARCH-02, SEARCH-03, SEARCH-04
**Success Criteria** (what must be TRUE):
  1. User can search a stored parsed paper by label, title, or object name.
  2. Search results provide enough context to disambiguate matches before navigation.
  3. User can jump directly from a result into the relevant explorer object view.
  4. Search behavior stays consistent across the shipped local surfaces that already consume the canonical bundle.
**Plans**: `06-01` completed on 2026-04-03
**UI hint**: yes

### Phase 7: TeX Hardening & Diagnostic Reduction
**Goal**: Users can trust that the parser handles a broader real-paper TeX corpus while surfacing fewer unresolved references on the gold paper.
**Depends on**: Phase 6
**Requirements**: HARD-01, HARD-02, HARD-03, HARD-04, HARD-05
**Success Criteria** (what must be TRUE):
  1. The `long_nalini` baseline emits fewer unresolved-reference diagnostics than `v1.0`, and any remaining gaps stay explicit.
  2. Both `medium_Mueller.flat.tex` and `short_Petri.tex` parse without manual repair steps.
  3. The parser handles the additional reference, bibliography, inclusion, and fixture-specific patterns needed by the milestone corpus.
  4. Deterministic parsing remains rerun-stable and safe for downstream consumers.
**Plans**: `07-01` completed on 2026-04-03

### Phase 8: Local Corpus Library & Cross-Paper Navigation
**Goal**: Users can manage multiple local parsed papers and move between explainable cross-paper links without losing paper boundaries.
**Depends on**: Phase 7
**Requirements**: CORP-01, CORP-02, CORP-03, CORP-04
**Success Criteria** (what must be TRUE):
  1. User can store and list multiple parsed papers locally without ID or artifact collisions.
  2. User can switch the explorer between stored papers without manual rebuild steps.
  3. Cross-paper navigation only appears when the system has explicit or explainable evidence for the link.
  4. Cross-paper views clearly identify the paper origin of each object and relation.
**UI hint**: yes

### Phase 9: Multi-Paper Acceptance Gate
**Goal**: Users can run the accepted local workflow across a small real-paper corpus and treat it as the milestone proof point.
**Depends on**: Phase 8
**Requirements**: ACC-01, ACC-02, ACC-03
**Success Criteria** (what must be TRUE):
  1. User can complete `analyze -> validate -> search -> inspect` on `long_nalini`.
  2. User can repeat the same workflow on a corpus containing `long_nalini`, `medium_Mueller.flat.tex`, and `short_Petri.tex`.
  3. Verification covers search navigation, parser hardening, and corpus behavior without manual graph editing.

## Progress

| Milestone | Scope | Status | Shipped |
|-----------|-------|--------|---------|
| v1.0 TeX MVP | Phases 1-5 | Complete | 2026-04-02 |
| v1.1 Search, Hardening & Corpus | Phases 6-9 | In Progress | — |
