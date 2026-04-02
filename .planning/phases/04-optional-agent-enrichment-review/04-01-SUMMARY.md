---
phase: 04-optional-agent-enrichment-review
plan: "01"
subsystem: enrichment-artifact
tags: [enrichment, cli, api, mcp, sidecar]
requires:
  - phase: 04-optional-agent-enrichment-review
    provides: Context, research, validation, and execution plans for the optional enrichment layer
provides:
  - Separate `enrichment.json` sidecar with validation and consistency checks
  - Built-in local heuristic reviewer for deterministic transitive candidate edges
  - Opt-in CLI, export, serve, and MCP access to the enrichment artifact
affects: [Phase 4, Phase 5, packages/web/src/lib/data-source.ts]
tech-stack:
  added: []
  patterns:
    - Separate sidecar artifacts for probabilistic output
    - Honest local reviewer adapter instead of hidden remote-model dependency
key-files:
  created: [packages/core/src/types/enrichment.ts, packages/core/src/serialization/enrichment-serializer.ts, packages/core/src/enrichment/heuristic-reviewer.ts, schema/enrichment.schema.json, packages/cli/test/enrich-command.test.ts, packages/core/test/enrichment-service.test.ts]
  modified: [packages/cli/src/index.ts, packages/cli/src/store.ts, packages/cli/src/export.ts, packages/cli/src/server.ts, packages/mcp/src/server.ts, packages/mcp/src/store.ts]
key-decisions:
  - "Keep enrichment in a separate sidecar and never mutate `graph.json`."
  - "Use a deterministic local heuristic reviewer so the enrichment path is runnable in this repo today."
patterns-established:
  - "Optional second-pass artifacts use the same local store directory as the canonical bundle while preserving trust boundaries."
  - "Validation now treats enrichment as its own contract with base-bundle consistency checks."
requirements-completed: [ENRICH-01, ENRICH-02]
duration: 18min
completed: 2026-04-02
---

# Phase 04 Plan 01 Summary

**Create a real enrichment sidecar and expose it across CLI, export, serve, and MCP without touching the canonical bundle**

## Performance

- **Duration:** 18 min
- **Completed:** 2026-04-02
- **Tasks:** 2
- **Files modified:** 19

## Accomplishments

- Added a typed `enrichment.json` contract plus schema and consistency validation for agent-inferred candidate edges.
- Added a built-in local heuristic reviewer that proposes transitive `agent_inferred` dependencies with confidence and review metadata.
- Added `paperparser enrich` and persisted the sidecar beside the canonical bundle.
- Wired the sidecar into export, HTTP API, and MCP resources so downstream consumers can retrieve it explicitly.

## Task Commits

1. **Task 1: Add the enrichment sidecar contract, validation, and generation service** - `287da94` (feat)
2. **Task 2: Persist and expose enrichment through CLI, export, serve, and MCP** - `287da94` (feat)

## Verification

- `npx vitest run packages/core/test/enrichment-service.test.ts packages/cli/test/enrich-command.test.ts packages/cli/test/export-command.test.ts packages/cli/test/serve-app.test.ts packages/mcp/test/server.test.ts`
- `npm test`
- `npm run typecheck`

## Next Phase Readiness

- The explorer can now load a real enrichment sidecar instead of a placeholder resource.
- Phase 5 can exercise the full gold-paper workflow with enrichment as a first-class exported artifact.

---
*Phase: 04-optional-agent-enrichment-review*
*Completed: 2026-04-02*
