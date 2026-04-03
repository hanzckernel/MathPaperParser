# Phase 12: Dashboard Bootstrap & Runtime Guardrails - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Harden the dashboard bootstrap and runtime path so supported exports mount reliably and unsupported runtime conditions fail explicitly. This phase covers mount-target enforcement, static-export `file://` handling, and preserving valid API-backed usage. It does not broaden dashboard features or change the canonical data contract.

</domain>

<decisions>
## Implementation Decisions

### Unsupported Static Runtime UX
- **D-01:** Static dashboard exports opened directly from `file://` must show a full-page blocker card instead of attempting a partial or best-effort load.
- **D-02:** The blocker should state clearly that static exports must be served over HTTP and include an exact local-server command the operator can run.

### Mount Target Contract
- **D-03:** The dashboard bootstrap must fail fast if `#root` is missing rather than falling back to `#app` or auto-creating a mount node.
- **D-04:** Phase 12 should treat the React mount target as a strict shell/build contract so mount mismatches are surfaced explicitly.

### API Runtime Behavior
- **D-05:** API-backed dashboard usage must remain allowed even when the page is opened from `file://`.
- **D-06:** The unsupported-runtime blocker is only for static bundle loading, not for valid API mode.

### the agent's Discretion
- The exact full-page blocker copy and styling, as long as it is explicit, actionable, and clearly differentiated from a generic load failure.
- The exact test split between shell/bootstrap tests and runtime-environment tests, as long as the phase success criteria are covered.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and phase scope
- `.planning/PROJECT.md` — Active hardening-only milestone scope and local-first expectations.
- `.planning/REQUIREMENTS.md` — `EXPORT-03`, `DASH-01`, `DASH-02`, and `DASH-03` acceptance criteria.
- `.planning/ROADMAP.md` — Phase 12 success criteria and dependency on completed Phase 11 work.
- `.planning/STATE.md` — Current milestone progress and autonomous sequencing expectations.

### Dashboard/runtime contract
- `docs/dashboard_spec.md` — Static export serving expectations, shell layout assumptions, and the documented `file://` limitation.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/web/src/lib/bootstrap.ts`: Existing strict mount-target resolver already throws if `#root` is missing.
- `packages/web/src/lib/runtime-environment.ts`: Existing runtime gate already distinguishes static vs API sources and blocks static `file://` usage only.
- `packages/web/src/main.tsx`: Current app bootstrap now uses the shared mount resolver.
- `packages/web/src/App.tsx`: Current load flow already has a runtime blocker hook before static data loading.
- `packages/web/test/bootstrap.test.ts`: Existing bootstrap regression covers strict `#root` resolution.
- `packages/web/test/runtime-environment.test.ts`: Existing runtime regression covers static `file://` blocking and API allowance.
- `packages/web/test/exported-dashboard-shell.test.ts`: Existing shell regression checks exported dashboard HTML for the expected `#root` mount target.

### Established Patterns
- Runtime guardrails are small utility boundaries consumed by the main app bootstrap rather than being embedded ad hoc in the page components.
- The worktree already contains phase-relevant bootstrap/runtime code and tests; planning should evaluate and complete that work rather than duplicating it elsewhere.
- The approved decisions favor explicit unsupported-runtime failure over hidden fallbacks.

### Integration Points
- `packages/web/index.html` and exported dashboard shells for mount-target consistency.
- `packages/web/src/main.tsx` for strict bootstrap behavior.
- `packages/web/src/App.tsx` plus `packages/web/src/lib/runtime-environment.ts` for static-vs-API runtime gating.
- `packages/web/test/bootstrap.test.ts`, `packages/web/test/runtime-environment.test.ts`, and `packages/web/test/exported-dashboard-shell.test.ts` for the automated proof.

</code_context>

<specifics>
## Specific Ideas

- Show a full-page unsupported-runtime blocker for static `file://` loads instead of a blank shell or a partial render.
- Keep `#root` as the only valid mount point and treat any mismatch as an explicit packaging error.
- Preserve API mode over `file://` so valid operator workflows are not blocked by a static-mode safeguard.

</specifics>

<deferred>
## Deferred Ideas

- Automatic fallback mounting to alternate container IDs.
- Best-effort static `file://` support beyond a clear unsupported-runtime message.

</deferred>

---

*Phase: 12-dashboard-bootstrap-runtime-guardrails*
*Context gathered: 2026-04-03*
