# Phase 03 Context

## Goal

Let a local mathematician inspect deterministic dependencies and understand why each visible edge exists in the local HTML explorer.

## Starting Point

- Phase 2 is complete: the canonical bundle now includes first-class sections, proofs, equations, source anchors, explicit and structural deterministic edges, and edge provenance.
- The local explorer already exists in `packages/web/src/` and can be loaded from static exports or the local API.
- `GraphPage` already renders:
  - searchable/filterable graph nodes
  - visible edge filtering by evidence
  - selected-node detail with outgoing and incoming edge lists
- `ExplorerPage` already renders:
  - section-oriented browsing
  - selected-node statement plus simple Uses / Used By lists

## What Is Missing

- EXPL-03 is not met yet:
  - edge inspection is not first-class
  - there is no structured explanation panel for a selected relation
  - the UI surfaces `edge.kind` and `edge.evidence`, but not `detail`, `provenance`, or edge metadata as a reviewable explanation
- EXPL-02 is only partially deliberate:
  - users can see dependencies, but the dependency interaction is still node-first rather than dependency-first

## Constraints

- Stay local-first and artifact-backed. No hosted UI or collaboration work.
- Do not redesign the app shell or routing structure.
- Use the existing graph route and bundle model rather than inventing a second explorer surface.
- Keep agent-inferred filtering out of scope for this phase; provenance filtering for agent edges belongs to Phase 4.

## Relevant Files

- `packages/web/src/App.tsx`
- `packages/web/src/components/proof-graph-page.tsx`
- `packages/web/src/components/dashboard-pages.tsx`
- `packages/web/src/lib/dashboard-model.ts`
- `packages/web/test/proof-graph-render.test.ts`
- `packages/web/test/bundle-data.test.ts`
