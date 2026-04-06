# Phase 24: CI Validation & Image Release Pipeline - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `24-CONTEXT.md` — this log preserves the alternatives considered.

**Gathered:** 2026-04-06
**Status:** Complete

## Discussion Summary

The phase discussion focused on the decisions that most change the first CI/image-release contract:
- whether an existing pending todo about stale sample artifacts should be folded into this phase
- whether the checked-in pipeline host should be GitHub Actions, Cloud Build, or a host-agnostic local-script contract
- whether validation should be one heavy universal gate or split into fast and release paths
- whether published images should be identified by tags alone or by digest-backed immutable identity
- whether image publishing should be mainline-only or broadened to preview-style branch publishing

The user chose to fold the stale-artifact todo into this phase, use a split validation gate, publish digest-backed commit-SHA images, and restrict publishing to protected mainline. For the pipeline host, the user asked to choose based on the repo’s current hosting baseline; after checking the workspace, the repo has no configured git remote and no `.github/` workflows, so the phase locks to Cloud Build as the primary checked-in contract.

## Questions and Selections

### 0. Todo folding
**Question:** Should the pending stale-sample-artifact todo be folded into this phase?

**Options presented:**
- `0A` Keep the stale-sample todo deferred.
- `0B` Fold it into Phase 24 as part of release-pipeline scope.

**Selected:** `0B`

**Captured decision:** Fold the todo into Phase 24, but only as a release-artifact freshness concern rather than a general sample-dashboard scope expansion.

### 1. Pipeline host contract
**Question:** Should the checked-in pipeline source of truth be GitHub Actions, Cloud Build, or a host-agnostic local-script contract?

**Options presented:**
- `1A` GitHub Actions is the checked-in source of truth.
- `1B` Cloud Build config is the primary checked-in pipeline.
- `1C` Keep Phase 24 host-agnostic with local scripts only.

**User direction:** Use `1A` only if the current repo already supports GitHub hosting; otherwise use `1B`, because GCP is the major hosting platform.

**Repo check performed:** The workspace has no configured git remote and no `.github/` directory or workflow baseline.

**Locked result:** `1B`

**Captured decision:** Phase 24 should use a GCP-native Cloud Build definition as the checked-in pipeline contract. GitHub-host integration can arrive later, but it should not be the initial source-of-truth contract before the repo actually has a hosted-source baseline.

### 2. Validation gate shape
**Question:** Should validation use one heavy gate everywhere or split fast and release gates?

**Options presented:**
- `2A` One heavy gate everywhere.
- `2B` Broadest gate with full repo test suite before publish.
- `2C` Split gates: fast CI on PRs, heavier release gate before image publish.

**Selected:** `2C`

**Captured decision:** Split the validation contract into a faster early gate and a heavier pre-publish release gate.

### 3. Image identity contract
**Question:** Should published images be identified by tag only or by digest-backed immutable identity?

**Options presented:**
- `3A` Publish commit-SHA tags and capture the pushed image digest; later deploy by digest.
- `3B` Publish commit-SHA tags only; later deploy by tag.
- `3C` Publish human version tags only.

**Selected:** `3A`

**Captured decision:** Publish commit-SHA-tagged images and capture the pushed digest as the canonical immutable deployment identity.

### 4. Release trigger policy
**Question:** When should image publishing happen?

**Options presented:**
- `4A` Publish images only from the protected mainline branch after the release gate passes.
- `4B` Publish images from every branch/PR for preview-style use.
- `4C` Keep image publish manual in Phase 24 and automate only validation.

**Selected:** `4A`

**Captured decision:** Restrict automated image publishing to protected mainline after the heavier release gate passes.

## Alternatives Not Chosen

- Keeping the stale-artifact todo fully deferred.
- Defining GitHub Actions as the primary pipeline host before the repo actually has a GitHub-hosted baseline.
- Staying host-agnostic with local scripts only.
- Using the same heavy validation bundle for every path.
- Deploying later by tag only rather than capturing image digest identity.
- Publishing preview-style images for every branch or PR.

## Deferred Ideas

- GitHub-hosted workflow execution or other source-host-specific trigger wiring.
- Secretless pipeline authentication and deploy-time source integration.
- Preview-image or preview-environment workflows.
- Automated live smoke and rollback execution.

---

*Phase: 24-ci-validation-image-release-pipeline*
*Discussion logged: 2026-04-06*
