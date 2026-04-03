# Roadmap: PaperParser

## Overview

This roadmap advances the approved `v1.2` scope only: export contract hardening, MathJax-based dashboard math rendering with fragment normalization, dashboard bootstrap/runtime reliability, and milestone proof for the supported local export workflow. PDF/OCR ingestion, collaborator review, global corpus search, and production deployment remain deferred because they do not resolve the current persistent rendering problem.

## Milestones

- ✅ **v1.0 TeX MVP** — Phases 1-5 shipped 2026-04-02
  Archives: `.planning/milestones/v1.0-ROADMAP.md`, `.planning/milestones/v1.0-REQUIREMENTS.md`, `.planning/milestones/v1.0-MILESTONE-AUDIT.md`, `.planning/milestones/v1.0-phases/`
- ✅ **v1.1 Search, Hardening & Corpus** — Phases 6-9 shipped 2026-04-03
  Archives: `.planning/milestones/v1.1-ROADMAP.md`, `.planning/milestones/v1.1-REQUIREMENTS.md`, `.planning/milestones/v1.1-MILESTONE-AUDIT.md`, `.planning/milestones/v1.1-phases/`
- 🚧 **v1.2 Dashboard, Export & Math Rendering Hardening** — Phases 10-13 planned on 2026-04-03

## Phases

**Phase Numbering:**
- Integer phases (10, 11, 12, 13): Planned milestone work
- Decimal phases (10.1, 10.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 10: Export Contract Hardening** - Make CLI export deterministic for latest-paper selection and complete static data payloads.
- [ ] **Phase 11: Dashboard Math Rendering Repair** - Restore readable MathJax-based mathematical rendering in the current dashboard without changing the canonical bundle text contract.
- [ ] **Phase 12: Dashboard Bootstrap & Runtime Guardrails** - Eliminate silent render failures by aligning the exported shell, React mount expectations, and unsupported static runtime behavior.
- [ ] **Phase 13: Export Acceptance & Operator Guidance** - Prove the supported local export workflow and document the serving/runtime expectations clearly.

## Phase Details

### Phase 10: Export Contract Hardening
**Goal**: Users can trust the static export payload and target-paper selection before the dashboard even starts.
**Depends on**: Existing `v1.1` stored-paper export path
**Requirements**: EXPORT-01, EXPORT-02
**Success Criteria** (what must be TRUE):
  1. `paperparser export --paper latest` resolves the latest stored paper instead of treating `latest` as a literal ID.
  2. Every static export writes `manifest.json`, `graph.json`, `index.json`, and `enrichment.json`, with explicit `null` when enrichment is absent.
  3. The resulting exported data layout stays compatible with the shipped dashboard data loader for both Markdown and TeX fixture papers.
**Plans**: `10-01` pending

### Phase 11: Dashboard Math Rendering Repair
**Goal**: Users can read mathematical statements and equations naturally in the current dashboard instead of parsing raw source strings.
**Depends on**: Phase 10
**Requirements**: MATH-01, MATH-02, MATH-03
**Success Criteria** (what must be TRUE):
  1. The dashboard renders statement-level mathematical text with MathJax in the key reading surfaces where users inspect paper content.
  2. Math-heavy theorem/equation content remains readable on the accepted local papers instead of degrading into raw LaTeX-only display when the source contains hard line breaks.
  3. Extracted fragments are normalized before rendering so package-dependent constructs do not rely on `amsmath` or `amsthm` addons in the browser.
  4. Invalid or unsupported math fragments fail gracefully without breaking the rest of the page.
**Plans**: `11-01` pending
**UI hint**: yes

### Phase 12: Dashboard Bootstrap & Runtime Guardrails
**Goal**: Users can open supported dashboard exports without a blank shell, and unsupported runtime usage fails explicitly.
**Depends on**: Phase 11
**Requirements**: EXPORT-03, DASH-01, DASH-02, DASH-03
**Success Criteria** (what must be TRUE):
  1. Supported exported dashboards served over HTTP mount into the expected `#root` container and load the exported paper data.
  2. Static exports opened directly from `file://` show a clear actionable blocker message instead of a silent or persistent render failure.
  3. API-backed dashboard usage is not incorrectly blocked by static-export safeguards.
  4. Built dashboard shells and exported artifacts no longer disagree about the mount target or bootstrap assumptions.
**Plans**: `12-01` pending
**UI hint**: yes

### Phase 13: Export Acceptance & Operator Guidance
**Goal**: Users can reproduce the accepted local export workflow from the docs and treat it as the milestone proof point.
**Depends on**: Phase 12
**Requirements**: REL-01, REL-02
**Success Criteria** (what must be TRUE):
  1. Regression coverage proves export completeness, MathJax rendering behavior, shell bootstrap, and runtime guard behavior.
  2. Repo docs explain how to export and serve a dashboard bundle, including the HTTP requirement for static exports and the expected MathJax normalization/rendering behavior.
  3. The milestone proof is reproducible from the documented local workflow without hidden setup steps.
**Plans**: `13-01` pending

## Progress

| Milestone | Scope | Status | Shipped |
|-----------|-------|--------|---------|
| v1.0 TeX MVP | Phases 1-5 | Complete | 2026-04-02 |
| v1.1 Search, Hardening & Corpus | Phases 6-9 | Complete | 2026-04-03 |
| v1.2 Dashboard, Export & Math Rendering Hardening | Phases 10-13 | Planned | — |
