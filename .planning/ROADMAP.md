# Roadmap: PaperParser

## Milestones

- ✅ **v1.0 TeX MVP** — shipped 2026-04-02
  Archives: `.planning/milestones/v1.0-ROADMAP.md`, `.planning/milestones/v1.0-REQUIREMENTS.md`, `.planning/milestones/v1.0-MILESTONE-AUDIT.md`, `.planning/milestones/v1.0-phases/`
- ✅ **v1.1 Search, Hardening & Corpus** — shipped 2026-04-03
  Archives: `.planning/milestones/v1.1-ROADMAP.md`, `.planning/milestones/v1.1-REQUIREMENTS.md`, `.planning/milestones/v1.1-MILESTONE-AUDIT.md`, `.planning/milestones/v1.1-phases/`
- ✅ **v1.2 Dashboard, Export & Math Rendering Hardening** — shipped 2026-04-03
  Archives: `.planning/milestones/v1.2-ROADMAP.md`, `.planning/milestones/v1.2-REQUIREMENTS.md`, `.planning/milestones/v1.2-MILESTONE-AUDIT.md`
- ✅ **v1.3 Parse/Render Hardening** — shipped 2026-04-03
  Archives: `.planning/milestones/v1.3-ROADMAP.md`, `.planning/milestones/v1.3-REQUIREMENTS.md`, `.planning/milestones/v1.3-MILESTONE-AUDIT.md`
- ✅ **v1.4 GCP Cloud Run Deployment Hardening** — shipped 2026-04-04
  Archives: `.planning/milestones/v1.4-ROADMAP.md`, `.planning/milestones/v1.4-REQUIREMENTS.md`, `.planning/milestones/v1.4-MILESTONE-AUDIT.md`, `.planning/milestones/v1.4-phases/`

## Current State

- Active milestone: none
- Next execution step: `$gsd-new-milestone`
- Phase numbering resumes from 23 when the next milestone opens.

## Milestone Summary

- `v1.0` established the deterministic canonical bundle, explorer, and optional enrichment model.
- `v1.1` added paper-local search, corpus navigation, and multi-paper acceptance proof.
- `v1.2` hardened export, runtime, and baseline MathJax rendering for supported local dashboards.
- `v1.3` reduced residual parser gaps, hardened exported MathJax runtime behavior, and published a named parse/render acceptance proof.
- `v1.4` shipped the first supported shared deployment path on Google Cloud Run, with explicit request boundaries, authenticated access, mounted persistence, a named proof workflow, and a wiki-style project entry page.

## Next Milestone Setup

- Corpus-wide search across stored papers remains deferred.
- Collaborator-facing review and export workflows remain deferred.
- PDF and OCR ingestion remain deferred.
- Deployment follow-up work still available includes CI-managed smoke automation, rate limiting, and streaming upload handling.

## Progress

| Milestone | Scope | Status | Shipped |
|-----------|-------|--------|---------|
| v1.0 TeX MVP | Phases 1-5 | Complete | 2026-04-02 |
| v1.1 Search, Hardening & Corpus | Phases 6-9 | Complete | 2026-04-03 |
| v1.2 Dashboard, Export & Math Rendering Hardening | Phases 10-13 | Complete | 2026-04-03 |
| v1.3 Parse/Render Hardening | Phases 14-16 | Complete | 2026-04-03 |
| v1.4 GCP Cloud Run Deployment Hardening | Phases 17-22 | Complete | 2026-04-04 |
