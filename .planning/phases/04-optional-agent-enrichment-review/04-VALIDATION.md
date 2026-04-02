---
phase: 04
slug: optional-agent-enrichment-review
status: draft
nyquist_compliant: false
created: 2026-04-02
---

# Phase 04 Validation Strategy

## Quick Run

`npx vitest run packages/core/test/enrichment-service.test.ts packages/cli/test/enrich-command.test.ts packages/cli/test/export-command.test.ts packages/cli/test/serve-app.test.ts packages/mcp/test/server.test.ts packages/web/test/bundle-data.test.ts packages/web/test/proof-graph-render.test.ts packages/web/test/data-source.test.ts packages/web/test/api-client.test.ts`

## Full Verification

- `npm test`
- `npm run typecheck`

## Must-Prove Behaviors

- A stored deterministic paper can be enriched in a second pass without changing `manifest.json`, `graph.json`, or `index.json`.
- The enrichment sidecar is stored separately, validated, and surfaced through CLI export, HTTP API, and MCP resources.
- The explorer defaults to deterministic edges and only shows agent-inferred edges when provenance filters opt in.
- Selected agent-inferred edges surface confidence and supporting review metadata.

## Manual Spot Check

- Run `paperparser analyze` and then `paperparser enrich` on a stored paper.
- Open the graph route and confirm:
  - deterministic edges are visible by default
  - enabling `agent_inferred` reveals extra review candidates
  - selecting one candidate edge shows confidence, provider metadata, and explanation text
