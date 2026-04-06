# Phase 25: Secretless CD & Source Integration - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Connect one real hosted source-of-truth repository to the checked-in GCP-native pipeline and automated deploy path without weakening the shipped Cloud Run security and runtime contract. This phase owns source-host integration, trigger wiring, and bounded deploy authentication. It does not own live smoke depth, rollback execution policy, or broader release-proof behavior from Phase 26.

</domain>

<decisions>
## Implementation Decisions

### Todo Folding
- **D-01:** Do not fold the stale-sample-artifact todo into Phase 25.
- **D-02:** Release-artifact freshness remains Phase 24 scope unless Phase 25 implementation discovers a direct trigger/integration dependency on it.

### Source Host Contract
- **D-03:** GitHub should become the supported hosted source of truth for this phase, with Cloud Build triggered from the GitHub repository.
- **D-04:** Phase 25 is the first place where the repo is allowed to add a GitHub-hosted integration assumption; that assumption should now become explicit and repo-documented rather than implicit.
- **D-05:** The checked-in pipeline contract from Phase 24 remains GCP-native; GitHub is the upstream source and trigger point, not a replacement CI engine for this phase.

### Secretless Auth Shape
- **D-06:** Build and deploy execution should stay GCP-native under a dedicated bounded Cloud Build service account, with no long-lived service-account key JSON.
- **D-07:** Because the build/deploy work executes inside Google-managed infrastructure, this phase should prefer repository-connected Cloud Build trigger execution over external runner credential exchange.
- **D-08:** If any secondary identities are required, they must remain explicitly bounded and documented; key-file secrets are not part of the supported contract.

### Deploy Trigger Policy
- **D-09:** Mainline source updates should publish and then deploy automatically to the one long-lived Cloud Run service.
- **D-10:** Tag-only deployment and manual approval gates are out of scope for this phase; the goal is a real default automated delivery path.
- **D-11:** The trigger path must preserve the same Cloud Run service shape, authenticated access model, and mounted-store configuration already shipped in `v1.4`.

### Contract Preservation
- **D-12:** Automated deploys must continue to target the same combined same-origin Cloud Run service rather than inventing preview or split-origin variants.
- **D-13:** The Phase 24 image identity contract remains locked: deployment should use the exact published immutable image identity rather than rebuild from source during deploy.
- **D-14:** Phase 25 must not reopen public access, disabled invoker checks, or persistence redesign.

### Boundary With Phase 26
- **D-15:** Phase 25 must hand Phase 26 exact deployed revision/image metadata and a stable automated deploy path, but it does not need to decide smoke failure response beyond exposing the right data.
- **D-16:** Live smoke orchestration, rollback decision policy, and operator proof remain Phase 26 work.

### the agent's Discretion
- The exact GitHub-to-Cloud-Build connection mechanism, as long as it is checked in and reproducible.
- The exact Cloud Build service-account role split, as long as it remains bounded and documented.
- The exact trigger filters and branch wiring needed to implement mainline-only automated deploys.

</decisions>

<specifics>
## Specific Ideas

- Phase 24 already chose Cloud Build as the checked-in pipeline contract, so Phase 25 should connect GitHub into that contract rather than introduce a parallel GitHub Actions deployment path.
- This repo currently has no configured git remote and no `.github/` workflow baseline; Phase 25 is therefore the milestone slice that can legitimately establish GitHub as the canonical hosted source.
- A practical shape is: GitHub mainline update -> Cloud Build trigger -> validate/publish -> deploy exact image digest to Cloud Run.
- The Cloud Build service account should be treated as the deploy principal, with explicitly bounded IAM instead of broad project-editor style permissions.
- The output of this phase should make Phase 26 straightforward by surfacing deployed service URL, revision, and image identity in a machine-usable way.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and phase scope
- `.planning/PROJECT.md` — Active `v1.5` milestone goal and CI/CD constraints.
- `.planning/REQUIREMENTS.md` — `PIPE-03`, `PIPE-04`, and `GCP-03` for this phase.
- `.planning/ROADMAP.md` — Phase 25 goal and success criteria.
- `.planning/STATE.md` — Current sequencing and prior discussion decisions.

