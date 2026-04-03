# Phase 11: Dashboard Math Rendering Repair - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `11-CONTEXT.md` — this log preserves the alternatives considered.

**Gathered:** 2026-04-03
**Status:** Complete

## Discussion Summary

The phase discussion focused on three dashboard-math choices that materially change implementation outcome:
- how broadly MathJax rendering should be applied in the current UI
- how aggressive the fragment normalization pass should be
- how the dashboard should behave when a fragment still cannot be rendered safely

The user selected all three areas for discussion and chose explicit options for each.

## Questions and Selections

### 1. Rendering scope
**Question:** Where should MathJax rendering be required in this phase?

**Options presented:**
- `1A` Broad scope — render math anywhere extracted text appears across the dashboard.
- `1B` Medium scope — render math in the statement-bearing reading surfaces only.
- `1C` Minimal scope — repair only one primary theorem/detail surface and defer the rest.

**Selected:** `1B`

**Captured decision:** Phase 11 should repair the statement-bearing reading surfaces where users inspect extracted theorem content, but should not expand MathJax across every text field in the app.

### 2. Normalization strategy
**Question:** How aggressive should the pre-MathJax cleanup be?

**Options presented:**
- `2A` Conservative cleanup — normalize whitespace only and leave most unsupported fragments untouched.
- `2B` Aggressive normalization — rewrite common line-broken, wrapper-based, and package-dependent fragments into safer standalone TeX before rendering.
- `2C` Strict reject path — avoid rewrites and fall back quickly whenever the fragment is not already MathJax-safe.

**Selected:** `2B`

**Captured decision:** Phase 11 should use a stronger project-owned normalization pass that attempts to repair the common extracted fragment damage seen in current papers before rendering.

### 3. Fallback behavior
**Question:** What should users see when a fragment still cannot render safely?

**Options presented:**
- `3A` Inline fallback — show a clearly marked raw-source block in place of the failed render.
- `3B` Soft omission — show a short error note but hide the raw fragment by default.
- `3C` Global warning — report the issue elsewhere in the page and leave the local block unresolved.

**Selected:** `3A`

**Captured decision:** Rendering failures should degrade locally into an explicit inline raw-source block so the page remains usable and the user can still inspect the extracted text.

## Alternatives Not Chosen

- Rendering every extracted text field in the dashboard was rejected in favor of keeping this repair focused on reading-critical statement surfaces.
- Conservative cleanup and strict reject-only behavior were rejected in favor of a more capable normalization pass.
- Soft omission or global-only warnings were rejected in favor of an inline raw fallback that preserves access to the source fragment.

## Deferred Ideas

- Full-app MathJax coverage across general prose surfaces.
- Bundle-time normalization or schema changes for stored statement text.

---

*Phase: 11-dashboard-math-rendering-repair*
*Discussion logged: 2026-04-03*
