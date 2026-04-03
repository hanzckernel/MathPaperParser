# Phase 6: Searchable Bundle Index & Explorer Navigation - Research

**Generated:** 2026-04-03
**Status:** Ready for planning

## Research Question

What is the smallest coherent way to make search human-usable and explorer-linked in `v1.1` while keeping paper-local search semantics aligned across core, CLI, API, MCP, and the web app?

## Current Baseline

The repo already has a deterministic paper-local search path:

- `packages/core/src/search/keyword-search.ts` scores nodes by `label`, `statement`, and `sectionTitle`
- `BundleQueryService.search()` in `packages/core/src/services/bundle-query-service.ts` is the current shared service entry point
- CLI, serve API, and MCP all call that same service
- The web graph page currently uses its own local substring filter over visible nodes instead of the shared search service

The web package already depends on `@paperparser/core`, so there is no package-boundary blocker to reusing the shared search service in static mode.

## Findings

### 1. Phase 6 is an extension, not a new subsystem

Search already exists in the product. The missing work is:

- richer result context for human disambiguation
- explorer-directed navigation
- web integration that uses the same search contract as the machine-facing surfaces

That means this phase should avoid new storage or indexing layers.

### 2. The current search result contract is too thin for the UI requirement

`SearchResult` currently returns:

- `nodeId`
- `score`
- `mode`
- `matchedText`
- optional `excerpt`

That is enough for machine consumption but weak for a UI that must disambiguate results before navigation. Phase 6 likely needs additive metadata such as:

- node kind
- display label
- number
- section / section title
- optional `latexLabel`

This can stay additive and should not break existing consumers.

### 3. The web can reuse core search locally

Because `@paperparser/web` already depends on `@paperparser/core`, the static web flow can instantiate `BundleQueryService` directly from the loaded bundle and avoid drift from CLI/API/MCP search behavior.

Recommended shape:

- API mode: call the existing `/api/papers/:id/query` endpoint
- Static mode: use `BundleQueryService.search()` on the loaded bundle

This keeps one conceptual search path with two transport modes.

### 4. The graph-page text box should not remain the primary search UX

The existing graph filter is useful for visual narrowing, but it is not sufficient for Phase 6 because:

- it only affects one page
- it does not surface ranked result cards
- it does not provide explicit jump-to-explorer behavior
- it can hide the selected node instead of providing a deliberate result navigation flow

It should remain as a graph-local filter, not become the shared search contract.

### 5. No new library is needed

Framework discovery outcome:

1. Existing codebase solution exists: `BundleQueryService` and `keyword-search`
2. Existing dependencies are sufficient: `@paperparser/core` is already available to the web package
3. No external search library is justified for this milestone because the scope is deterministic, paper-local, and already implemented in-house

Decision: do not add a new dependency for Phase 6.

## Recommended Phase 6 Slice

1. Extend the shared core search result contract with additive context fields for UI disambiguation.
2. Improve keyword matching so object identity fields such as `number`, `kind`, and `latexLabel` participate in search.
3. Update CLI/API/MCP tests to confirm the richer result contract without regressing current behavior.
4. Add a paper-local search panel in the web app that:
   - works in static and API modes
   - shows ranked results with disambiguating metadata
   - opens the selected node in the explorer route
5. Keep the existing graph-page filter as a separate visual control rather than merging it into the main search result path.

## Risks

- Changing `SearchResult` shape affects multiple packages and tests at once.
- If the web app duplicates search logic instead of reusing core, Phase 6 will silently fail SEARCH-04 even if the UI looks good.
- If search results navigate by graph-only assumptions, explorer linking will feel unstable when routes or filters change.

## Suggested Acceptance Criteria

- Query results return enough metadata for a user to distinguish two nearby theorem-like hits without opening both.
- The web search surface works in both static and API mode.
- Selecting a search result opens the explorer with the target node selected.
- Existing CLI, API, and MCP query surfaces still behave consistently on stored papers.

## Likely File Touch Points

- `packages/core/src/types/search.ts`
- `packages/core/src/search/keyword-search.ts`
- `packages/core/src/services/bundle-query-service.ts`
- `packages/cli/src/server.ts`
- `packages/web/src/lib/api-client.ts`
- `packages/web/src/App.tsx`
- `packages/web/src/components/data-controls.tsx`
- `packages/core/test/query-service.test.ts`
- `packages/cli/test/read-commands.test.ts`
- `packages/cli/test/serve-app.test.ts`
- `packages/mcp/test/server.test.ts`
- `packages/web/test/`
