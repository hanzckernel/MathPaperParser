# Architecture Research: PaperParser v1.3

**Milestone:** `v1.3 Corpus Search & Parse/Render Hardening`
**Status:** Complete
**Date:** 2026-04-03

## Existing Architecture to Reuse

- Per-paper search lives in `packages/core/src/services/bundle-query-service.ts`
- Cross-paper related matching lives in `packages/core/src/services/corpus-query-service.ts`
- CLI query and related commands are wired in `packages/cli/src/index.ts`
- Web math rendering normalization lives in `packages/web/src/lib/math-render.tsx`
- Parser diagnostics and residual warnings are surfaced through `diagnostics.json`

## Recommended Integration Shape

### 1. Corpus search as a new service, not a replacement

Add:
- `packages/core/src/services/corpus-search-service.ts`

Inputs:
- `listStoredPapers()` metadata
- per-paper bundles from store

Outputs:
- corpus search result objects with:
  - `paperId`
  - paper title/source type
  - node id/kind/label/number
  - section metadata
  - matched field(s)
  - score
  - excerpt

Why:
- This keeps corpus search parallel to, not tangled with, `related`
- It preserves the paper-local canonical bundle contract

### 2. Shared ranking primitives

Current issue:
- `runKeywordSearch()` and `CorpusQueryService` currently use different heuristics

Recommended direction:
- Extract shared tokenization and field-weight logic into a shared search helper module
- Let corpus search add paper-level metadata and result grouping on top

### 3. API and CLI boundaries

Recommended additions:
- CLI command: `paperparser corpus-search <query>`
- API route: `GET /api/corpus/query?q=...`

Do not:
- overload the current single-paper `/api/papers/:paperId/query`
- infer corpus mode from missing `paper`

### 4. Web/UI boundary

Recommended direction:
- Add a corpus-search surface that links back into the existing paper-aware explorer flow
- Reuse current route/navigation patterns rather than inventing a disconnected global search page

### 5. Parser/render hardening boundary

Parser hardening belongs in:
- `packages/core/src/ingestion/parsers/latex-parser.ts`
- related regression fixtures/tests

Render hardening belongs in:
- `packages/web/src/lib/math-render.tsx`

Important boundary:
- Parser should improve extracted text fidelity and explicit diagnostics
- Renderer should normalize browser-facing fragments
- Do not silently rely on render-time rescue to cover parser ambiguity

## Suggested Build Order

1. Add targeted regression fixtures for residual parser/render failures
2. Build corpus-search core service and types
3. Wire CLI/API corpus-search interfaces
4. Add web corpus-search UI/navigation
5. Expand parser hardening on the residual failure classes
6. Expand render normalization and MathJax overflow handling
7. Prove everything on the accepted corpus plus targeted hard-case fixtures

## Sources

- Local code:
  - `packages/core/src/services/bundle-query-service.ts`
  - `packages/core/src/services/corpus-query-service.ts`
  - `packages/core/src/search/keyword-search.ts`
  - `packages/cli/src/index.ts`
  - `packages/web/src/lib/math-render.tsx`
