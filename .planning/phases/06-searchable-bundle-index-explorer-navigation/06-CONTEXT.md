# Phase 06 Context

## Goal

Let a local mathematician search a stored parsed paper by label, title, or object name and jump directly into the explorer without inventing a second search workflow.

## Starting Point

- `v1.0` already ships paper-local query surfaces in core, CLI, API, and MCP:
  - `BundleQueryService.search()` in `packages/core/src/services/bundle-query-service.ts`
  - `paperparser query` in `packages/cli/src/index.ts`
  - `GET /api/papers/:id/query` in `packages/cli/src/server.ts`
  - `query_math_objects` and `search_concepts` in `packages/mcp/src/server.ts`
- The web app already depends on `@paperparser/core`, loads either static exports or API-backed paper bundles, and preserves `paper` in the URL.
- The graph route already has a local text filter in `packages/web/src/components/proof-graph-page.tsx`, but that filter only narrows visible nodes inside the graph view.
- The app shell already supports paper selection in API mode through `BundleDataControls` and route switching between overview, graph, explorer, innovation, and unknowns.

## What Is Missing

- SEARCH-01 and SEARCH-02 are only partially met:
  - search exists in machine-facing surfaces, but the current result contract is thin and does not reliably expose enough context for disambiguation in a human UI
  - the graph-page filter is not the same thing as a deliberate search result list
- SEARCH-03 is not met:
  - the web app does not present explicit search results that open the selected object in the explorer
  - there is no paper-local search surface in static mode that mirrors the stored-paper query behavior
- SEARCH-04 is not met:
  - current search behavior is split between `BundleQueryService` and ad hoc substring filtering in the graph route
  - the milestone wants shared search semantics across the shipped local surfaces rather than parallel logic

## Constraints

- Reuse the existing stored-paper and canonical-bundle flow. Do not introduce a separate search backend, external index, or hosted service.
- Keep the work paper-local for this phase. Corpus-wide search belongs to a later milestone item.
- Preserve the current app shell, routing, and local-first static/API dual mode.
- Prefer one shared search contract from `@paperparser/core` over duplicating matching logic inside the web layer.
- Keep direct navigation focused on the existing explorer route and selected-node model rather than adding a new page.

## Relevant Files

- `packages/core/src/search/keyword-search.ts`
- `packages/core/src/services/bundle-query-service.ts`
- `packages/core/src/types/search.ts`
- `packages/cli/src/index.ts`
- `packages/cli/src/server.ts`
- `packages/mcp/src/server.ts`
- `packages/web/src/App.tsx`
- `packages/web/src/lib/api-client.ts`
- `packages/web/src/components/data-controls.tsx`
- `packages/web/src/components/proof-graph-page.tsx`
- `packages/web/test/proof-graph-render.test.ts`
- `packages/cli/test/read-commands.test.ts`
- `packages/cli/test/serve-app.test.ts`
- `packages/mcp/test/server.test.ts`
