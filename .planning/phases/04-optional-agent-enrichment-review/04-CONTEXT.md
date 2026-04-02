# Phase 04 Context

## Goal

Let a local mathematician run an optional second-pass enrichment step, keep the deterministic bundle unchanged, and inspect agent-inferred candidate edges as a separate reviewable layer.

## Starting Point

- Phase 3 is complete: the local graph route now supports edge inspection with provenance, evidence, and explanation text.
- The deterministic canonical artifact remains the trusted baseline and is stored as `manifest.json`, `graph.json`, and `index.json`.
- Store-side sidecars already exist for diagnostics through `diagnostics.json`, which is the cleanest local pattern to reuse for enrichment.
- The MCP layer already advertises an `enrichment` resource URI, but it currently returns `index.json` rather than a real enrichment artifact.

## What Is Missing

- ENRICH-01 is not met yet:
  - there is no `enrich` CLI path or other second-pass workflow on stored papers
  - there is no provider adapter for generating review candidates from an existing deterministic artifact
- ENRICH-02 is not met yet:
  - there is no separate `enrichment.json` sidecar in the local store
  - export, serve, and MCP do not expose a distinct enrichment artifact
- ENRICH-03 and EXPL-04 are not met yet:
  - the explorer cannot load enrichment sidecars
  - graph filtering is still based on `evidence`, not `provenance`
  - agent-inferred edges are not a first-class review surface with confidence metadata

## Constraints

- Keep the deterministic canonical bundle byte-stable and unchanged by enrichment runs.
- Keep enrichment local-first and runnable without introducing a mandatory external model dependency.
- Use explicit artifact boundaries: canonical bundle in `manifest` / `graph` / `index`, optional enrichment in a separate sidecar.
- Keep deterministic edges as the default explorer view; agent-inferred edges must remain opt-in.
- Do not add manual graph editing or review-state mutation UI in this milestone.

## Relevant Files

- `packages/core/src/types/edge.ts`
- `packages/core/src/validation/schema-validator.ts`
- `packages/core/src/validation/consistency-checker.ts`
- `packages/cli/src/store.ts`
- `packages/cli/src/index.ts`
- `packages/cli/src/export.ts`
- `packages/cli/src/server.ts`
- `packages/mcp/src/server.ts`
- `packages/web/src/lib/data-source.ts`
- `packages/web/src/lib/dashboard-model.ts`
- `packages/web/src/components/proof-graph-page.tsx`
- `packages/cli/test/`
- `packages/mcp/test/server.test.ts`
- `packages/web/test/`
