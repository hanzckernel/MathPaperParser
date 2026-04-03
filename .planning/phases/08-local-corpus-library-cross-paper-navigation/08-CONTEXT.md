# Phase 08 Context

## Goal

Support a local multi-paper corpus with trustworthy paper switching and explainable cross-paper navigation, while keeping each paper's canonical bundle separate.

## Starting Point

- Phase 7 is complete; the accepted corpus now parses deterministically across:
  - `ref/papers/long_nalini/arXiv-2502.12268v2/main.tex`
  - `ref/papers/medium_Mueller.flat.tex`
  - `ref/papers/short_Petri.tex`
- The local store already supports multiple paper directories via `packages/cli/src/store.ts`.
- The CLI already supports:
  - `analyze`, `list`, `validate`, `query`, `context`, `impact`, `export`, `serve`, `mcp`
- The HTTP API already supports:
  - `GET /api/papers`
  - `GET /api/papers/:id/{manifest,graph,index,enrichment,validate,query,context,impact}`
- The React dashboard already supports API-backed paper switching through `?api=...&paper=<paper-id>`.
- The MCP server already supports per-paper query, context, impact, validation, and bundle resources.

## What Is Missing

- CORP-01 is only partially met:
  - the store can hold multiple papers, but the corpus surfaces do not yet expose enough per-paper state to make the library feel intentional and collision-safe
  - the milestone corpus choice now includes both `medium_Mueller.flat.tex` and `short_Petri.tex`, but that is not yet reflected in a tested corpus workflow
- CORP-02 is only partially met:
  - paper switching exists in API mode, but the dashboard still presents it as a thin dropdown instead of a local corpus library
- CORP-03 is not met:
  - there is no cross-paper navigation surface today
- CORP-04 is only partially met:
  - paper IDs are preserved at the store and API boundary, but cross-paper evidence does not exist yet, so the UI and tool surfaces cannot explain origin and relation ownership

## Measured Corpus Evidence

- There are no shared LaTeX labels between the three milestone papers.
- There are no obvious exact citation-key overlaps in the current canonical artifacts.
- There are domain-level terminology overlaps, but naive token overlap is noisy because TeX math syntax dominates raw text.
- A targeted keyword probe shows there is at least some explainable cross-paper terminology overlap around phrases such as `hyperbolic` / `surface`, especially between `long_nalini` and `short_Petri`.

## Constraints

- Do not merge multiple papers into one canonical graph. The bundle remains paper-local.
- Do not invent cross-paper edges without explainable evidence.
- Keep cross-paper navigation deterministic in this phase; agent-inferred global links remain out of scope.
- Prefer a corpus read model layered on top of stored bundles rather than schema churn inside the canonical artifact.
- Preserve local-first behavior. Corpus features should work from the existing local store and serve/MCP surfaces.

## Relevant Files

- `packages/core/src/services/bundle-query-service.ts`
- `packages/core/src/types/search.ts`
- `packages/cli/src/store.ts`
- `packages/cli/src/index.ts`
- `packages/cli/src/server.ts`
- `packages/cli/test/read-commands.test.ts`
- `packages/cli/test/serve-app.test.ts`
- `packages/web/src/App.tsx`
- `packages/web/src/components/data-controls.tsx`
- `packages/web/src/components/dashboard-pages.tsx`
- `packages/web/src/lib/api-client.ts`
- `packages/mcp/src/server.ts`
- `packages/mcp/test/server.test.ts`