### Prior deployment and pipeline decisions that remain locked
- `.planning/phases/23-gcp-bootstrap-first-live-deployment/23-CONTEXT.md` — Long-lived Cloud Run target and preserved deployed contract.
- `.planning/phases/24-ci-validation-image-release-pipeline/24-CONTEXT.md` — Cloud Build-first pipeline, split validation gates, digest-backed identity, and mainline-only image publishing.
- `.planning/milestones/v1.4-phases/18-cloud-run-packaging-topology/18-CONTEXT.md` — Combined same-origin service contract.
- `.planning/milestones/v1.4-phases/19-shared-deployment-security-hardening/19-CONTEXT.md` — Authenticated access model and no-public-invoker rule.
- `.planning/milestones/v1.4-phases/20-gcp-persistence-operator-runbook/20-CONTEXT.md` — Mounted Cloud Storage store bridge that automated deploys must preserve.

### Current deployment and access artifacts
- `deploy/cloudrun/deploy.sh` — Existing deploy contract that automated CD must preserve.
- `deploy/cloudrun/grant-invoker.sh` — Existing access-grant helper that reflects the supported shared-access model.
- `deploy/cloudrun/README.md` — Supported authenticated Cloud Run access model.
- `deploy/cloudrun/RUNBOOK.md` — Current operator flow that Phase 25 must evolve toward hosted automation.
- `package.json` — Validation and acceptance commands already chosen for the pipeline.

### Existing contract tests and research context
- `packages/cli/test/cloud-run-security-contract.test.ts` — Locks deploy/access security assumptions.
- `packages/cli/test/cloud-run-runbook-contract.test.ts` — Locks helper behavior the automated path must preserve.
- `.planning/research/SUMMARY.md` — Milestone-level CI/CD recommendation and caveats.
- `.planning/research/STACK.md` — Compared hosted-source plus WIF against Cloud Build trigger patterns and bounded-auth requirements.
- `.planning/research/ARCHITECTURE.md` — Notes that CI/CD is not real without explicit source integration and trigger wiring.
- `.planning/research/PITFALLS.md` — Warns against pretending automation exists without source-host, auth, and trigger setup.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `deploy/cloudrun/deploy.sh` already provides the deploy primitive that automated CD should call or preserve semantically.
- `package.json` already defines the validation commands that upstream automated triggers should invoke.
- Existing Cloud Run security and runbook contract tests in `packages/cli/test/` give Phase 25 a local enforcement surface for hosted automation changes.

### Established Patterns
- Repo-owned shell helpers and contract tests are the existing deployment pattern; hosted automation should compose them rather than bypassing them with opaque console-only logic.
- The deployment shape is already intentionally Cloud Run-specific and authenticated; trigger integration should preserve those assumptions rather than generalizing them away.
- Mainline-only publish policy is already locked by Phase 24 and should carry straight through to deploy automation.

### Integration Points
- New checked-in Cloud Build trigger/config files and any supporting deploy metadata helpers.
- `deploy/cloudrun/` docs and scripts for automated deploy invocation and operator-facing explanation of the hosted path.
- `packages/cli/test/` for tests that lock trigger/deploy contract details where locally testable.

</code_context>

<deferred>
## Deferred Ideas

- GitHub Actions as an alternative primary deployment engine.
- Workload Identity Federation for external runners, because this phase prefers repository-connected Cloud Build execution.
- Manual-approval deploy gates or tag-only deploy policy.
- Live smoke orchestration and rollback decision logic.

</deferred>

---

*Phase: 25-secretless-cd-source-integration*
*Context gathered: 2026-04-06*
