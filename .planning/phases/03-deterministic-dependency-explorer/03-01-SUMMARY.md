---
phase: 03-deterministic-dependency-explorer
plan: "01"
subsystem: web-explorer
tags: [react, graph, dependencies, edge-explanations, explorer]
requires:
  - phase: 03-deterministic-dependency-explorer
    provides: Context, research, validation, and execution plan for deterministic edge inspection
provides:
  - First-class edge inspection in the graph route
  - Structured edge explanation panel with provenance, evidence, detail, and metadata
  - Render regression for deterministic dependency explanations
affects: [Phase 4, packages/web/src/App.tsx]
tech-stack:
  added: []
  patterns:
    - Selected-edge state alongside selected-node state
    - Relation inspection that keeps node navigation as a secondary action
key-files:
  created: []
  modified: [packages/web/src/components/proof-graph-page.tsx, packages/web/test/proof-graph-render.test.ts]
key-decisions:
  - "Finish Phase 3 inside the existing graph route instead of splitting explorer behavior across multiple pages."
  - "Use deterministic bundle fields directly in the explanation panel rather than synthesizing extra UI-only explanation objects."
patterns-established:
  - "Graph detail now has a dedicated relation-inspection surface, not just node-to-node hopping."
  - "Structured why-this-edge-exists explanations are enforced by server-rendered tests."
requirements-completed: [EXPL-01, EXPL-02, EXPL-03]
duration: 5min
completed: 2026-04-02
---

# Phase 03 Plan 01 Summary

**Make deterministic relation inspection first-class in the graph explorer**

## Performance

- **Duration:** 5 min
- **Completed:** 2026-04-02
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments

- Added selected-edge state to `GraphPage` so dependency inspection can stop on a relation instead of only jumping to adjacent nodes.
- Added a structured explanation panel that shows source, target, provenance, evidence, why-this-edge-exists detail, and supporting metadata.
- Added a render regression proving the explanation panel appears for deterministic edges in the canonical fixture.

## Task Commits

1. **Task 1: Add first-class edge inspection to the graph detail surface** - `305c5e7` (feat)

## Verification

- `npx vitest run packages/web/test/proof-graph-render.test.ts packages/web/test/bundle-data.test.ts`
- `npm test`
- `npm run typecheck`

## Next Phase Readiness

- Phase 4 can now layer optional agent-inferred relations onto an explorer that already knows how to explain deterministic edges.
- The local explorer milestone is met for deterministic data: open the bundle, inspect a node, inspect its dependencies, inspect why an edge exists.

---
*Phase: 03-deterministic-dependency-explorer*
*Completed: 2026-04-02*
