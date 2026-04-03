# Phase 09 Context

## Goal

Prove the accepted local workflow on the full `v1.1` corpus: `long_nalini`, `medium_Mueller.flat.tex`, and `short_Petri.tex`.

## Starting Point

- Phases 6-8 are complete.
- The local surfaces now support:
  - paper-local search
  - hardened deterministic parsing on the accepted corpus
  - local corpus listing and switching
  - explainable cross-paper navigation through CLI, API, MCP, and dashboard API mode
- Existing acceptance coverage is still centered on the old `v1.0` proof point:
  - `packages/cli/test/gold-paper-acceptance.test.ts` proves `analyze -> enrich -> validate -> export` on `long_nalini`

## What Is Missing

- ACC-01 is only partially met:
  - `long_nalini` is covered for `analyze -> enrich -> validate -> export`, but not yet for the current milestone's explicit `search -> inspect` workflow
- ACC-02 is not met:
  - there is no end-to-end proof that the same local workflow succeeds when all three papers coexist in one store
- ACC-03 is only partially met:
  - the repo has strong phase-local tests, but there is not yet one acceptance gate that ties together:
    - search
    - parser hardening
    - corpus listing/switching
    - cross-paper inspection

## Real-Corpus Probe

- Stable real-paper search queries already exist:
  - `long_nalini`: `hyperbolic`
  - `medium_Mueller.flat.tex`: `torsion`
  - `short_Petri.tex`: `Cheeger constant`
- Real-corpus related-across-corpus results now exist, but the current matcher still exposes some weak evidence terms such as:
  - TeX-ish tokens like `cdot`
  - over-generic words like `trivial`
  - singularization artifacts such as `genu`
- That means Phase 9 may need a small final matcher-hardening pass so the acceptance proof relies on explainable evidence that actually looks reasonable to a mathematician.

## Constraints

- Do not broaden scope beyond the milestone proof gate.
- Prefer acceptance tests and narrow matcher cleanup over new product surfaces.
- Keep the canonical graph schema unchanged.
- Acceptance must run without manual graph editing or paper-specific repair steps.
- Preserve the local-first workflow: the proof should use the shipped CLI/API behavior against the local store.

## Relevant Files

- `packages/cli/test/gold-paper-acceptance.test.ts`
- `packages/cli/test/read-commands.test.ts`
- `packages/cli/test/serve-app.test.ts`
- `packages/core/src/services/corpus-query-service.ts`
- `packages/core/test/gold-paper-ingestion.test.ts`
- `packages/core/test/corpus-query-service.test.ts`
- `ref/papers/long_nalini/arXiv-2502.12268v2/main.tex`
- `ref/papers/medium_Mueller.flat.tex`
- `ref/papers/short_Petri.tex`
