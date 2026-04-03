# Phase 7: TeX Hardening & Diagnostic Reduction - Research

**Generated:** 2026-04-03
**Status:** Ready for planning

## Research Question

What is the smallest deterministic parser change that materially lowers unresolved-reference noise across the accepted `v1.1` corpus without pretending unsupported constructs are resolved?

## Current Baseline

The built parser confirms three facts:

1. The unresolved labels are present in the flattened TeX source.
2. The misses cluster around a few repeated patterns, not arbitrary syntax.
3. The current parser architecture is the limiting factor more than the fixture set.

Measured baseline:

- `long_nalini`: `121` unresolved references, `2` unsupported `\cref` / `\Cref`
- `medium_Mueller.flat.tex`: `16` unresolved references
- `short_Petri.tex`: `7` unresolved references plus preserved missing-asset diagnostics

## Findings

### 1. Most misses come from supported constructs nested inside other supported constructs

The current parser tracks a single open environment. It captures from `\begin{...}` to `\end{...}` and does not emit nested supported nodes inside that block.

That matters because the milestone corpus places labels inside:

- `align` blocks inside lemmas or proofs
- `equation` blocks inside proofs
- `lemma` blocks inside proofs

Result: labels exist in the source but never become `labelToNodeId` targets.

### 2. Same-line environments are also being skipped

The current parser starts capturing after `\begin{...}` and only checks for the matching `\end{...}` on later lines. A block like:

```tex
\begin{eqnarray}\label{eq:x} ... \end{eqnarray}
```

does not close correctly in the same pass, which contributes directly to `short_Petri`.

### 3. The phase needs broader equation-environment coverage, not just `equation`

The milestone corpus uses:

- `align`, `align*`
- `multline`, `multline*`
- `eqnarray`, `eqnarray*`

Those are the dominant source of missed labels in `long_nalini` and the entire source of unresolved labels in `medium_Mueller.flat.tex`.

### 4. Labeled subsection headings should resolve even if top-level grouping stays stable

`long_nalini` contains labeled `\subsection` and `\subsubsection` targets that are currently invisible to the graph.

The lowest-churn design is:

- create `section` nodes for subsection and subsubsection headings
- preserve their labels and hierarchical numbers for ref resolution
- keep non-heading nodes grouped by the top-level section for downstream compatibility
- use metadata such as `headingLevel` and richer `headingPath` rather than reworking the whole section clustering model in this phase

### 5. Figure references are a smaller residual slice and can remain explicit if needed

After the equation-like and labeled-heading buckets, the remaining `long_nalini` unresolved references are primarily `fig:*`.

Adding first-class figure nodes would expand the canonical node-kind contract and ripple through stats, validation, rendering, and enrichment heuristics. That is possible, but it is a larger schema decision than Phase 7 needs if the milestone can already show:

- materially fewer unresolved references
- explicit residual diagnostics for unsupported or deferred patterns

Recommendation: do not add figure nodes in Phase 7 unless the parser work unexpectedly leaves a larger residual than measured.

## Framework Discovery Outcome

1. Existing codebase solution exists: the current LaTeX parser and flattener are the right place to harden this behavior.
2. Existing dependencies are sufficient: no new parsing library is needed for the measured corpus slice.
3. No external library is justified: the milestone needs a narrow deterministic fix, not a full TeX AST replacement.

Decision: extend the in-house parser with measured corpus coverage and targeted tests.

## Recommended Phase 7 Slice

1. Add focused regression fixtures that cover:
   - nested supported environments
   - same-line supported environments
   - labeled subsection / subsubsection headings
2. Extend supported equation-like environments beyond `equation`.
3. Refactor the LaTeX parser just enough to emit nested supported nodes and same-line blocks deterministically.
4. Add hierarchical heading extraction for labeled subsection targets while keeping top-level section grouping stable for downstream consumers.
5. Re-measure the three-paper corpus and lock the residual unresolved set as explicit diagnostics.

## Risks

- Touching the parser carelessly can change node IDs, section grouping, and downstream bundle shape more than intended.
- Over-solving Phase 7 by introducing figure nodes would create schema churn across core, CLI, web, and validation.
- Under-solving Phase 7 by only adding env names but not nested/same-line handling would leave the main corpus misses in place.

## Suggested Acceptance Criteria

- `medium_Mueller.flat.tex` has zero unresolved-reference diagnostics after deterministic parsing.
- `short_Petri.tex` has zero unresolved-reference diagnostics while keeping `missing_bibliography` and `missing_graphics` explicit.
- `long_nalini` unresolved references fall materially below the `v1.0` / early `v1.1` baseline and the remaining unresolved labels are the explicitly deferred residual class.
- Full bundle validation and downstream tests remain green.

## Likely File Touch Points

- `packages/core/src/ingestion/parsers/latex-parser.ts`
- `packages/core/test/ingestion-pipeline.test.ts`
- `packages/core/test/gold-paper-ingestion.test.ts`
- `packages/core/test/fixtures/latex/gold-paper-regressions/`
- `packages/cli/test/gold-paper-acceptance.test.ts`
