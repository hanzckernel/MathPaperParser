# Phase 05 Context

## Goal

Prove that the approved local-first workflow works end to end on the representative heavy paper `ref/papers/long_nalini/arXiv-2502.12268v2/main.tex` without manual graph editing.

## Starting Point

- Phase 1 hardened deterministic ingestion for the gold paper.
- Phase 2 made the canonical artifact stable, typed, and provenance-aware.
- Phase 3 made deterministic edge explanations inspectable in the local explorer.
- Phase 4 added optional enrichment as a separate `enrichment.json` sidecar plus provenance-gated review in the graph route.
- Manual verification on the built CLI now succeeds for the full gold-paper workflow:
  - `analyze`
  - `enrich`
  - `validate`
  - `export`

## What Is Missing

- ACC-01 is not locked by an end-to-end regression yet.
- There is no single automated harness that proves the full user workflow from TeX input to local exportable artifact on the gold paper.
- Planning state and roadmap still need the final phase completion update once the acceptance harness is green.

## Constraints

- Use the real representative paper, not the reduced fixtures.
- Prove the actual intended user workflow, not only internal parser/library calls.
- Keep the acceptance gate local-first and artifact-based; no hosted deployment or collaboration scope.
- Do not introduce manual repair steps, golden-file editing, or brittle exact-count locks that would block future parser improvements without reason.

## Relevant Files

- `ref/papers/long_nalini/arXiv-2502.12268v2/main.tex`
- `packages/cli/src/index.ts`
- `packages/cli/test/`
- `packages/cli/src/export.ts`
- `packages/web/src/lib/data-source.ts`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `.planning/REQUIREMENTS.md`
