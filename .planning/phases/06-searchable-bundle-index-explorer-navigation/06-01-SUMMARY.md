---
phase: 06-searchable-bundle-index-explorer-navigation
plan: "01"
subsystem: shared-search-and-web-shell
tags: [search, cli, api, mcp, react, explorer]
requires:
  - phase: 06-searchable-bundle-index-explorer-navigation
    provides: Context, research, UI contract, and execution plan for explorer-linked paper search
provides:
  - Richer shared paper-local search results with disambiguating metadata
  - Explorer deep links via hash-route node targeting
  - Dashboard search panel that reuses the shared core search contract
affects: [Phase 7, packages/web/src/App.tsx, packages/cli/src/server.ts, packages/mcp/src/server.ts]
tech-stack:
  added: []
  patterns:
    - Browser-safe direct imports of shared core modules instead of the Node-heavy package barrel
    - Hash-route deep links for explorer node navigation
key-files:
  created: [packages/web/src/lib/hash-route.ts, packages/web/test/hash-route.test.ts]
  modified: [packages/core/src/types/search.ts, packages/core/src/search/keyword-search.ts, packages/web/src/App.tsx, packages/web/src/components/data-controls.tsx]
key-decisions:
  - "Reuse the existing `BundleQueryService` contract instead of creating a second search subsystem for the web app."
  - "Encode search-result navigation as `#/explorer/<nodeId>` so the explorer jump is explicit and testable."
patterns-established:
  - "Paper-local search metadata now travels through core, CLI, API, MCP, and the web shell with one additive contract."
  - "The dashboard shell can add user-facing capability without importing the Node-only core barrel."
requirements-completed: [SEARCH-01, SEARCH-02, SEARCH-03, SEARCH-04]
duration: 12min
completed: 2026-04-03
---

# Phase 06 Plan 01 Summary

**Make paper-local search explorer-linked and shared across surfaces**

## Performance

- **Duration:** 12 min
- **Completed:** 2026-04-03
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- Extended the shared search result contract so query hits now include kind, label, number, section, section title, and `latexLabel`.
- Expanded keyword matching over object identity fields such as theorem number and `latexLabel`, then proved the richer result shape across core, CLI, API, and MCP tests.
- Added browser-safe hash-route helpers so search results can deep-link directly to `explorer/<nodeId>`.
- Added a dashboard search panel in the existing shell that shows ranked result cards and an explicit `Open in Explorer` action without replacing the graph-page filter.
- Fixed the export regression by importing only browser-safe shared core modules into the web bundle instead of the Node-heavy root barrel.

## Task Commits

1. **Task 1-2: Extend the shared search contract and add explorer-linked dashboard search** - `7e21a3b` (feat)

## Verification

- `npx vitest run packages/core/test/query-service.test.ts packages/cli/test/read-commands.test.ts packages/cli/test/serve-app.test.ts packages/mcp/test/server.test.ts packages/web/test/data-controls-render.test.ts packages/web/test/hash-route.test.ts`
- `npx vitest run packages/web/test/proof-graph-render.test.ts`
- `npm test`
- `npm run typecheck`
- `npm run build --workspace @paperparser/web -- --outDir /tmp/paperparser-export-debug`

## Next Phase Readiness

- Phase 7 can build on a stable search/navigation surface instead of mixing parser hardening with ad hoc result UI.
- The milestone now has one finished user-facing slice: a mathematician can search a parsed paper, disambiguate results, and jump into the explorer directly.

---
*Phase: 06-searchable-bundle-index-explorer-navigation*
*Completed: 2026-04-03*
