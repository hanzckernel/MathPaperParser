---
phase: 02-canonical-objects-deterministic-relations
plan: "03"
subsystem: query-and-acceptance
tags: [query, impact, cli, mcp, stability]
requires:
  - phase: 02-canonical-objects-deterministic-relations
    provides: Richer canonical graph with anchors, provenance, and structural edges
provides:
  - Theorem-centric dependency and impact traversal despite stored structural edges
  - Full-suite proof that CLI, serve-app, and MCP surfaces still accept the richer graph
  - Green Phase 2 acceptance on tests and typecheck
affects: [Phase 3, packages/web/src/components/proof-graph-page.tsx, packages/cli/src/server.ts]
tech-stack:
  added: []
  patterns:
    - Separate raw-edge visibility from dependency-traversal semantics
    - Full-suite verification after canonical graph expansion
key-files:
  created: []
  modified: [packages/core/src/graph/knowledge-graph.ts, packages/core/src/services/bundle-query-service.ts, packages/core/test/query-service.test.ts]
key-decisions:
  - "Keep raw context edges complete, but restrict dependency and impact traversal to mathematical dependency kinds."
  - "Use the repo-wide test suite and typecheck as the Phase 2 acceptance gate instead of a narrower parser-only pass."
patterns-established:
  - "Structural edges are stored for inspection, but theorem-centric workflows consume an explicit dependency-edge allowlist."
  - "Phase completion claims require both targeted regressions and repo-wide verification."
requirements-completed: [REL-01, REL-02, REL-03, REL-04, ACC-02]
duration: 5min
completed: 2026-04-02
---

# Phase 02 Plan 03 Summary

**Fence structural edges out of dependency traversal, then verify the richer canonical graph across CLI, serve-app, MCP, tests, and typecheck**

## Performance

- **Duration:** 5 min
- **Completed:** 2026-04-02
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Added a dependency-edge allowlist so structural `contains`/`proves` edges remain inspectable but no longer pollute dependency or impact results.
- Added a targeted query-service regression proving raw context still exposes structural edges while theorem-centric traversal ignores them.
- Verified the entire repo with `npm test` and `npm run typecheck` after the canonical graph expansion.

## Task Commits

1. **Task 1: Keep structural edges stored without letting them break dependency traversal and impact semantics** - `8ebda4f` (feat)
2. **Task 2: Prove repo-wide acceptance for the richer Phase 2 graph** - `8ebda4f` (feat)

**Plan metadata:** `b132baa` (docs(02): add execution plans)

## Verification

- `npx vitest run packages/core/test/gold-paper-canonical-artifact.test.ts packages/core/test/ingestion-pipeline.test.ts packages/core/test/bundle-serializer.test.ts packages/core/test/validation.test.ts packages/web/test/bundle-data.test.ts packages/web/test/proof-graph-render.test.ts packages/core/test/contracts.test.ts packages/core/test/latex-flattener.test.ts`
- `npx vitest run packages/core/test/query-service.test.ts packages/cli/test/serve-app.test.ts packages/core/test/knowledge-graph.test.ts`
- `npm test`
- `npm run typecheck`

## Next Phase Readiness

- Phase 3 can build directly on a stable local HTML graph surface backed by a trustworthy canonical artifact.
- Phase 4 can assume deterministic provenance and source anchors already exist before adding optional agent enrichment.

---
*Phase: 02-canonical-objects-deterministic-relations*
*Completed: 2026-04-02*
