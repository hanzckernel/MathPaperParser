# Phase 21: Cloud Run Acceptance Gate - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Turn the deployed Cloud Run path into one named, reproducible proof instead of a set of scattered tests and docs. This phase owns the acceptance command and smoke workflow description that prove Phases 17-20 together. It does not need live GCP execution from this workspace.

</domain>

<decisions>
## Implementation Decisions

### Acceptance Model
- **D-01:** The shipped `v1.4` proof is a repo-local named acceptance bundle, not a live-project Cloud Run deployment test.
- **D-02:** The proof must cover the full deployed contract: bounded deployed ingestion, same-origin dashboard serving, deployment artifact, shared-access security scripts, and mounted-bucket/runbook helpers.

### Operator Proof
- **D-03:** The repo should expose one named command for the milestone proof.
- **D-04:** The docs should identify that same command as the supported `v1.4` smoke bundle.

### Phase Boundary Discipline
- **D-05:** This phase does not attempt real Cloud Run provisioning from the CI/workspace environment.
- **D-06:** The smoke proof should still point operators to the live follow-up checks in the runbook when they execute against a real project.

### the agent's Discretion
- The exact test bundle composition, as long as it covers Phases 17-20 coherently.
- The exact doc location for the smoke workflow, as long as it is repo-visible and named.

</decisions>

<specifics>
## Specific Ideas

- Add `npm run test:acceptance:v1.4` at the repo root.
- Reuse the existing focused tests rather than inventing a new heavyweight harness.
- Publish a `deploy/cloudrun/SMOKE.md` or similar short note that maps the acceptance command to the live operator checks.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/REQUIREMENTS.md` — `REL-03`, `REL-04`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `deploy/cloudrun/RUNBOOK.md`
- `package.json`
- `packages/cli/test/serve-app.test.ts`
- `packages/web/test/bundle-data.test.ts`
- `packages/cli/test/cloud-run-artifact.test.ts`
- `packages/cli/test/cloud-run-security-contract.test.ts`
- `packages/cli/test/cloud-run-runbook-contract.test.ts`

</canonical_refs>

<deferred>
## Deferred Ideas

- Live Cloud Run smoke execution in CI
- Real GCP project provisioning automation

</deferred>

---

*Phase: 21-cloud-run-acceptance-gate*
*Context gathered: 2026-04-04*
