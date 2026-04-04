# Phase 18: Cloud Run Packaging & Topology - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Ship the first supported Cloud Run deployment artifact and the first explicit same-origin browser/runtime topology for PaperParser. This phase owns packaging and combined web/API serving. It does not yet decide the shared-deployment auth policy, ingress restrictions, or GCP persistence/runbook details from later phases.

</domain>

<decisions>
## Implementation Decisions

### Supported Artifact
- **D-01:** The supported deployment artifact for this milestone is a versioned container image built from a repo-defined root `Dockerfile`.
- **D-02:** The container must build the monorepo and produce the deployable web bundle during image build rather than relying on ad hoc workstation steps at deploy time.

### Supported Runtime Shape
- **D-03:** The supported Cloud Run runtime shape is one combined service that serves the dashboard shell and the API from the same origin.
- **D-04:** The supported browser path must not require a split-origin reverse proxy or CORS configuration to use the dashboard against the deployed API.
- **D-05:** Static export remains a local/operator workflow, not the supported Cloud Run deployment artifact.

### Dashboard Topology Contract
- **D-06:** When the deployed dashboard is served by the combined service, it must enter API mode automatically against the same origin instead of requiring a manual `?api=http://...` URL.
- **D-07:** The runtime contract should stay explicit and testable, for example through a small runtime config surface or a deliberate server-side shell contract.

### Server Integration
- **D-08:** The existing CLI server remains the deployment entrypoint; Phase 18 extends it to serve the built web assets instead of introducing a second Node server stack.
- **D-09:** Non-API browser requests should resolve through the packaged dashboard shell or static asset files when a web bundle is configured.

### Phase Boundary Discipline
- **D-10:** Auth/authz and ingress hardening remain Phase 19 work; Phase 18 must not pretend the raw Cloud Run service is fully secure yet.
- **D-11:** Persistence strategy and full operator runbook remain later work; this phase only needs the runtime/config seams necessary for packaging and topology.

### the agent's Discretion
- The exact runtime-config mechanism that puts the dashboard into same-origin API mode.
- The exact container build layout as long as it is reproducible from the repo and suitable for Cloud Run.
- The exact CLI/env surface for locating the packaged web assets in deployed mode.

</decisions>

<specifics>
## Specific Ideas

- The simplest supported artifact is likely a root multi-stage `Dockerfile` that runs `npm install`, `npm run build`, and starts `node packages/cli/dist/index.js serve --deployed`.
- The current web app defaults to static `./data` mode, so the combined-service path needs an explicit runtime hint instead of assuming the dashboard will infer API mode.
- `packages/cli/src/server.ts` is the natural integration point for serving built dashboard assets and any deployment runtime config surface.
- `packages/web/src/lib/data-source.ts` is the natural place to teach the dashboard how to prefer the deployed same-origin API contract when that runtime hint exists.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and phase scope
- `.planning/PROJECT.md` — Active `v1.4` Cloud Run deployment intent.
- `.planning/REQUIREMENTS.md` — `DEPLOY-01` and `DEPLOY-02` for this phase.
- `.planning/ROADMAP.md` — Phase 18 goal and success criteria.
- `.planning/STATE.md` — Current milestone execution position after Phase 17.

### Deployment baseline
- `docs/deployment_readiness.md` — Names the current missing packaging artifact and implicit web/API topology.
- `.planning/research/SUMMARY.md` — Milestone-level Cloud Run research pointing toward a combined same-origin service and Artifact Registry image flow.

### Current implementation seams
- `packages/cli/src/server.ts` — Current API-only server boundary that will need combined web/API serving support.
- `packages/cli/src/index.ts` — Current `serve` entrypoint and future deployment runtime flags.
- `packages/web/src/lib/data-source.ts` — Current static-vs-API source selection, which today requires an explicit `?api=...` query param.
- `packages/web/src/App.tsx` — Current browser boot path and search-param syncing.
- `packages/web/vite.config.ts` — Existing static bundle build with relative asset paths and MathJax asset copy behavior.
- `packages/web/test/bundle-data.test.ts` — Current proof for static-default source resolution.
- `packages/cli/test/serve-app.test.ts` — Current API request boundary test surface for same-origin serving additions.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/web/vite.config.ts` already emits a self-contained relative-asset bundle suitable for static serving from the CLI process.
- `packages/cli/src/server.ts` already owns all HTTP routing, so extending it is cheaper than adding Express or a second runtime stack.
- `packages/web/src/lib/data-source.ts` already models static and API-backed modes cleanly; the main missing piece is a deployed same-origin default.

### Established Patterns
- The repo prefers explicit runtime contracts and automated request/data-source tests over implicit environment behavior.
- Exported dashboards are intentionally static-first; deployment support should add a separate explicit deployed contract instead of weakening static export behavior.
- Existing docs already separate local static export from API-backed mode; Phase 18 should make the API-backed deployed mode first-class.

### Integration Points
- `packages/cli/src/server.ts` for static asset routing and deployed shell behavior.
- `packages/cli/src/index.ts` for `serve` configuration and container-friendly env defaults.
- `packages/web/src/lib/data-source.ts` and `packages/web/src/App.tsx` for deployed same-origin source resolution.
- Root `Dockerfile` and possibly `.dockerignore` for the supported Cloud Run artifact.
- `docs/deployment_readiness.md` and `README.md` to keep the deployment story aligned with the shipped code.

</code_context>

<deferred>
## Deferred Ideas

- Auth/authz requirements and ingress exposure controls for shared deployment.
- GCP persistence strategy and Cloud Storage volume-mount policy.
- Operator rollout, rollback, and backup procedures.

</deferred>

---

*Phase: 18-cloud-run-packaging-topology*
*Context gathered: 2026-04-04*
