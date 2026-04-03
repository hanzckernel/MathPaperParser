# Phase 13: Export Acceptance & Operator Guidance - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Close the milestone by making the accepted local export workflow reproducible from the checked-in docs and by proving the hardening work from Phases 10-12 with a clear regression bundle. This phase is about acceptance evidence and operator guidance, not new dashboard behavior.

</domain>

<decisions>
## Implementation Decisions

### Acceptance Proof
- **D-01:** Phase 13 should treat the milestone proof as a focused local workflow: export completeness, MathJax rendering behavior, shell bootstrap, and runtime guard behavior proven through the current targeted regression suite.
- **D-02:** The milestone proof should be reproducible from documented commands in the repo without relying on hidden local knowledge.

### Operator Guidance
- **D-03:** The docs must explain that static dashboard exports are supported over HTTP, not direct `file://` opening.
- **D-04:** The docs must describe the shipped static export contract accurately, including explicit `enrichment.json` output and the expected MathJax normalization/rendering behavior.
- **D-05:** The user-facing guidance should stay local-first and should not imply that the current `serve` stack is production-ready.

### the agent's Discretion
- The exact regression command bundle used as the milestone proof, as long as it covers the Phase 10-12 acceptance boundaries explicitly.
- The exact placement of the operator guidance across `README.md`, `docs/user_guide.md`, and `docs/deployment_readiness.md`, as long as the local export workflow is easy to follow and consistent.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and phase scope
- `.planning/PROJECT.md` — Active milestone goals and local-first constraints.
- `.planning/REQUIREMENTS.md` — `REL-01` and `REL-02` acceptance criteria plus completed Phase 10-12 traceability.
- `.planning/ROADMAP.md` — Phase 13 success criteria and dependency on completed export/math/runtime phases.
- `.planning/STATE.md` — Current milestone status and autonomous sequencing expectations.

### Operator-facing docs
- `README.md` — Top-level quickstart and project status entrypoint for users.
- `docs/user_guide.md` — Detailed CLI/API/dashboard workflow guide that should become the canonical local operator reference.
- `docs/deployment_readiness.md` — Scope guard against accidentally presenting the current stack as production-ready.
- `docs/dashboard_spec.md` — Canonical statement on MathJax normalization, static serving expectations, and current dashboard behavior.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/cli/test/export-command.test.ts`: Phase 10 export-boundary proof for latest-paper selection, explicit `enrichment.json`, and deterministic output replacement.
- `packages/web/test/data-source.test.ts`: Static loader compatibility proof for explicit null enrichment handling.
- `packages/web/test/math-render.test.ts`: Phase 11 proof for statement normalization and inline fallback behavior.
- `packages/web/test/proof-graph-render.test.ts`: Fixture-backed proof that the statement-reading surfaces use the shared math wrapper.
- `packages/web/test/bootstrap.test.ts`: Strict `#root` bootstrap contract proof.
- `packages/web/test/runtime-environment.test.ts`: Static-vs-API runtime guard proof.
- `packages/web/test/exported-dashboard-shell.test.ts`: Exported shell contract proof for `#root`.
- `docs/user_guide.md` and `README.md`: Existing docs already cover export and static-mode basics but still need alignment with the hardened `enrichment.json`, MathJax, and HTTP-only export story.

### Established Patterns
- The milestone now has focused regression tests per boundary rather than one monolithic end-to-end suite.
- Operator docs live primarily in `README.md` and `docs/user_guide.md`, with deployment caveats separated into `docs/deployment_readiness.md`.
- The accepted local workflow is CLI-first and should stay explicit about unsupported production and `file://` cases.

### Integration Points
- `README.md` for concise top-level quickstart expectations.
- `docs/user_guide.md` for the canonical local export/serve workflow.
- `docs/deployment_readiness.md` for explicit non-production positioning.
- The Phase 10-12 regression tests as the milestone proof bundle.

</code_context>

<specifics>
## Specific Ideas

- Make the milestone proof command set small and explicit rather than telling users to infer it from many separate docs.
- Spell out that static exports now include `enrichment.json`, use bundled MathJax rendering, and must be served over HTTP.
- Keep the operator guidance local-first and explicit about what is and is not supported today.

</specifics>

<deferred>
## Deferred Ideas

- Production deployment instructions beyond the current readiness warning.
- A single combined web/API deployment artifact or hosted-ops runbook.

</deferred>

---

*Phase: 13-export-acceptance-operator-guidance*
*Context gathered: 2026-04-03*
