# Phase 17: Server Deployment Boundary Hardening - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the current localhost-first server safe and diagnosable enough to be the basis for a shared Cloud Run deployment. This phase hardens the app boundary itself: it does not yet package Cloud Run artifacts, wire GCP persistence, or finalize the shared-deployment auth/ingress model from the later security phase.

</domain>

<decisions>
## Implementation Decisions

### Deployed-Mode Boundary
- **D-01:** Phase 17 must introduce an explicit deployed/runtime boundary instead of assuming the current localhost API shape is safe everywhere.
- **D-02:** Local developer ergonomics may remain available in local mode, but deployed mode must not preserve unsafe internet-facing behavior by default.

### Remote Filesystem Analysis
- **D-03:** Shared deployment must not allow arbitrary remote JSON `inputPath` analysis.
- **D-04:** If the code keeps `inputPath` support for local workflows, deployed mode must reject it explicitly rather than silently ignoring it.

### Request and Upload Limits
- **D-05:** Request-body and upload limits must be explicit, bounded, and visible in failure responses.
- **D-06:** The goal is bounded failure behavior first; a full streaming upload redesign is not required in this phase if safe limits and clear enforcement land.

### Operability Surface
- **D-07:** `/healthz` and `/readyz` must be first-class app routes, not only platform-level assumptions.
- **D-08:** Structured logs should be emitted from the app boundary so operators can distinguish startup, readiness, request rejection, and unexpected failure.

### Phase Boundary Discipline
- **D-09:** Cloud Run container packaging, same-origin static asset serving, and access control policy belong to later phases.
- **D-10:** Phase 17 should hand Phase 18 a safer API/runtime boundary, not solve the entire deployment story in one pass.

### the agent's Discretion
- The exact environment/config flag that distinguishes local mode from deployed mode.
- The exact request/upload limit values, as long as they are explicit, documented, and testable.
- The exact structured log fields, as long as they differentiate health/readiness, rejected requests, and internal failures clearly.

</decisions>

<specifics>
## Specific Ideas

- The current `POST /api/papers` JSON path should likely become local-only or explicitly disabled in deployed mode.
- Multipart upload can stay as the supported ingestion path if it becomes size-bounded and failure-explicit.
- `handlePaperParserRequest()` is the cleanest test boundary for new deploy-mode request rejection and health/readiness behavior.
- `createPaperParserRequestHandler()` is the right place to ensure runtime errors also produce structured logs.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and phase scope
- `.planning/PROJECT.md` — Active `v1.4` deployment-hardening goals and the decision to treat Cloud Run as the first supported shared deployment target.
- `.planning/REQUIREMENTS.md` — `SEC-01`, `SEC-02`, and `OPS-01` acceptance criteria for this phase.
- `.planning/ROADMAP.md` — Phase 17 goal, dependencies, and success criteria.
- `.planning/STATE.md` — Current milestone state and the expectation that Phase 17 is the active next step.

### Deployment blocker baseline
- `docs/deployment_readiness.md` — The repo’s explicit reasons it is not ready for internet-facing deployment; this document is the primary problem statement for Phase 17.

### Current server surface
- `packages/cli/src/server.ts` — Owns request parsing, body buffering, analyze/upload routes, and route table.
- `packages/cli/src/index.ts` — Owns `serve` command wiring and current runtime entrypoint expectations.
- `packages/cli/test/serve-app.test.ts` — Current API boundary proof that still assumes JSON `inputPath` ingestion is available.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/cli/src/server.ts`: Holds `readBody()`, `toWebRequest()`, `persistUploadedFile()`, `handleAnalyzeRequest()`, and the route matcher for `/api/*`.
- `packages/cli/test/serve-app.test.ts`: Already exercises the API at the `handlePaperParserRequest()` boundary and is the natural place to lock the safer deployed-mode contract.
- `docs/deployment_readiness.md`: Already names the missing health/readiness, upload limits, and remote path issues; the phase should make that document more true, not diverge from it.

### Established Patterns
- API behavior in this repo is generally proved with request/response tests against `handlePaperParserRequest()` rather than full network E2E first.
- Repo-level milestones prefer explicit failure states over silent fallback when a runtime mode is unsupported.
- The system already separates local static export behavior from API mode in the web app; Phase 17 should apply the same explicitness to server deployment modes.

### Integration Points
- `packages/cli/src/server.ts` for request limits, route rejection, health/readiness routes, and log emission.
- `packages/cli/src/index.ts` if the serve command needs a deploy-mode flag or environment-aware runtime configuration.
- `packages/cli/test/serve-app.test.ts` for boundary regressions around JSON `inputPath`, multipart uploads, and health/readiness.

</code_context>

<deferred>
## Deferred Ideas

- Cloud Run container image, Dockerfile, Artifact Registry workflow, and static asset serving topology.
- Shared-deployment auth/authz policy and raw-service ingress exposure controls.
- GCP persistence wiring and operator runbook content.

</deferred>

---

*Phase: 17-server-deployment-boundary-hardening*
*Context gathered: 2026-04-04*
