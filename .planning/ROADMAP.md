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
- 🚧 **v1.4 GCP Cloud Run Deployment Hardening** — Phases 17-20 planned on 2026-04-04

## Current State

- Active milestone: `v1.4 GCP Cloud Run Deployment Hardening`
- Next execution step: `$gsd-plan-phase 17`
- Phase numbering continues from 17 for this milestone.

## Milestone Summary

- `v1.0` established the deterministic canonical bundle, explorer, and optional enrichment model.
- `v1.1` added paper-local search, corpus navigation, and multi-paper acceptance proof.
- `v1.2` hardened export, runtime, and baseline MathJax rendering for supported local dashboards.
- `v1.3` reduced residual parser gaps, hardened exported MathJax runtime behavior, and published a named parse/render acceptance proof.
- `v1.4` targets the first supported shared deployment path on Google Cloud Run, with server hardening, packaging, persistence, and operator proof.

## Phases

**Phase Numbering:**
- Integer phases (17, 18, 19, 20): Planned milestone work
- Decimal phases (17.1, 17.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 17: Server Deployment Boundary Hardening** - Make the current API safe and operable enough to run in a shared Cloud Run environment.
- [ ] **Phase 18: Cloud Run Packaging & Topology** - Package PaperParser as a supported Cloud Run service with a deliberate same-origin web/API deployment shape and explicit access model.
- [ ] **Phase 19: GCP Persistence & Operator Runbook** - Define the supported GCP store strategy and document how operators deploy, configure, upgrade, and roll back it.
- [ ] **Phase 20: Cloud Run Acceptance Gate** - Prove the Cloud Run path end to end from container artifact through runtime behavior and deployment smoke checks.

## Phase Details

### Phase 17: Server Deployment Boundary Hardening
**Goal**: Make the current localhost-first server safe and diagnosable in deployed mode before any Cloud Run packaging claim.
**Depends on**: Existing `v1.3` shipped web/API runtime
**Requirements**: SEC-01, SEC-02, OPS-01
**Success Criteria** (what must be TRUE):
  1. Deployed mode no longer accepts arbitrary remote filesystem `inputPath` analysis from untrusted clients.
  2. Upload and request handling enforce explicit limits with clear failure behavior instead of unbounded buffering.
  3. `/healthz`, `/readyz`, and structured logs exist and distinguish startup, readiness, and request failures.

### Phase 18: Cloud Run Packaging & Topology
**Goal**: Give the repo one supported Cloud Run deployment artifact and one explicit browser/runtime topology.
**Depends on**: Phase 17
**Requirements**: DEPLOY-01, DEPLOY-02, ACCESS-01
**Success Criteria** (what must be TRUE):
  1. The repo ships a supported Cloud Run deployment artifact with documented runtime configuration.
  2. The deployed dashboard and API work together through one supported same-origin topology rather than undocumented split-origin behavior.
  3. Ingress and endpoint exposure match the documented shared-deployment access model.

### Phase 19: GCP Persistence & Operator Runbook
**Goal**: Make the deployed store strategy and operator workflow explicit enough that the Cloud Run path is supportable.
**Depends on**: Phase 18
**Requirements**: STORE-01, OPS-02
**Success Criteria** (what must be TRUE):
  1. The deployed service has one supported GCP persistence strategy compatible with the current bundle/store contract.
  2. Repo docs cover deploy, configure, upgrade, and rollback steps without hidden workstation knowledge.
  3. The runbook names the required GCP resources, env/config surface, and persistence expectations clearly enough for repeatable operator use.

### Phase 20: Cloud Run Acceptance Gate
**Goal**: Make the supported Cloud Run path reproducible and provable instead of “container seems to run.”
**Depends on**: Phase 19
**Requirements**: REL-03, REL-04
**Success Criteria** (what must be TRUE):
  1. Verification covers container packaging, runtime config, same-origin serving, and bounded deployed ingestion behavior.
  2. The repo publishes one named Cloud Run deployment proof or smoke workflow.
  3. The milestone proof is reproducible from repo docs and catches the main deployment regressions introduced in phases 17-19.

## Progress

| Milestone | Scope | Status | Shipped |
|-----------|-------|--------|---------|
| v1.0 TeX MVP | Phases 1-5 | Complete | 2026-04-02 |
| v1.1 Search, Hardening & Corpus | Phases 6-9 | Complete | 2026-04-03 |
| v1.2 Dashboard, Export & Math Rendering Hardening | Phases 10-13 | Complete | 2026-04-03 |
| v1.3 Parse/Render Hardening | Phases 14-16 | Complete | 2026-04-03 |
| v1.4 GCP Cloud Run Deployment Hardening | Phases 17-20 | Planned | - |
