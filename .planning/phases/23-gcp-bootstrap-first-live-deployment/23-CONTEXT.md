# Phase 23: GCP Bootstrap & First Live Deployment - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Turn the shipped `v1.4` Cloud Run operator contract into one real deployed GCP environment. This phase owns first-live-deploy execution, practical bootstrap automation for the required GCP resources, and the long-lived service target that later CI/CD will reuse. It does not yet add source-host integration, CI validation, or automated CD wiring from later phases.

</domain>

<decisions>
## Implementation Decisions

### Bootstrap Ownership
- **D-01:** Phase 23 should add checked-in bootstrap automation where practical, instead of relying only on prose or console-only setup.
- **D-02:** The bootstrap path may still leave a small number of explicit operator-provided values, but the supported resource setup must be reproducible from repo-owned artifacts.
- **D-03:** This phase should treat Artifact Registry, the runtime service account, the Cloud Run service target, and the mounted store bucket as first-class bootstrap concerns.

### Live Deployment Target
- **D-04:** The first live deployment must go to one concrete long-lived Cloud Run service/environment, not an ephemeral proof-only target.
- **D-05:** The deployed target should be suitable for reuse by later CI/CD work rather than being thrown away after one manual validation pass.
- **D-06:** The phase must surface the deployed service URL and revision metadata as part of the supported operator outcome.

### Contract Preservation
- **D-07:** The live deployment must preserve the shipped `v1.4` contract: one combined same-origin service, Cloud Run IAM authentication enabled, and the mounted Cloud Storage store bridge.
- **D-08:** Phase 23 must not reopen public-access, split-origin, or persistence-redesign questions that were already settled in `v1.4`.

### Source Integration Boundary
- **D-09:** Phase 23 must not depend on a configured git remote, hosted repository integration, or CI trigger path.
- **D-10:** Any source-host or trigger preparation beyond repo-local/operator deploy execution is deferred to later `v1.5` phases.

### Phase Boundary Discipline
- **D-11:** This phase is allowed to improve the repo-owned GCP bootstrap/deploy path, but it does not yet own CI validation, immutable image publishing automation, or live smoke automation.
- **D-12:** If a decision primarily exists to support hosted CI/CD identity or trigger wiring, it belongs in Phase 24 or 25 rather than here.

### the agent's Discretion
- The exact split between bootstrap scripts, checked-in env templates, and runbook updates, as long as the live environment can be created or verified reproducibly.
- The exact mechanism for surfacing deployment metadata after a successful live deploy.
- The exact way bootstrap automation validates existing resources versus creating them.

</decisions>

<specifics>
## Specific Ideas

- The natural baseline remains `deploy/cloudrun/deploy.sh`, `deploy/cloudrun/grant-invoker.sh`, and `deploy/cloudrun/rollback.sh`; Phase 23 should extend around those rather than bypass them.
- A practical bootstrap path likely needs repo-owned setup for Artifact Registry, the runtime service account, and the mounted store bucket before the first live deploy is attempted.
- Because there is no configured git remote in this workspace, the first live deployment should remain operator-driven and not assume GitHub Actions or Cloud Build triggers yet.
- The deployed target should be one named long-lived Cloud Run service in one named GCP project/region so later CI/CD phases can build on a stable environment instead of replacing it.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and phase scope
- `.planning/PROJECT.md` — Active `v1.5` milestone goal and constraints.
- `.planning/REQUIREMENTS.md` — `GCP-01` and `GCP-02` for this phase, plus `GCP-03` as a preserved later-phase contract.
- `.planning/ROADMAP.md` — Phase 23 goal and success criteria.
- `.planning/STATE.md` — Current milestone position and phase sequencing.

### Prior deployment decisions that remain locked
- `.planning/milestones/v1.4-phases/18-cloud-run-packaging-topology/18-CONTEXT.md` — Combined same-origin service and repo-defined container artifact.
- `.planning/milestones/v1.4-phases/19-shared-deployment-security-hardening/19-CONTEXT.md` — Authenticated direct Cloud Run access and no public invoker path.
- `.planning/milestones/v1.4-phases/20-gcp-persistence-operator-runbook/20-CONTEXT.md` — Mounted Cloud Storage bucket as the supported persistence bridge.
- `.planning/milestones/v1.4-phases/21-cloud-run-acceptance-gate/21-CONTEXT.md` — Local acceptance proof and live follow-up distinction.

### Current deployment artifacts
- `deploy/cloudrun/deploy.sh` — Current supported deploy contract.
- `deploy/cloudrun/grant-invoker.sh` — Current supported access-grant contract.
- `deploy/cloudrun/rollback.sh` — Current rollback primitive.
- `deploy/cloudrun/README.md` — Supported access model.
- `deploy/cloudrun/RUNBOOK.md` — Current manual operator workflow and prerequisites.
- `deploy/cloudrun/SMOKE.md` — Current local-proof versus live-check split.

### Project-level deployment notes
- `README.md` — User-facing deployment baseline and current claims.
- `docs/deployment_readiness.md` — Remaining readiness gaps and scope framing.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `deploy/cloudrun/deploy.sh` already encodes the runtime mode, mounted bucket, and Cloud Run deploy flags that Phase 23 must preserve.
- `deploy/cloudrun/grant-invoker.sh` already encodes the supported authenticated access model and should remain the basis for any first-live-deploy access grant path.
- `deploy/cloudrun/rollback.sh` already provides the rollback primitive for the long-lived service this phase will create.
- `packages/cli/test/cloud-run-security-contract.test.ts` and `packages/cli/test/cloud-run-runbook-contract.test.ts` already lock parts of the deploy and rollback shell contract locally.

### Established Patterns
- Deployment behavior in this repo is versioned through small checked-in scripts plus focused contract tests, not through undocumented console steps.
- The Cloud Run service contract is already intentionally explicit about being same-origin, authenticated, and mounted-store backed.
- Live Cloud Run execution has been deferred until now; this phase should add real deployment evidence without broadening into CI/CD yet.

### Integration Points
- `deploy/cloudrun/` for bootstrap additions, environment verification, and runbook updates.
- `README.md` and `docs/deployment_readiness.md` for any changed claims once the first live deploy is real.
- `packages/cli/test/` for local tests that prove new bootstrap or deploy-contract behavior where possible.

</code_context>

<deferred>
## Deferred Ideas

- Hosted source integration, CI triggers, and repository-remote setup.
- Workload Identity Federation and automated deploy auth for CI/CD.
- Automated image publish and deploy pipeline wiring.
- Post-deploy live smoke automation and release-proof workflow.

</deferred>

---

*Phase: 23-gcp-bootstrap-first-live-deployment*
*Context gathered: 2026-04-06*
