---
gsd_state_version: 1.0
milestone: v1.4
milestone_name: GCP Cloud Run Deployment Hardening
status: milestone_ready_for_audit
stopped_at: all v1.4 phases complete; ready for milestone audit
last_updated: "2026-04-04T11:08:45Z"
last_activity: 2026-04-04
progress:
  total_phases: 5
  completed_phases: 5
  total_plans: 5
  completed_plans: 5
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-04)

**Core value:** A mathematician can feed in a TeX paper and get a trustworthy dependency artifact that makes the logical structure of the paper easier to navigate.
**Current focus:** Executing `v1.4 GCP Cloud Run Deployment Hardening`

## Current Position

Phase: 21. Cloud Run Acceptance Gate
Plan: -
Status: All planned phases complete; milestone audit is next
Last activity: 2026-04-04 — Completed Phase 21 with a named `npm run test:acceptance:v1.4` proof bundle and matching Cloud Run smoke note.

Progress: [██████████] 100%

## Performance Metrics

**Velocity:**

- Total plans completed: 22
- Average duration: 16.4 min
- Total execution time: 6.1 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Gold-Paper TeX Ingestion Hardening | 2 | 12 min | 6 min |
| 2. Canonical Objects & Deterministic Relations | 3 | 22 min | 7.3 min |
| 3. Deterministic Dependency Explorer | 1 | 5 min | 5 min |
| 4. Optional Agent Enrichment Review | 2 | 30 min | 15 min |
| 5. Gold-Paper Acceptance Gate | 1 | 9 min | 9 min |
| 6. Searchable Bundle Index & Explorer Navigation | 1 | 12 min | 12 min |
| 7. TeX Hardening & Diagnostic Reduction | 1 | 18 min | 18 min |
| 8. Local Corpus Library & Cross-Paper Navigation | 1 | 24 min | 24 min |
| 9. Multi-Paper Acceptance Gate | 1 | 16 min | 16 min |
| 10. Export Contract Hardening | 1 | 20 min | 20 min |
| 11. Dashboard Math Rendering Repair | 1 | 28 min | 28 min |
| 12. Dashboard Bootstrap & Runtime Guardrails | 1 | 18 min | 18 min |
| 13. Export Acceptance & Operator Guidance | 1 | 16 min | 16 min |
| 14. Residual TeX Parser Hardening | 1 | 7 min | 7 min |
| 15. Math Fragment Render Hardening | 1 | 6 min | 6 min |
| 16. Parse/Render Acceptance Gate | 1 | 5 min | 5 min |
| 17. Server Deployment Boundary Hardening | 1 | 24 min | 24 min |
| 18. Cloud Run Packaging & Topology | 1 | 32 min | 32 min |
| 19. Shared Deployment Security Hardening | 1 | 22 min | 22 min |
| 20. GCP Persistence & Operator Runbook | 1 | 23 min | 23 min |
| 21. Cloud Run Acceptance Gate | 1 | 12 min | 12 min |

**Recent Trend:**

- Last 5 plans: 16-01, 18-01, 19-01, 20-01, 21-01
- Trend: Positive; `v1.4` now has a full named Cloud Run proof bundle across packaging, access, persistence, and operator workflow

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md. The milestone established:

- The deterministic canonical TeX bundle is the trusted baseline artifact.
- The local HTML explorer is a consumer of that artifact, not the source of truth.
- Agent inference is an optional second-pass sidecar with provenance, confidence, and review metadata.
- `long_nalini` is the representative acceptance paper for the shipped v1 scope.
- Phase 7 intentionally left figure references as explicit residual diagnostics instead of expanding the canonical node schema mid-milestone.
- Phase 8 keeps corpus behavior as a read model above paper-local canonical bundles.
- Phase 8 limits cross-paper navigation to explainable deterministic evidence terms rather than speculative global links.
- Phase 9 tightened acceptance to prefer meaningful real-corpus evidence terms such as `hyperbolic` and `surface`.
- Phase 10 will harden the export contract before touching more visible dashboard behavior.
- Phase 11 will repair dashboard math rendering with MathJax plus fragment normalization, without changing the canonical bundle contract.
- Phase 11 established a shared statement-rendering boundary with render-time normalization and explicit inline fallback for unsupported fragments.
- Phase 12 will treat unsupported static runtime conditions as explicit product behavior rather than undefined failure.
- Phase 12 established a dedicated top-level blocker for unsupported static `file://` usage while leaving API mode unblocked.
- Phase 13 established `npm run test:acceptance:v1.2` as the reproducible milestone proof and aligned the operator docs with the hardened local workflow.
- `v1.3` is scoped to parser/render hardening only; corpus-wide search is deferred to the next milestone.
- Phase 14 reduced the accepted-corpus `long_nalini` residual budget to `7` unresolved references and `0` unsupported reference-command diagnostics without adding figure-schema work.
- Phase 14 made duplicate labels explicit with first-definition-wins semantics instead of silent overwrite.
- Phase 15 now salvages accepted-corpus list-heavy and wrapper-heavy statement fragments plus bounded `cases` displays through the shared MathJax boundary.
- Phase 16 established `npm run test:acceptance:v1.3` as the reproducible milestone proof for parser and render hardening.
- Exported dashboard MathJax readiness now waits for `startup.promise`, and static exports must carry `assets/sre/` as part of the supported browser contract.
- `v1.4` targets Google Cloud Run specifically as the first supported shared deployment path.
- `v1.4` now includes a dedicated security phase because Cloud Run packaging alone would not resolve the repo’s missing auth/authz and ingress-hardening gaps.
- Phase 17 established an explicit `local` versus `deployed` runtime boundary, bounded request/upload limits, and app-level `/healthz` and `/readyz` routes.
- Phase 18 established a root Cloud Run container artifact plus a combined same-origin dashboard/API deployment contract with injected browser runtime config.
- Phase 19 established direct authenticated Cloud Run service access as the supported shared model and rejected public invoker grants in repo-owned helpers.
- Phase 20 established a dedicated Cloud Storage bucket mount as the supported persistence bridge and published the Cloud Run operator runbook plus rollback helper.
- Phase 21 established `npm run test:acceptance:v1.4` as the named local proof for the full Cloud Run deployment-hardening slice.

### Pending Todos

- Fix stale sample artifact problem.

### Blockers/Concerns

- `long_nalini` still emits `7` explicit unresolved references, primarily in the deferred figure-reference slice.
- Unsupported TeX beyond the current normalization set still falls back to raw source instead of full browser-ready math rendering.
- Nyquist validation artifacts are still missing for phases 10-16.

## Session Continuity

Last session: 2026-04-04 CEST
Stopped at: All `v1.4` phases complete; next step is milestone audit
Resume file: .planning/ROADMAP.md
