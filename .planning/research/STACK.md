# Stack Research: PaperParser v1.5

**Milestone:** `v1.5 GCP Deployment & CI/CD`
**Status:** Complete
**Date:** 2026-04-05
**Confidence:** HIGH

## Recommendation

Default recommendation:

- Keep the existing TypeScript monorepo, Dockerfile, and Node HTTP runtime.
- Keep Cloud Run as the single deployed service and Artifact Registry as the image registry.
- Execute the first live deployment using the repo-owned Cloud Run scripts before layering automation on top.
- Add CI/CD with **secretless Google auth** through **Workload Identity Federation** where possible.
- Make the automated path publish immutable images and deploy the same Cloud Run contract already documented in `v1.4`.
- Treat Cloud Build and Cloud Deploy as optional extension points, not mandatory complexity for the first live deploy.

## Core Stack

| Technology | Purpose | Why Recommended |
|------------|---------|-----------------|
| Cloud Run | Primary runtime target | Already the shipped deployment contract from `v1.4` |
| Artifact Registry | Immutable image storage | Standard registry for Cloud Run images and rollback-friendly deploys |
| Existing Dockerfile | Build artifact | Already checked in and tested locally |
| Cloud Storage bucket mount | Store-path persistence bridge | Reuses the shipped filesystem-backed store contract with bounded churn |
| Workload Identity Federation | Secretless CI/CD auth | Avoids long-lived service-account keys in CI |
| Hosted CI workflow engine | Validation, build, deploy orchestration | Needed to turn the current manual operator path into actual CI/CD |

## CI/CD Platform Options

### Recommended for `v1.5`

**Hosted source workflow + Workload Identity Federation + Artifact Registry + Cloud Run**

Why:
- Smallest delta from the shipped `v1.4` operator path
- Easy to keep the pipeline authoritative over test/build/deploy steps
- Matches official Google-auth and Cloud Run deploy actions
- Avoids adding Cloud Deploy / Skaffold complexity before there is clear multi-environment need

### Viable Alternative

**Cloud Build triggers + Artifact Registry + Cloud Run**

Why:
- More GCP-native
- Good fit if the source repository is connected directly to Cloud Build
- Strong option if the user wants Google-managed build execution

Tradeoff:
- still needs source connection setup
- adds trigger and repository-connection management on top of the current repo

### Heavier Follow-On

**Cloud Build / Git-host CI + Cloud Deploy**

When to use:
- multiple environments
- approval gates
- progressive promotion flow

Why not first:
- adds delivery-pipeline and target-management complexity
- overkill for the first successful live deployment of one Cloud Run service

## Recommended Stack Decision

1. **Keep Cloud Run + Artifact Registry as the runtime/deploy base.**
2. **Use immutable image tags** derived from commit SHA or release SHA.
3. **Prefer Workload Identity Federation** over service-account key JSON for pipeline auth.
4. **Automate the existing deploy path** instead of creating a second parallel deployment method.
5. **Defer Cloud Deploy** unless `v1.5` explicitly grows into multi-environment promotion.

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Long-lived service-account key JSON in CI secrets | Weakens the security model and creates rotation burden | Workload Identity Federation |
| CI/CD that shells into bespoke, unpublished workstation state | Breaks reproducibility | Checked-in workflow plus checked-in scripts |
| Public unauthenticated deploy flags in the pipeline | Would bypass the `v1.4` access model | Preserve authenticated access and explicit invoker grants |
| Cloud Deploy as mandatory first step | Too much orchestration for a single-service first live deployment | Direct automated Cloud Run deploy first |

## Key Official Findings

- Cloud Build can build and deploy images to Cloud Run directly.
- Cloud Build triggers can start builds from connected repositories.
- Cloud Deploy supports Cloud Run targets, but it is a separate delivery-pipeline layer.
- Google’s GitHub auth action recommends Workload Identity Federation over service-account keys.
- Google’s Cloud Run deploy action can deploy images, control traffic, and preserve private-service behavior.

## Sources

- Official docs:
  - https://cloud.google.com/build/docs/deploying-builds/deploy-cloud-run
  - https://docs.cloud.google.com/build/docs/automating-builds/create-manage-triggers
  - https://cloud.google.com/deploy/docs/deploy-app-run
  - https://cloud.google.com/artifact-registry/docs/docker/pushing-and-pulling
  - https://github.com/google-github-actions/auth
  - https://github.com/google-github-actions/deploy-cloudrun
- Local docs:
  - `deploy/cloudrun/README.md`
  - `deploy/cloudrun/RUNBOOK.md`
  - `deploy/cloudrun/deploy.sh`
