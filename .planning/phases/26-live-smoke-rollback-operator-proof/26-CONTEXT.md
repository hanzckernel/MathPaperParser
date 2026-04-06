# Phase 26: Live Smoke, Rollback & Operator Proof - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the hosted deployment path operationally real by verifying the live service after every automated deploy, surfacing exact rollback targets, and publishing the operator proof for the automated path. This phase owns post-deploy smoke behavior, rollback decision support, and the final operator-facing proof workflow. It does not reopen source integration, deploy auth, or the core pipeline/deploy contract from Phases 24 and 25.

</domain>

<decisions>
## Implementation Decisions

### Todo Folding
- **D-01:** Do not fold the stale-sample-artifact todo into Phase 26.
- **D-02:** Phase 26 should stay focused on live service proof rather than broad generated-artifact hygiene.

### Smoke Timing
- **D-03:** Every automated deploy should run blocking post-deploy smoke.
- **D-04:** A deploy is not considered successful in the supported hosted path until the live smoke step passes.
- **D-05:** Smoke should be tied to the automated delivery path, not left as a purely manual operator afterthought.

### Smoke Depth
- **D-06:** Live smoke should verify `/health`, `/ready`, and one authenticated read-only real request path against the deployed service.
- **D-07:** Phase 26 should avoid write-path or full-browser live smoke for now; the proof should stay bounded, repeatable, and low-risk.
- **D-08:** The authenticated read-only request should be strong enough to prove the deployed service contract is real, not just that the container is listening.

### Rollback Policy
- **D-09:** On smoke failure, the pipeline should surface the exact failing revision and image metadata but keep rollback explicit through the supported helper rather than auto-rolling back.
- **D-10:** The operator-proof path must make rollback actionable immediately by naming the exact revision/image to restore.
- **D-11:** Automatic rollback is out of scope for this phase.

### Operator Proof
- **D-12:** The final operator proof should cover bootstrap/auth-triggers/deploy/live-smoke/rollback/failure-recovery as one named hosted workflow, not scattered notes.
- **D-13:** The proof should be revision-aware so operators can connect a deployed revision and image identity back to the exact release event.
- **D-14:** Phase 26 should evolve the current `deploy/cloudrun/SMOKE.md` local-versus-live split into a real hosted release-proof contract instead of replacing it with ad hoc instructions.

### Boundary With Earlier Phases
- **D-15:** Phase 26 must consume the deployed revision/image metadata handed off by Phase 25 rather than inventing its own deploy identity scheme.
- **D-16:** Phase 26 must preserve the authenticated access model and same-origin runtime contract from `v1.4` while exercising the live service.

### the agent's Discretion
- The exact authenticated read-only request used for live smoke, as long as it is real, bounded, and reproducible.
- The exact reporting format for revision/image metadata and rollback guidance.
- The exact split between automated output and runbook documentation, as long as the final hosted proof is explicit and reproducible.

</decisions>

<specifics>
## Specific Ideas

- The current `deploy/cloudrun/SMOKE.md` already separates local proof from live checks; Phase 26 should turn the live side into an explicit automated contract.
- Because rollback stays explicit, the smoke output should probably emit the deployed service URL, revision, and immutable image identity together with the exact rollback command/operator step.
- A bounded authenticated read-only request is the right smoke depth here because it proves real service behavior without mutating the mounted store or introducing cross-run cleanup burden.
- Blocking smoke after every automated deploy is the right threshold for “operationally real”; otherwise the pipeline would still stop at “deploy seems to have run.”

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and phase scope
- `.planning/PROJECT.md` — Active `v1.5` milestone goal and delivery constraints.
- `.planning/REQUIREMENTS.md` — `REL-05`, `REL-06`, and `OPS-03` for this phase.
- `.planning/ROADMAP.md` — Phase 26 goal and success criteria.
- `.planning/STATE.md` — Current sequencing and prior discussion decisions.

### Prior decisions that remain locked
- `.planning/phases/23-gcp-bootstrap-first-live-deployment/23-CONTEXT.md` — Long-lived deployed service target and preserved Cloud Run contract.
- `.planning/phases/24-ci-validation-image-release-pipeline/24-CONTEXT.md` — Mainline-only image publish and digest-backed image identity.
- `.planning/phases/25-secretless-cd-source-integration/25-CONTEXT.md` — GitHub-triggered Cloud Build source integration and automatic mainline deploy policy.
- `.planning/milestones/v1.4-phases/19-shared-deployment-security-hardening/19-CONTEXT.md` — Authenticated access model that live smoke must respect.
- `.planning/milestones/v1.4-phases/21-cloud-run-acceptance-gate/21-CONTEXT.md` — Named proof workflow framing that this phase extends into the hosted path.

### Current hosted verification and rollback artifacts
- `deploy/cloudrun/SMOKE.md` — Existing local-proof and live-check split that this phase must evolve.
- `deploy/cloudrun/RUNBOOK.md` — Current operator-facing deploy/verify/rollback workflow.
- `deploy/cloudrun/rollback.sh` — Supported rollback primitive that remains explicit in this phase.
- `deploy/cloudrun/deploy.sh` — Deploy contract whose outputs must be reflected in smoke and rollback reporting.
- `deploy/cloudrun/grant-invoker.sh` — Access-grant helper that reflects the supported authenticated access model.

### Existing code and tests
- `packages/cli/src/server.ts` — Implements `/health` and `/ready` aliases for hosted smoke, while keeping `/healthz` and `/readyz` as compatibility routes.
- `packages/cli/test/serve-app.test.ts` — Existing local test coverage for health/readiness routes.
- `packages/cli/test/cloud-run-runbook-contract.test.ts` — Existing rollback-helper contract test.
- `packages/cli/test/cloud-run-security-contract.test.ts` — Access/security assumptions that live smoke must not bypass.

### Research context
- `.planning/research/SUMMARY.md` — Milestone-level warning against stopping at build-and-deploy without live smoke.
- `.planning/research/ARCHITECTURE.md` — Calls for live smoke and rollback-aware release proof.
- `.planning/research/PITFALLS.md` — Warns against lacking rollback criteria tied to smoke failure.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `deploy/cloudrun/SMOKE.md` already defines the current shape of the live verification story.
- `deploy/cloudrun/rollback.sh` already provides the supported rollback primitive Phase 26 should operationalize rather than replace.
- `/health` and `/ready` now exist in `packages/cli/src/server.ts` as the hosted probe contract, while `/healthz` and `/readyz` remain compatibility aliases; the new work is about hosted proof, not endpoint invention.

### Established Patterns
- The repo already treats named acceptance bundles and runbook-backed verification as first-class proof artifacts.
- Rollback is already revision-based and explicit; this phase should preserve that clarity rather than bury it behind opaque automation.
- The supported shared deployment path remains authenticated and direct-to-Cloud-Run; live smoke must respect that access model.

### Integration Points
- `deploy/cloudrun/SMOKE.md` and `deploy/cloudrun/RUNBOOK.md` for the hosted proof workflow.
- Pipeline outputs from Phase 25 for deployed revision/image metadata.
- `packages/cli/test/` for any locally testable proof/rollback contract updates.

</code_context>

<deferred>
## Deferred Ideas

- Automatic rollback on smoke failure.
- Write-path live smoke or full browser/UI smoke.
- Preview-environment or canary release proof.
- Broad generated-artifact freshness checks unrelated to the live service.

</deferred>

---

*Phase: 26-live-smoke-rollback-operator-proof*
*Context gathered: 2026-04-06*
