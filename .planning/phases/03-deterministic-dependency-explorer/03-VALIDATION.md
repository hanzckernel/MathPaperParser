---
phase: 03
slug: deterministic-dependency-explorer
status: draft
nyquist_compliant: false
created: 2026-04-02
---

# Phase 03 Validation Strategy

## Quick Run

`npx vitest run packages/web/test/proof-graph-render.test.ts packages/web/test/bundle-data.test.ts`

## Full Verification

- `npm test`
- `npm run typecheck`

## Must-Prove Behaviors

- The local graph explorer renders deterministic dependency inspection from the canonical bundle.
- A selected relation shows a structured explanation with provenance, evidence, and detail.
- Existing graph search/filter behavior remains intact.

## Manual Spot Check

- Export or load a stored bundle and confirm the graph route can:
  - select a node
  - select one of its edges
  - show a readable explanation of why that edge exists
