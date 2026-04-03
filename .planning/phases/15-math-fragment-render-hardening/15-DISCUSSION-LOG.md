# Phase 15: Math Fragment Render Hardening - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `15-CONTEXT.md` — this log preserves the alternatives considered.

**Gathered:** 2026-04-03
**Status:** Complete

## Discussion Summary

The phase discussion focused on three render-hardening choices that materially change implementation outcome:
- whether to target accepted-corpus failures first or optimize for broader reusable classes
- how aggressive display reshaping should be when the extracted fragment is ambiguous
- how far to expand command normalization without crossing into package emulation

The user selected one option in each area.

## Questions and Selections

### 1. Targeting strategy
**Question:** What should Phase 15 optimize for first?

**Options presented:**
- `1A` Accepted-corpus first — target the fragments still failing on the shipped corpus, plus one adjacent reusable class.
- `1B` Reusable-class first — target the broadest fragment classes even if they are not today’s main corpus blockers.
- `1C` Fixture-library first — broaden the synthetic hard-case suite before chasing corpus failures.

**Selected:** `1A`

**Captured decision:** Phase 15 should optimize for accepted-corpus render failures first and only absorb one adjacent reusable class if it comes naturally.

### 2. Ambiguous display shaping
**Question:** How aggressive should the render boundary be when a fragment’s display structure is ambiguous?

**Options presented:**
- `2A` Prefer explicit fallback when structure is ambiguous.
- `2B` Rewrite aggressively into `$$ ... $$` blocks and accept some formatting loss to maximize rendered output.
- `2C` Keep partially rendered fragments with raw LaTeX left inline.

**Selected:** `2B`

**Captured decision:** Phase 15 should prefer aggressive display salvage through `$$ ... $$` rewrites when the result remains readable enough to be honest.

### 3. Command normalization scope
**Question:** How far should command rewrites go in this phase?

**Options presented:**
- `3A` Expand readable command rewrites without package emulation.
- `3B` Keep command handling narrow and let command-heavy fragments fall back.
- `3C` Push toward broader LaTeX-package emulation in the browser.

**Selected:** `3A`

**Captured decision:** Phase 15 should expand the bounded project-owned command rewrite set, but it must stop short of general browser-side package emulation.

## Alternatives Not Chosen

- Reusable-class-first and fixture-library-first strategies were rejected in favor of accepted-corpus-first targeting.
- Conservative fallback-first shaping and mixed partially rendered output were rejected in favor of aggressive display salvage.
- Narrow command handling and broad package emulation were both rejected in favor of bounded readable rewrites.

## Deferred Ideas

- Broad browser-side LaTeX package emulation.
- Global MathJax coverage outside the current statement-reading surfaces.

---

*Phase: 15-math-fragment-render-hardening*
*Discussion logged: 2026-04-03*
