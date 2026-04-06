# Phase 24: CI Validation & Image Release Pipeline - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Automate repo-owned validation and immutable image publishing for the supported Cloud Run path. This phase owns the checked-in CI/release pipeline contract, the validation gates that must pass before an image is published, and the immutable image identity that later deploy automation must consume. It does not yet own source-host trigger wiring, secretless deploy auth, or live smoke / rollback automation from later phases.

</domain>

<decisions>
## Implementation Decisions

### Todo Folding
- **D-01:** Fold the pending `Fix stale sample artifact problem` todo into Phase 24, but only as a release-artifact freshness concern rather than a broader sample-dashboard product feature.
- **D-02:** If sample or exported artifacts are used as part of release validation or publish inputs, the pipeline should guard against stale generated outputs rather than silently shipping them.

### Pipeline Host Contract
- **D-03:** The primary checked-in Phase 24 pipeline contract should be GCP-native (`1B`), not GitHub Actions, because this repo currently has no configured git remote and no `.github/` workflow baseline.
- **D-04:** Cloud Build should be treated as the repo-owned CI/image-release definition for this phase, while source-host integration remains deferred to Phase 25.
- **D-05:** Phase 24 must not assume GitHub-hosted workflow execution exists yet; any later GitHub integration should consume or trigger the checked-in GCP-native pipeline rather than replace the pipeline contract invented here.

### Validation Gate Shape
- **D-06:** Validation should be split into a lighter fast gate and a heavier release gate, rather than one identical blocking bundle on every pipeline path.
- **D-07:** The heavier pre-publish release gate must include at least `typecheck`, `build`, and the named deployment acceptance bundle before an image can be published.
- **D-08:** The exact lighter gate is left to downstream planning, as long as it is meaningfully faster than the release gate and still catches obvious regressions early.

### Image Identity Contract
- **D-09:** Published images must use commit-SHA tags and record the pushed image digest as the canonical immutable deployment identity.
- **D-10:** Later deploy steps should consume the exact pushed digest rather than rebuilding or relying on floating tags.
- **D-11:** Human-friendly tags may exist as secondary labels, but they are not the supported deployment identity for this phase.

### Release Trigger Policy
- **D-12:** Image publishing should happen only from the protected mainline branch after the release gate passes.
- **D-13:** Branch or PR preview image publishing is explicitly out of scope for Phase 24.
- **D-14:** Phase 24 should automate validation and publish, but it must not blur into broad preview-environment or per-branch deployment behavior.

### Boundary With Later Phases
- **D-15:** Secretless GCP auth and hosted-source trigger wiring still belong to Phase 25, even if Phase 24 chooses Cloud Build as the checked-in pipeline shape.
- **D-16:** Live smoke, rollback execution, and operator proof remain Phase 26 work and should not be pulled forward just because image publishing exists.

### the agent's Discretion
- The exact checked-in Cloud Build file layout and helper-script split, as long as the repo clearly defines the validation and publish contract.
- The exact branch or ref filtering mechanism used to enforce mainline-only image publishing.
- The exact way image digest metadata is surfaced for downstream deploy consumption.

</decisions>

<specifics>
## Specific Ideas

- The repo already has `package.json` scripts for `build`, `typecheck`, and milestone acceptance bundles; Phase 24 should compose those into explicit fast-versus-release pipeline gates instead of inventing parallel commands.
- Because there is no configured git remote and no `.github/` directory in this workspace, GitHub Actions would create a source-host contract the repo does not yet actually have. A checked-in Cloud Build definition is the cleaner contract for this phase.
- The current `deploy/cloudrun/RUNBOOK.md` still assumes manual `docker build` and `docker push`; Phase 24 should replace that with a repo-defined immutable image publish path aligned with Artifact Registry.
- The folded stale-sample todo should only influence Phase 24 where release validation or artifact packaging could accidentally bless old generated outputs.
- If GitHub becomes the eventual hosted source, Phase 25 can wire it to trigger the checked-in Cloud Build path instead of redefining CI/CD from scratch.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and phase scope
- `.planning/PROJECT.md` — Active `v1.5` milestone goal and delivery constraints.
- `.planning/REQUIREMENTS.md` — `PIPE-01` and `PIPE-02` for this phase, plus later-phase boundaries for `PIPE-03` and `PIPE-04`.
- `.planning/ROADMAP.md` — Phase 24 goal and success criteria.
- `.planning/STATE.md` — Current milestone position and sequencing notes.

