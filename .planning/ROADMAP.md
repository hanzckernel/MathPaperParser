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
- 🚧 **v1.5 GCP Deployment & CI/CD** — Phases 23-26 planned on 2026-04-06

## Current State

- Active milestone: `v1.5 GCP Deployment & CI/CD`
- Next execution step: `$gsd-plan-phase 24`
- Phase numbering continues from 23 for this milestone.

## Milestone Summary

- `v1.0` established the deterministic canonical bundle, explorer, and optional enrichment model.
- `v1.1` added paper-local search, corpus navigation, and multi-paper acceptance proof.
- `v1.2` hardened export, runtime, and baseline MathJax rendering for supported local dashboards.
- `v1.3` reduced residual parser gaps, hardened exported MathJax runtime behavior, and published a named parse/render acceptance proof.
- `v1.4` shipped the first supported shared deployment path on Google Cloud Run, with explicit request boundaries, authenticated access, mounted persistence, a named proof workflow, and a wiki-style project entry page.
- `v1.5` targets the first live GCP deployment plus CI/CD on top of the shipped Cloud Run contract.

## Phases

**Phase Numbering:**
- Integer phases (23, 24, 25, 26): Planned milestone work
- Decimal phases (23.1, 23.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 23: GCP Bootstrap & First Live Deployment** - Turn the `v1.4` operator contract into a real deployed Cloud Run environment on GCP.
- [ ] **Phase 24: CI Validation & Image Release Pipeline** - Add automated validation and immutable image publishing for the supported hosted-source path.
- [ ] **Phase 25: Secretless CD & Source Integration** - Wire the supported source-host trigger path and deploy automation to GCP without long-lived key JSON.
- [ ] **Phase 26: Live Smoke, Rollback & Operator Proof** - Prove the live hosted path end to end and document the automated release/rollback workflow.

## Phase Details

### Phase 23: GCP Bootstrap & First Live Deployment
**Goal**: Turn the `v1.4` operator contract into a real deployed Cloud Run environment on GCP.
**Depends on**: Shipped `v1.4` Cloud Run packaging, security, and runbook baseline
**Requirements**: GCP-01, GCP-02
**Success Criteria** (what must be TRUE):
  1. The required GCP resources and deployment inputs are bootstrapped or verified from repo-owned docs or automation.
  2. A live Cloud Run service revision is deployed from the repo-owned path and yields usable service URL and revision metadata.
  3. The bootstrap/deploy path is repeatable and does not depend on hidden workstation state.

### Phase 24: CI Validation & Image Release Pipeline
**Goal**: Automate validation and immutable image publishing before rollout.
**Depends on**: Phase 23
**Requirements**: PIPE-01, PIPE-02
**Success Criteria** (what must be TRUE):
  1. CI runs the required validation bundle before deployment.
  2. The pipeline builds and publishes an immutable image to Artifact Registry.
  3. Deployment consumes the exact published image instead of rebuilding a different artifact later.

### Phase 25: Secretless CD & Source Integration
**Goal**: Connect the source-of-truth repo to GCP deployment automation without weakening the `v1.4` security and runtime contract.
**Depends on**: Phase 24
**Requirements**: PIPE-03, PIPE-04, GCP-03
**Success Criteria** (what must be TRUE):
  1. Pipeline auth to GCP is secretless or equivalently bounded by default.
  2. The supported source-host or trigger wiring is explicit, documented, and reproducible from the repo.
  3. Automated deployment preserves the same-origin, authenticated, mounted-store Cloud Run contract already shipped.

### Phase 26: Live Smoke, Rollback & Operator Proof
**Goal**: Make the automated hosted path operationally real rather than “pipeline ran.”
**Depends on**: Phase 25
**Requirements**: REL-05, REL-06, OPS-03
**Success Criteria** (what must be TRUE):
  1. Post-deploy smoke verifies the live URL, `/health`, `/ready`, and one real request path.
  2. Rollback stays supported through immutable revision or image references.
  3. Operator docs cover bootstrap, auth/triggers, deploy, smoke, rollback, and failure recovery for the automated GCP path.

## Progress

| Milestone | Scope | Status | Shipped |
|-----------|-------|--------|---------|
| v1.0 TeX MVP | Phases 1-5 | Complete | 2026-04-02 |
| v1.1 Search, Hardening & Corpus | Phases 6-9 | Complete | 2026-04-03 |
| v1.2 Dashboard, Export & Math Rendering Hardening | Phases 10-13 | Complete | 2026-04-03 |
| v1.3 Parse/Render Hardening | Phases 14-16 | Complete | 2026-04-03 |
| v1.4 GCP Cloud Run Deployment Hardening | Phases 17-22 | Complete | 2026-04-04 |
| v1.5 GCP Deployment & CI/CD | Phases 23-26 | In Progress | - |
