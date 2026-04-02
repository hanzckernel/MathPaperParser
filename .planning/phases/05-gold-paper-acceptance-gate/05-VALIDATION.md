---
phase: 05
slug: gold-paper-acceptance-gate
status: draft
nyquist_compliant: false
created: 2026-04-02
---

# Phase 05 Validation Strategy

## Quick Run

`npx vitest run packages/cli/test/gold-paper-acceptance.test.ts`

## Full Verification

- `npm test`
- `npm run typecheck`
- `npm run build --workspace @paperparser/cli`
- built CLI manual check on `long_nalini`

## Must-Prove Behaviors

- The representative heavy paper can be analyzed, enriched, validated, and exported without manual intervention.
- The deterministic canonical bundle remains present and separate from `enrichment.json`.
- The exported local artifact includes the enrichment sidecar and is ready for local inspection.

## Manual Spot Check

- Run the built CLI on `ref/papers/long_nalini/arXiv-2502.12268v2/main.tex`.
- Confirm:
  - diagnostics are emitted
  - `enrichment.json` is created
  - `validate --json` reports `ok: true`
  - export writes `index.html` plus `data/manifest.json`, `data/graph.json`, `data/index.json`, and `data/enrichment.json`