### Prior deployment decisions that remain locked
- `.planning/phases/23-gcp-bootstrap-first-live-deployment/23-CONTEXT.md` — Long-lived Cloud Run target, no source-host dependency yet, and preserved `v1.4` contract.
- `.planning/milestones/v1.4-phases/18-cloud-run-packaging-topology/18-CONTEXT.md` — Combined same-origin service and repo-defined container artifact.
- `.planning/milestones/v1.4-phases/19-shared-deployment-security-hardening/19-CONTEXT.md` — Authenticated access model that later deployment steps must preserve.
- `.planning/milestones/v1.4-phases/20-gcp-persistence-operator-runbook/20-CONTEXT.md` — Mounted Cloud Storage bucket persistence bridge and operator contract.
- `.planning/milestones/v1.4-phases/21-cloud-run-acceptance-gate/21-CONTEXT.md` — Named `v1.4` proof workflow and release-proof framing.

### Current deployment and validation artifacts
- `package.json` — Existing `build`, `typecheck`, and named acceptance commands that Phase 24 should reuse.
- `Dockerfile` — Repo-defined combined deployment artifact whose image publication is being automated.
- `deploy/cloudrun/deploy.sh` — Current deploy contract that later phases must consume via immutable image identity.
- `deploy/cloudrun/RUNBOOK.md` — Current manual build/push/deploy flow that Phase 24 should evolve.
- `deploy/cloudrun/README.md` — Supported shared access and deploy surface assumptions.
- `deploy/cloudrun/SMOKE.md` — Current proof split between local validation and later live verification.

### Existing contract tests and adjacent signals
- `packages/cli/test/cloud-run-artifact.test.ts` — Locks the shipped deploy artifact baseline.
- `packages/cli/test/cloud-run-runbook-contract.test.ts` — Locks documentation and operator contract details around deployment.
- `packages/cli/test/cloud-run-security-contract.test.ts` — Locks deployed access/security assumptions that Phase 24 must preserve.
- `.planning/todos/pending/2026-04-03-fix-stale-sample-artifact-problem.md` — Folded todo, but only as release-artifact freshness guidance.

### Research context
- `.planning/research/SUMMARY.md` — Milestone-level deployment and CI/CD synthesis.
- `.planning/research/STACK.md` — Compared GCP-native versus hosted-source pipeline options.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `package.json` already defines the high-value validation commands Phase 24 needs to orchestrate.
- `Dockerfile` already defines the deployable artifact; this phase should automate publishing it, not redefine it.
- `deploy/cloudrun/deploy.sh` already consumes an explicit image reference and is naturally aligned with later digest-based deploys.
- Existing Cloud Run contract tests in `packages/cli/test/` give this phase a strong local enforcement point for pipeline and docs changes.

### Established Patterns
- Deployment behavior in this repo is expressed through checked-in shell helpers plus focused contract tests, not console-only instructions.
- Named acceptance scripts have become the milestone proof pattern; the release gate should build on that instead of inventing a one-off command matrix.
- The deployment contract is already GCP- and Cloud Run-specific; a GCP-native CI/image-release definition fits the current architecture better than a host-agnostic abstraction.

### Integration Points
- Root-level CI/release config files for Cloud Build or equivalent GCP-native pipeline definition.
- `package.json` for explicit fast-gate and release-gate script composition if new named commands are needed.
- `deploy/cloudrun/` docs and helpers for replacing the current manual build/push assumptions with pipeline-owned image publishing.
- `packages/cli/test/` for contract tests that keep the pipeline and runbook aligned.

</code_context>

<deferred>
## Deferred Ideas

- GitHub-hosted workflow execution or any other source-host-specific pipeline host.
- Workload Identity Federation, source-host triggers, and secretless deploy auth wiring.
- Per-branch preview images or preview deployments.
- Automated live smoke and rollback execution.
- Broader stale-sample cleanup outside release-artifact freshness checks.

</deferred>

---

*Phase: 24-ci-validation-image-release-pipeline*
*Context gathered: 2026-04-06*
