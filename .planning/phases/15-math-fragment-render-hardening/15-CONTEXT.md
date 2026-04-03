# Phase 15: Math Fragment Render Hardening - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Expand the existing MathJax normalization and fallback boundary so more extracted math fragments typeset cleanly on the current statement-reading surfaces. This phase improves render-time shaping only: it does not widen UI coverage, mutate canonical bundle text, or attempt broad LaTeX package emulation in the browser.

</domain>

<decisions>
## Implementation Decisions

### Targeting Strategy
- **D-01:** Phase 15 should optimize for the fragments still failing on the accepted corpus first.
- **D-02:** The phase may absorb one adjacent reusable fragment class if it falls out naturally from the same normalization work, but accepted-corpus failures remain the anchor.

### Ambiguous Display Shaping
- **D-03:** When normalization can plausibly recover a display fragment by rewriting it into `$$ ... $$`, Phase 15 should prefer rendering over conservative fallback.
- **D-04:** Some formatting loss is acceptable if the result is still a readable and honest mathematical display rather than a silent mis-render.

### Command Normalization Scope
- **D-05:** Phase 15 should expand readable command rewrites for the next bounded class of parser-exposed commands or wrappers.
- **D-06:** Command normalization must stay project-owned and bounded; do not broaden into general browser-side package emulation.

### the agent's Discretion
- The exact accepted-corpus fragments to target first, as long as they represent the current render failures materially.
- The exact normalization heuristics for ambiguous display shaping, as long as unsupported cases still degrade explicitly when the rewrite is not defensible.
- The exact command rewrite set, as long as it improves readability without overstating compatibility.

</decisions>

<specifics>
## Specific Ideas

- Accepted-corpus-first means the phase should measure the fragments still falling back today and target those before broad synthetic coverage.
- The user prefers aggressive render salvage for ambiguous display fragments instead of conservative fallback-only behavior.
- Additional command normalization should make extracted statements easier to read, but must stop short of pretending the browser understands arbitrary LaTeX packages.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and phase scope
- `.planning/PROJECT.md` — Current `v1.3` scope, render-trust constraints, and the post-Phase-14 residual state.
- `.planning/REQUIREMENTS.md` — `MATH-04`, `MATH-05`, and `MATH-06` acceptance criteria for render hardening.
- `.planning/ROADMAP.md` — Phase 15 goal, dependencies, and success criteria.
- `.planning/STATE.md` — Current milestone state after Phase 14 completion.

### Prior render contract
- `.planning/phases/11-dashboard-math-rendering-repair/11-CONTEXT.md` — Locked surface scope, render-time-only normalization, and local fallback behavior from the earlier render-repair phase.
- `.planning/phases/11-dashboard-math-rendering-repair/11-VERIFICATION.md` — What Phase 11 actually proved and where the current math boundary stops.

### Current phase baseline
- `.planning/phases/14-residual-tex-parser-hardening/14-01-SUMMARY.md` — Updated parser baseline that Phase 15 now renders on top of.
- `.planning/phases/14-residual-tex-parser-hardening/14-VERIFICATION.md` — Reduced accepted-corpus residual parser budget and the deferred figure-reference slice.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/web/src/lib/math-render.tsx`: Owns the current normalization, MathJax loading, and fallback boundary; Phase 15 should extend this file rather than creating a second render path.
- `packages/web/test/math-render.test.ts`: Direct proof boundary for normalization heuristics and fallback decisions.
- `packages/web/test/proof-graph-render.test.ts`: Surface-wiring proof for the current statement-bearing views.
- `packages/web/src/components/dashboard-pages.tsx` and `packages/web/src/components/proof-graph-page.tsx`: Existing consumers of the shared render helper that should remain the only scoped statement surfaces.

### Established Patterns
- Render changes are tested with direct helper regressions plus static-markup surface tests, not browser E2E.
- The app already tolerates explicit local fallback blocks and does not need a second failure surface.
- Phase 11 kept command rewrites project-owned and bounded; Phase 15 should extend that pattern rather than introducing MathJax package rescue behavior.

### Integration Points
- `packages/web/src/lib/math-render.tsx` for new normalization heuristics and fallback decisions.
- `packages/web/test/math-render.test.ts` for direct fragment regressions.
- `packages/web/test/proof-graph-render.test.ts` if any surface-level expectation changes are needed while keeping the same rendering boundary.

</code_context>

<deferred>
## Deferred Ideas

- Broad browser-side LaTeX package emulation.
- Expanding MathJax to non-statement prose or metadata surfaces.
- Canonical bundle text mutation during analyze/export.

</deferred>

---

*Phase: 15-math-fragment-render-hardening*
*Context gathered: 2026-04-03*
