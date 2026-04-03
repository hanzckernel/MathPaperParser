---
phase: 11-dashboard-math-rendering-repair
plan: "01"
subsystem: dashboard-math-rendering
tags: [dashboard, web, mathjax, rendering, vitest]
requires:
  - phase: 11-dashboard-math-rendering-repair
    provides: Context and execution plan for dashboard math rendering repair
provides:
  - Shared MathJax statement renderer for the current dashboard reading surfaces
  - Render-time normalization for line-broken and package-dependent statement fragments
  - Inline raw-source fallback when normalization or runtime rendering cannot complete safely
  - Fixture-backed proof that the theorem explorer and proof-graph detail surfaces use the shared renderer
affects: [Phase 12, packages/web/src/components/dashboard-pages.tsx, packages/web/src/components/proof-graph-page.tsx]
tech-stack:
  added: [mathjax]
  patterns:
    - Load the official bundled MathJax browser component locally rather than depending on a CDN runtime
    - Normalize extracted statement fragments at render time so the canonical bundle text remains unchanged
    - Keep rendering failures local to the affected statement block via explicit inline fallback
key-files:
  created:
    - packages/web/src/lib/math-render.tsx
    - packages/web/src/vite-env.d.ts
    - packages/web/test/math-render.test.ts
  modified:
    - packages/web/package.json
    - package-lock.json
    - packages/web/src/components/dashboard-pages.tsx
    - packages/web/src/components/proof-graph-page.tsx
    - packages/web/test/proof-graph-render.test.ts
    - packages/web/tsconfig.json
key-decisions:
  - "Phase 11 stays focused on the current statement-bearing reading surfaces instead of expanding MathJax across all dashboard prose."
  - "Normalization rewrites common package-dependent references and wrapper environments before MathJax sees the fragment."
  - "The dashboard uses a local bundled `tex-chtml-nofont` MathJax component and falls back inline when rendering still cannot complete safely."
patterns-established:
  - "Dashboard math rendering should be mediated through a shared wrapper rather than ad hoc component-level text blocks."
  - "Unsupported TeX fragments are surfaced explicitly to the user instead of relying on browser-side rescue packages or silent failures."
requirements-completed: [MATH-01, MATH-02, MATH-03]
duration: 28min
completed: 2026-04-03
---

# Phase 11 Plan 01 Summary

**Repair dashboard statement rendering with local MathJax plus fragment normalization**

## Performance

- **Duration:** 28 min
- **Completed:** 2026-04-03
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- Added the official `mathjax` package to the web workspace and used the bundled local `tex-chtml-nofont` browser component instead of a CDN runtime.
- Introduced a shared `MathTextBlock` wrapper that normalizes extracted statement fragments, loads MathJax once, clears prior math items on updates, and typesets only the targeted statement block.
- Rewrote common package-dependent constructs such as `\ref`, `\eqref`, `\cite`, theorem wrappers, and selected display environments into safer standalone render-time fragments without mutating the stored/exported bundle text.
- Added an explicit inline raw-source fallback block for unsupported environments or runtime typesetting failures.
- Replaced the theorem explorer and proof-graph detail statement blocks with the shared renderer.
- Added direct normalization/fallback regressions and extended the fixture-backed proof-graph render tests to prove that both current reading surfaces mount the shared math wrapper.

## Task Commits

1. **Task 1-3: Add regressions, implement shared MathJax rendering, and wire the statement surfaces** - pending phase commit

## Verification

- `PATH=/opt/homebrew/bin:$PATH npm test -- packages/web/test/math-render.test.ts`
- `PATH=/opt/homebrew/bin:$PATH npm test -- packages/web/test/proof-graph-render.test.ts`
- `PATH=/opt/homebrew/bin:$PATH npm run typecheck`

## Next Phase Readiness

- Phase 12 can treat math rendering as an explicit app boundary and focus on shell/bootstrap/runtime failures instead of raw-statement readability.
- Phase 13 can build on the new focused regressions when assembling the milestone proof for the supported local export workflow.

---
*Phase: 11-dashboard-math-rendering-repair*
*Completed: 2026-04-03*
