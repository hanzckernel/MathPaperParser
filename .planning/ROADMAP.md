# Roadmap: PaperParser

## Milestones

- ✅ **v1.0 TeX MVP** — shipped 2026-04-02
  Archives: `.planning/milestones/v1.0-ROADMAP.md`, `.planning/milestones/v1.0-REQUIREMENTS.md`, `.planning/milestones/v1.0-MILESTONE-AUDIT.md`, `.planning/milestones/v1.0-phases/`
- ✅ **v1.1 Search, Hardening & Corpus** — shipped 2026-04-03
  Archives: `.planning/milestones/v1.1-ROADMAP.md`, `.planning/milestones/v1.1-REQUIREMENTS.md`, `.planning/milestones/v1.1-MILESTONE-AUDIT.md`, `.planning/milestones/v1.1-phases/`
- ✅ **v1.2 Dashboard, Export & Math Rendering Hardening** — shipped 2026-04-03
  Archives: `.planning/milestones/v1.2-ROADMAP.md`, `.planning/milestones/v1.2-REQUIREMENTS.md`, `.planning/milestones/v1.2-MILESTONE-AUDIT.md`
- 🚧 **v1.3 Parse/Render Hardening** — Phases 14-16 planned on 2026-04-03

## Phases

**Phase Numbering:**
- Integer phases (14, 15, 16): Planned milestone work
- Decimal phases (14.1, 14.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 14: Residual TeX Parser Hardening** - Reduce the remaining deterministic parser gaps behind unresolved diagnostics and incomplete extraction.
- [ ] **Phase 15: Math Fragment Render Hardening** - Expand render-safe normalization so more extracted mathematical fragments typeset cleanly without overstating compatibility.
- [ ] **Phase 16: Parse/Render Acceptance Gate** - Prove the upgraded parse/render workflow on the accepted corpus plus targeted hard-case fixtures.

## Phase Details

### Phase 14: Residual TeX Parser Hardening
**Goal**: Users see fewer residual deterministic parse failures on the accepted corpus while unsupported cases stay explicit and the canonical bundle remains stable.
**Depends on**: Existing `v1.2` shipped parser and accepted local corpus
**Requirements**: HARD-06, HARD-07, HARD-08
**Success Criteria** (what must be TRUE):
  1. Residual unresolved-reference diagnostics on the accepted corpus drop below the shipped `v1.2` baseline.
  2. The next targeted deterministic TeX gap classes are handled without manual graph repair.
  3. Parser hardening remains rerun-stable and preserves compatibility for CLI, API, dashboard, and MCP consumers.

### Phase 15: Math Fragment Render Hardening
**Goal**: Users see fewer raw-source math fallbacks because more extracted fragments normalize and typeset safely through the existing MathJax boundary.
**Depends on**: Phase 14
**Requirements**: MATH-04, MATH-05, MATH-06
**Success Criteria** (what must be TRUE):
  1. More accepted-corpus and targeted hard-case fragments render successfully instead of falling back.
  2. The next targeted fragment classes are normalized safely without relying on unsupported browser-side package behavior.
  3. Unsupported or ambiguous cases still degrade through explicit fallback or diagnostics instead of silent mis-rendering.
**UI hint**: yes

### Phase 16: Parse/Render Acceptance Gate
**Goal**: Users can rely on a reproducible milestone proof for the upgraded parse/render workflow on the accepted corpus plus targeted regression fixtures.
**Depends on**: Phase 15
**Requirements**: ACC-04, ACC-05
**Success Criteria** (what must be TRUE):
  1. The local `analyze -> validate -> inspect` workflow passes on the accepted local corpus without manual graph editing.
  2. Verification covers parser hardening and render hardening on both real-corpus and targeted hard-case fixtures.
  3. The milestone proof is reproducible from a named acceptance workflow instead of scattered manual checks.

## Progress

| Milestone | Scope | Status | Shipped |
|-----------|-------|--------|---------|
| v1.0 TeX MVP | Phases 1-5 | Complete | 2026-04-02 |
| v1.1 Search, Hardening & Corpus | Phases 6-9 | Complete | 2026-04-03 |
| v1.2 Dashboard, Export & Math Rendering Hardening | Phases 10-13 | Complete | 2026-04-03 |
| v1.3 Parse/Render Hardening | Phases 14-16 | Planned | - |
