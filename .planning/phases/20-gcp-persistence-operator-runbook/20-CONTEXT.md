# Phase 20: GCP Persistence & Operator Runbook - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the now-secured Cloud Run deployment path actually operable by defining one supported persistence strategy and one repo-backed operator workflow. This phase owns the store mount strategy, required service-account storage access, and the build/deploy/upgrade/rollback runbook. It does not yet try to replace the file-backed store with a new data plane.

</domain>

<decisions>
## Implementation Decisions

### Supported Persistence Strategy
- **D-01:** The supported `v1.4` persistence bridge is a dedicated Cloud Storage bucket mounted into the Cloud Run service file system.
- **D-02:** The app keeps using the existing filesystem-backed store contract at `/var/paperparser/store`; Cloud Run volume mounts provide the bridge instead of a bundle-store rewrite.
- **D-03:** The operator contract must call out Cloud Storage FUSE limitations explicitly: non-POSIX semantics, no file locking, and last-write-wins on concurrent overwrites.

### Operational Assumptions
- **D-04:** The supported first deployment path is for low-concurrency shared use, not a high-write multi-instance workload.
- **D-05:** The runtime service account must have object-level access to the store bucket.

### Runbook Scope
- **D-06:** The runbook must cover build/push, bucket creation/access, deploy, invoker grants, verify, upgrade, and rollback.
- **D-07:** Upgrade and rollback should stay repo-visible and based on standard Cloud Run revision/traffic commands.

### Phase Boundary Discipline
- **D-08:** This phase does not replace Cloud Storage with SQL, Filestore, or a custom persistence service.
- **D-09:** The final smoke proof remains Phase 21 work.

### the agent's Discretion
- The exact mix of script updates versus runbook prose, as long as the supported persistence path is explicit and repeatable.
- The exact deploy-helper env surface for the bucket mount.
- The exact rollback helper or documented command surface.

</decisions>

<specifics>
## Specific Ideas

- Extend `deploy/cloudrun/deploy.sh` to require `PAPERPARSER_STORE_BUCKET` and mount it into `/var/paperparser/store`.
- Add a repo runbook under `deploy/cloudrun/` instead of burying the operator story in one paragraph in `README.md`.
- Add a small rollback helper or at minimum a documented `gcloud run services update-traffic` command path.
- Mocked `gcloud` tests can pin the volume mount flags and rollback command shape locally.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and phase scope
- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md` — `STORE-01`, `OPS-02`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`

### Current deployment artifacts
- `Dockerfile`
- `deploy/cloudrun/deploy.sh`
- `deploy/cloudrun/grant-invoker.sh`
- `deploy/cloudrun/README.md`
- `docs/deployment_readiness.md`

### Official Cloud Run references that shaped this phase
- Cloud Run Cloud Storage volume mount docs — mounting a bucket as a filesystem path, write support, required roles, and limitations.
- Cloud Run rollouts/rollbacks docs — `gcloud run services update-traffic`.
- Artifact Registry deploy docs — deploying container images to Cloud Run from Artifact Registry.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- The app already honors `PAPERPARSER_STORE_PATH`, so a mounted bucket can satisfy the existing store contract without code changes.
- The Phase 19 deploy helper is the natural place to add the bucket mount flags.

### Established Patterns
- Deployment behavior in this repo is being codified through small scripts plus local contract tests.
- The repo prefers explicit documentation of unsupported concurrency/consistency behavior over pretending the bridge is a perfect filesystem.

### Integration Points
- `deploy/cloudrun/deploy.sh` for the mounted-bucket runtime contract.
- `deploy/cloudrun/README.md` and a new runbook doc for operator guidance.
- `packages/cli/test/` for mocked `gcloud` contract coverage.

</code_context>

<deferred>
## Deferred Ideas

- Replacing the filesystem-backed store.
- Full acceptance smoke against a live Cloud Run service.
- Load-balanced or custom-domain deployment topologies.

</deferred>

---

*Phase: 20-gcp-persistence-operator-runbook*
*Context gathered: 2026-04-04*
