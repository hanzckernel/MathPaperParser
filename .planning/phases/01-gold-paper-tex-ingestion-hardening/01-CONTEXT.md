# Phase 1: Gold-Paper TeX Ingestion Hardening - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase hardens TeX ingestion against the selected gold paper at `ref/papers/long_nalini/arXiv-2502.12268v2/main.tex`. The deliverable is a reliable parse path for the real multi-file TeX project through the existing local-first pipeline, with explicit diagnostics and no dependency on PDF input. This phase is about getting the representative paper through ingestion trustworthily; it is not yet the phase for canonical graph redesign, semantic dependency inference, or explorer work.

</domain>

<decisions>
## Implementation Decisions

### Gold Paper Contract
- Use `ref/papers/long_nalini/arXiv-2502.12268v2/main.tex` as the representative heavy-paper entrypoint for Phase 1 and the milestone acceptance flow.
- Treat the real multi-file source tree as canonical for this phase; do not downgrade acceptance to the already-flattened `main.flat.tex`.
- Keep the user-facing acceptance harness anchored to the existing local analyze flow, so success means the repo can ingest the chosen TeX project through the current product surface rather than through an ad hoc helper script alone.
- Assume local fixture assets already present in `ref/papers/long_nalini/arXiv-2502.12268v2/` are part of the supported input for this phase.

### Hardening Strategy
- Start from the existing `createDocumentInput` -> `analyzeDocumentPath` -> `flattenLatex` -> `parseLatexDocument` path and patch the real failure modes revealed by `long_nalini` before reaching for architectural replacement.
- Prefer the smallest code change that makes the gold paper ingest reliably; only escalate to a deeper parser rewrite inside Phase 1 if the actual paper failures show the current regex-first path cannot satisfy the phase goal.
- Keep the current `manifest` / `graph` / `index` contract intact in this phase unless a gold-paper ingestion bug makes a narrowly scoped schema adjustment unavoidable.
- Keep Phase 1 scoped to ingestion reliability and diagnostics. Typed object richness, deterministic relation provenance, and explorer behavior belong to later phases unless a Phase 1 fix is a direct prerequisite.

### Diagnostics and Regression Gate
- Missing optional graphics or bibliography files may remain explicit warnings if the parse can still produce a usable artifact.
- Missing required TeX inputs, unreadable source files, or other issues that prevent trustworthy ingestion must surface as explicit actionable diagnostics, not silent degradation.
- Gold-paper ingestion behavior must be regression-tested at the core ingestion boundary, with failing tests written around discovered issues before fixes where practical.
- The output and diagnostics for repeated deterministic runs on the same gold paper should be stable enough to support the later canonical-artifact guarantees.

### the agent's Discretion
- The agent may introduce reduced regression fixtures derived from `long_nalini` if the full paper is too large for targeted edge-case tests, as long as the real paper remains the acceptance target.
- The agent may add narrowly scoped normalization or preprocessing helpers inside `packages/core/src/ingestion/` if they directly serve gold-paper ingestion and preserve the local-first CLI/API flow.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/core/src/ingestion/pipeline.ts` already resolves `.tex`, `.gz`, and directory inputs and routes LaTeX inputs through `parseLatexDocument`.
- `packages/core/src/ingestion/flatten/latex-flattener.ts` already supports recursive `\input` / `\include` inlining, `.gz` inputs, directory inputs rooted at `main.tex`, and missing bibliography / graphics diagnostics.
- `packages/core/src/ingestion/parsers/latex-parser.ts` already extracts section headings, theorem-like environments, labels, refs, and citations into the existing bundle model.
- `packages/core/test/latex-flattener.test.ts` and `packages/core/test/ingestion-pipeline.test.ts` already provide the starting test patterns for ingestion regressions.

### Established Patterns
- Core ingestion is synchronous and file-system local; stay within that model unless the gold-paper failures prove it insufficient.
- Diagnostics are explicit structured warnings in the pipeline result rather than log-only output.
- Schema and consistency validation are already part of the expected ingestion quality bar via `SchemaValidator` and `ConsistencyChecker`.
- Tests are written with Vitest in `packages/core/test/` and validate behavior at the public ingestion boundary rather than private helpers.

### Integration Points
- Core phase work should concentrate in `packages/core/src/ingestion/pipeline.ts`, `packages/core/src/ingestion/flatten/latex-flattener.ts`, and `packages/core/src/ingestion/parsers/latex-parser.ts`.
- The existing local CLI surface in `packages/cli/src/index.ts` is the acceptance path for end-to-end paper analysis.
- Gold-paper source material lives in `ref/papers/long_nalini/arXiv-2502.12268v2/`, while current small reproducible fixtures live in `packages/core/test/fixtures/latex/project/`.

</code_context>

<specifics>
## Specific Ideas

- The chosen gold paper is a real multi-file `amsart` project with heavy macro use through `def1.tex`, many section includes, figures, bibliography usage, and cross-references. That makes it a better Phase 1 contract than a flattened single-file TeX sample.
- Success for this phase should include a deterministic way to run ingestion on the gold paper from the repo root and inspect whether parsing succeeded or failed with actionable diagnostics.
- If the current flattener’s root-based path resolution causes real issues on this paper, fix those behaviors in Phase 1 rather than tolerating them for later.

</specifics>

<deferred>
## Deferred Ideas

- Replacing the parser wholesale with an AST-first architecture is deferred unless gold-paper failures prove it necessary inside this phase.
- Canonical object identity, deterministic relation provenance, and stable rerun guarantees beyond ingestion are deferred to Phase 2.
- Local explorer behavior is deferred to Phase 3.
- Optional agent enrichment is deferred to Phase 4.

</deferred>
