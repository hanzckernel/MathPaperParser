# Phase 19: Shared Deployment Security Hardening - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the new Cloud Run deployment path explicitly non-public by default. This phase owns the supported shared-deployment access model, the repo-defined deploy/access security config, and the guardrails that prevent operators from accidentally turning the service into an anonymous endpoint. It does not yet define persistence, backups, or the full operator runbook.

</domain>

<decisions>
## Implementation Decisions

### Supported Access Model
- **D-01:** The supported `v1.4` shared deployment path is direct Cloud Run service access at the authenticated service URL, not a public service and not a load-balancer/IAP topology yet.
- **D-02:** The service must keep the Cloud Run Invoker IAM check enabled; public access flags and `allUsers` grants are unsupported.
- **D-03:** Authorized humans or service accounts reach the service by receiving explicit `roles/run.invoker` grants.

### Ingress and Exposure
- **D-04:** The documented ingress model for this phase is the direct authenticated Cloud Run endpoint, so the repo must not imply a second undocumented public path.
- **D-05:** Repo-owned deploy/access scripts should make the supported secure path easy and the public path difficult or explicitly rejected.

### Operator Visibility
- **D-06:** Security behavior must be codified in repo-visible artifacts, not hidden in console-only steps.
- **D-07:** The hardening should be locally testable through script/config contract tests even if Cloud Run itself is not executed in CI.

### Phase Boundary Discipline
- **D-08:** This phase does not add application-level login UX; Cloud Run IAM is the shared-deployment auth boundary for now.
- **D-09:** Custom domains, external load balancers, IAP, and disabled default URLs are deferred until the project actually needs a more complex ingress model.
- **D-10:** Persistence and rollout/rollback procedures remain Phase 20 work.

### the agent's Discretion
- The exact repo-owned artifact shape for deploy/access commands or templates.
- The exact guardrails used to reject unsupported public principals such as `allUsers`.
- The exact tests proving the secure-path contract locally.

</decisions>

<specifics>
## Specific Ideas

- A repo-owned `deploy/cloudrun/deploy.sh` can pin `--invoker-iam-check` and other safe defaults.
- A separate `grant-invoker.sh` can require explicit principals and reject `allUsers` / `allAuthenticatedUsers`.
- Lightweight tests can mock `gcloud` to prove the scripts keep authentication enabled and reject public access.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and phase scope
- `.planning/PROJECT.md` — `v1.4` deployment-hardening goal.
- `.planning/REQUIREMENTS.md` — `ACCESS-01`, `AUTH-01`, and `AUTH-02`.
- `.planning/ROADMAP.md` — Phase 19 goal and success criteria.
- `.planning/STATE.md` — Current state after Phase 18.

### Deployment baseline
- `docs/deployment_readiness.md` — still names missing auth/access as the blocker.
- `.planning/research/SUMMARY.md` — Cloud Run milestone research.

### Current deployment artifacts
- `Dockerfile` — the Phase 18 Cloud Run packaging baseline.
- `README.md` — current deployment story after packaging/topology landed.

### Official Cloud Run references that shaped this phase
- Cloud Run public access docs: `--no-invoker-iam-check` makes a service public; the invoker IAM check is enforced by default.
- Cloud Run IAM access docs: `--invoker-iam-check` and `run.googleapis.com/invoker-iam-disabled: 'false'` codify authenticated access.
- Cloud Run ingress docs: ingress should be explicit in the deploy artifact even when using direct `run.app` access.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- The app/runtime no longer needs additional auth code for this phase if Cloud Run IAM remains the external access boundary.
- Phase 18 already established one combined service artifact; Phase 19 can build on that with repo-owned deploy/access scripts instead of touching the server again.

### Established Patterns
- This repo uses tests to lock operational contracts, not just prose.
- Deployment behavior should be explicit and versioned from the repo rather than left to console drift.

### Integration Points
- `deploy/cloudrun/` for deploy/access scripts or templates.
- `packages/cli/test/` for local contract tests around those artifacts.
- `README.md` and `docs/deployment_readiness.md` for the supported access model.

</code_context>

<deferred>
## Deferred Ideas

- Load balancer, IAP, custom domain, or disabled default URL ingress variants.
- GCP persistence, backups, rollout/rollback, and runbook details.
- End-to-end Cloud Run smoke execution.

</deferred>

---

*Phase: 19-shared-deployment-security-hardening*
*Context gathered: 2026-04-04*
