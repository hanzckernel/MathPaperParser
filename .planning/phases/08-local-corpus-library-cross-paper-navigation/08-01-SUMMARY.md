---
phase: 08-local-corpus-library-cross-paper-navigation
plan: "01"
subsystem: corpus-read-model
tags: [corpus, cli, api, mcp, web, navigation]
requires:
  - phase: 08-local-corpus-library-cross-paper-navigation
    provides: Context, research, and execution plan for the local corpus slice
provides:
  - Deterministic related-across-corpus matching with evidence terms
  - Corpus-aware listing metadata across CLI, API, MCP, and dashboard surfaces
  - API-mode dashboard navigation between stored papers with preserved paper identity
affects: [Phase 9, packages/core/src/services/corpus-query-service.ts, packages/web/src/App.tsx]
tech-stack:
  added: []
  patterns:
    - Corpus read model layered above paper-local canonical bundles
    - Explainable term-overlap navigation instead of speculative global graph edges
key-files:
  created: [packages/core/src/services/corpus-query-service.ts, packages/core/test/corpus-query-service.test.ts]
  modified: [packages/cli/src/index.ts, packages/cli/src/server.ts, packages/cli/src/store.ts, packages/mcp/src/server.ts, packages/mcp/src/store.ts, packages/web/src/App.tsx, packages/web/src/components/dashboard-pages.tsx, packages/web/src/components/data-controls.tsx, packages/web/src/lib/api-client.ts]
key-decisions:
  - "Keep each paper's canonical bundle isolated and add corpus behavior as a separate read model."
  - "Use deterministic shared-term evidence for cross-paper navigation instead of inventing a new canonical edge kind."
patterns-established:
  - "Corpus-aware features can ship consistently across CLI, API, MCP, and the dashboard without changing the canonical graph schema."
  - "Cross-paper navigation may return an explicit empty state; the system does not invent links when evidence is weak."
requirements-completed: [CORP-01, CORP-02, CORP-03, CORP-04]
duration: 24min
completed: 2026-04-03
---

# Phase 08 Plan 01 Summary

**Turn local multi-paper storage into a real corpus workflow with explainable cross-paper navigation**

## Performance

- **Duration:** 24 min
- **Completed:** 2026-04-03
- **Tasks:** 3
- **Files modified:** 18

## Accomplishments

- Added `CorpusQueryService` in core to compute deterministic related-across-corpus matches from shared distinctive terms while preserving paper-local graph boundaries.
- Added per-paper corpus metadata to stored-paper listings:
  - `warningCount`
  - `warningCodes`
  - `hasEnrichment`
- Added a new CLI surface:
  - `paperparser related <node-id> --paper <paper-id> [--limit <n>] [--json]`
- Added a new HTTP API route:
  - `GET /api/papers/:paperId/related/:nodeId`
- Added a new MCP tool:
  - `cross_paper_links`
- Upgraded the dashboard API mode to show:
  - a local corpus library instead of only a dropdown
  - paper origin in the explorer
  - a related-across-corpus panel with explainable evidence terms and click-through into the target paper
- Locked the Phase 8 contract in tests across core, CLI, API, MCP, and the web client/rendering layer.

## Task Commits

1. **Task 1-3: Add corpus tests, implement the corpus read model, and wire the dashboard** - pending phase commit

## Verification

- `npx vitest run packages/core/test/corpus-query-service.test.ts packages/cli/test/read-commands.test.ts packages/cli/test/serve-app.test.ts packages/mcp/test/server.test.ts packages/web/test/api-client.test.ts packages/web/test/data-controls-render.test.ts`
- `npm test`
- `npm run typecheck`
- `npm run build`

## Next Phase Readiness

- Phase 9 can now prove the accepted workflow on all three papers instead of treating corpus navigation as a planning claim.
- The milestone has a consistent corpus contract across all shipped local surfaces, so the acceptance gate can focus on proof rather than missing interfaces.

---
*Phase: 08-local-corpus-library-cross-paper-navigation*
*Completed: 2026-04-03*
