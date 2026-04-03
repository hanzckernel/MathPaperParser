# Phase 11: Dashboard Math Rendering Repair - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Restore readable math rendering in the existing dashboard by rendering extracted statement text with MathJax plus a project-owned normalization pass. This phase repairs the current reading experience in the dashboard surfaces where users inspect theorem-style content, while preserving the existing canonical bundle contract and avoiding any dependency on browser-side `amsmath` / `amsthm` rescue behavior.

</domain>

<decisions>
## Implementation Decisions

### Rendering Scope
- **D-01:** Phase 11 should apply MathJax rendering to the medium-scope statement-bearing reading surfaces in the current dashboard, not to every text field in the app.
- **D-02:** The required surfaces are the theorem/detail statement views where users read extracted node statements now: the Theorem Explorer detail panel and the Proof Graph detail/sidebar view.
- **D-03:** General prose and metadata surfaces such as stats, controls, innovation text, unknown descriptions, and other non-statement fields remain plain text in this phase.

### Fragment Normalization
- **D-04:** Use an aggressive project-owned normalization pass before MathJax rendering so extracted fragments with hard line breaks, theorem wrappers, or package-dependent constructs are rewritten into safer standalone fragments whenever possible.
- **D-05:** Normalization should solve common line-break damage and theorem-style wrapper issues in current extracted statements instead of expecting browser addon packages to compensate.
- **D-06:** Phase 11 must not change the canonical stored/exported bundle text contract; normalization happens at render time inside the dashboard.

### Failure Behavior
- **D-07:** If a statement fragment still cannot be rendered safely after normalization, the UI should fall back inline to a clearly marked raw-source block rather than breaking the page or silently dropping the content.
- **D-08:** Fallback behavior should be local to the affected statement block so the rest of the dashboard surface remains usable.

### the agent's Discretion
- The exact normalization heuristics, as long as they are project-owned, testable, and scoped to common extracted fragment damage.
- The exact MathJax wrapper component shape and render lifecycle, as long as it remains compatible with the existing dashboard structure and static export workflow.
- The exact styling of the inline fallback block, as long as it is clearly marked and readable.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and phase scope
- `.planning/PROJECT.md` — Active `v1.2` hardening scope and the requirement to fix rendering without broadening product scope.
- `.planning/REQUIREMENTS.md` — `MATH-01`, `MATH-02`, and `MATH-03` acceptance criteria for MathJax rendering, normalization, and graceful fallback.
- `.planning/ROADMAP.md` — Phase 11 success criteria and ordering relative to runtime/bootstrap follow-on work.
- `.planning/STATE.md` — Current milestone progress and autonomous sequencing expectations.

### Dashboard math contract
- `docs/dashboard_spec.md` — Approved MathJax runtime contract, normalization rules, and statement-surface rendering expectations.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/web/src/components/dashboard-pages.tsx`: The current Theorem Explorer renders `selectedNode.statement` as plain text in the main reading surface.
- `packages/web/src/components/proof-graph-page.tsx`: The current Proof Graph detail panel renders `selectedNode.statement` as plain text in the sidebar/detail surface.
- `packages/web/src/lib/dashboard-model.ts`: Existing dashboard model boundary that already supplies the statement text; Phase 11 should consume it without mutating bundle shape.
- `packages/web/test/proof-graph-render.test.ts`: Existing render-level regression tests already use fixture-backed HTML rendering and are the natural acceptance boundary for statement-surface behavior.
- `packages/web/package.json`: No MathJax dependency is present yet, so Phase 11 must add the rendering library intentionally.

### Established Patterns
- Web tests use `renderToStaticMarkup()` with fixture-backed dashboard models rather than browser E2E tests.
- The dashboard components are plain React function components with inline styles and no current client-side math rendering helper.
- Later-phase bootstrap/runtime work is already present as unrelated dirty changes in other web files; Phase 11 should avoid expanding into those files unless absolutely necessary.

### Integration Points
- `packages/web/src/components/dashboard-pages.tsx` for Theorem Explorer statement rendering.
- `packages/web/src/components/proof-graph-page.tsx` for Proof Graph detail rendering.
- `packages/web/src/lib/` for a shared normalization and MathJax render helper.
- `packages/web/test/proof-graph-render.test.ts` plus a new targeted rendering test for Phase 11 proof.

</code_context>

<specifics>
## Specific Ideas

- Keep the fix local to the current reading surfaces where raw theorem statements are visible today.
- Normalize broken extracted fragments aggressively before handing them to MathJax.
- If rendering still fails, show the original source inline in an explicit fallback block instead of letting the page degrade invisibly.

</specifics>

<deferred>
## Deferred Ideas

- Expanding MathJax to every prose field across Overview, Innovation, Unknowns, and control surfaces.
- Changing the canonical bundle schema or mutating exported statement text during analyze/export.

</deferred>

---

*Phase: 11-dashboard-math-rendering-repair*
*Context gathered: 2026-04-03*
