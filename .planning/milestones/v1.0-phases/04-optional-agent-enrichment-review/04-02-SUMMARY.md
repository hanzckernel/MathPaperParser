---
phase: 04-optional-agent-enrichment-review
plan: "02"
subsystem: explorer-review
tags: [react, explorer, provenance, enrichment, review]
requires:
  - phase: 04-optional-agent-enrichment-review
    provides: Separate enrichment sidecar plus delivery-surface access
provides:
  - Optional enrichment loading in static and API modes
  - Provenance-gated graph visibility with deterministic edges defaulted on
  - Agent-inferred edge review metadata in the graph explanation panel
affects: [Phase 5, packages/web/src/App.tsx]
tech-stack:
  added: []
  patterns:
    - Optional sidecar loading with 404-tolerant fetch behavior
    - Graph trust controls keyed by provenance rather than evidence alone
key-files:
  created: [packages/web/test/data-source.test.ts]
  modified: [packages/web/src/lib/data-source.ts, packages/web/src/lib/dashboard-model.ts, packages/web/src/components/proof-graph-page.tsx, packages/web/src/App.tsx, packages/web/test/bundle-data.test.ts, packages/web/test/proof-graph-render.test.ts]
key-decisions:
  - "Keep the rest of the dashboard deterministic by default and make the graph route the explicit review surface for enrichment."
  - "Treat missing `enrichment.json` as optional so deterministic exports and API reads continue to work unchanged."
patterns-established:
  - "The explorer merges enrichment only where it is explicitly needed and defaults to deterministic provenance."
  - "Agent-inferred edges must surface confidence and review metadata when selected."
requirements-completed: [EXPL-04, ENRICH-03]
duration: 12min
completed: 2026-04-02
---

# Phase 04 Plan 02 Summary

**Load optional enrichment into the explorer and gate it behind provenance-level opt-in**

## Performance

- **Duration:** 12 min
- **Completed:** 2026-04-02
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Added `loadSerializedPaperData()` so static exports and API mode can opportunistically load `enrichment.json`.
- Merged enrichment edges into the graph route while keeping deterministic indexes for the rest of the dashboard.
- Replaced evidence-only graph visibility with provenance toggles that default to `explicit` and `structural`.
- Added confidence and review-status rendering for agent-inferred edges in the existing explanation panel.

## Task Commits

1. **Task 1: Load optional enrichment and merge it into the dashboard model** - `287da94` (feat)
2. **Task 2: Add provenance-layer controls and enrichment review detail to the graph page** - `287da94` (feat)

## Verification

- `npx vitest run packages/web/test/data-source.test.ts packages/web/test/bundle-data.test.ts packages/web/test/proof-graph-render.test.ts`
- `npm test`
- `npm run typecheck`

## Next Phase Readiness

- The milestone now has the full intended parse plus review surface: deterministic exploration by default and enrichment on demand.
- Phase 5 can prove the real gold-paper workflow from analyze through local export and inspection.

---
*Phase: 04-optional-agent-enrichment-review*
*Completed: 2026-04-02*
