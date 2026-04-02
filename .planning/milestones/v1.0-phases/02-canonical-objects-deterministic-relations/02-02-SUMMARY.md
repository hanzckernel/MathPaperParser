---
phase: 02-canonical-objects-deterministic-relations
plan: "02"
subsystem: parser-and-web
tags: [latex, flattener, anchors, deterministic-relations, web]
requires:
  - phase: 02-canonical-objects-deterministic-relations
    provides: Expanded canonical contract for nodes, edges, serializer, and schema
provides:
  - Original-file source anchors from the LaTeX flattener into parsed nodes
  - First-class section, proof, equation, and citation objects with deterministic explicit and structural edges
  - Dashboard compatibility for the richer canonical graph
affects: [02-03, packages/core/src/graph/knowledge-graph.ts, packages/cli/test/serve-app.test.ts]
tech-stack:
  added: []
  patterns:
    - Line-map propagation from flattener to parser for stable source anchors
    - Structural section/proof relations stored in the canonical graph rather than synthesized in UI code
key-files:
  created: [packages/core/test/fixtures/latex/canonical-objects/main.tex, packages/core/test/gold-paper-canonical-artifact.test.ts]
  modified: [packages/core/src/ingestion/flatten/latex-flattener.ts, packages/core/src/ingestion/parsers/latex-parser.ts, packages/core/src/ingestion/parsers/markdown-parser.ts, packages/core/test/ingestion-pipeline.test.ts, packages/web/src/components/proof-graph-page.tsx, packages/web/test/bundle-data.test.ts, packages/web/test/proof-graph-render.test.ts]
key-decisions:
  - "Assign section labels to first-class section nodes so explicit TeX refs to sections resolve into deterministic edges."
  - "Emit structural contains/proves edges in the parser path instead of reconstructing them from display heuristics."
patterns-established:
  - "Flattened LaTeX keeps a parallel source line map so parser anchors point back to repo paths and original line spans."
  - "Gold-paper acceptance for canonical artifacts is enforced directly at the serialized bundle boundary."
requirements-completed: [OBJ-01, REL-01, REL-02]
duration: 11min
completed: 2026-04-02
---

# Phase 02 Plan 02 Summary

**Populate anchored canonical objects and deterministic relations on the parser path, then keep the web graph consumer compatible**

## Performance

- **Duration:** 11 min
- **Completed:** 2026-04-02
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- Added line-map support to the LaTeX flattener and used it to anchor parsed nodes back to original repo-relative TeX files and line spans.
- Extended the LaTeX parser to emit first-class sections, proofs, equations, citation objects, explicit reference/citation edges, and structural `contains`/`proves` edges.
- Updated the dashboard graph filters so the richer canonical kinds remain explorable without Phase 3 UI redesign.

## Task Commits

1. **Task 1: Populate sections, proofs, equations, citations, anchors, and structural edges on the parser path** - `8ebda4f` (feat)
2. **Task 2: Keep dashboard compatibility consumers working with the richer graph** - `8ebda4f` (feat)

**Plan metadata:** `b132baa` (docs(02): add execution plans)

## Decisions Made

- Used repo-relative source paths in anchors so fixtures and gold-paper output remain deterministic and easy to inspect locally.
- Kept markdown explicit-reference edges provenance-aware too, so the graph contract stays uniform across supported source types.

## Next Phase Readiness

- Query and impact surfaces now had to learn to ignore structural edges by default.
- The gold paper now emitted the full deterministic Phase 2 object and relation layer needed for rerun-stability acceptance.

---
*Phase: 02-canonical-objects-deterministic-relations*
*Completed: 2026-04-02*
