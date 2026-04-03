# Phase 14: Residual TeX Parser Hardening - Research

**Generated:** 2026-04-03
**Status:** Ready for planning

## Research Question

What is the smallest deterministic parser change that lowers the current `v1.2` residual warning budget on the accepted corpus without adding figure-schema work or pretending unsupported cleveref behavior is fully solved?

## Current Baseline

The current parser still leaves a bounded residual on `long_nalini`:

- `22` `unresolved_reference`
- `2` `unsupported_reference_command`

The residual set is not arbitrary. A direct parse of the current bundle path shows four concrete classes:

1. figure references such as `fig:cop`, `fig:3geod`, and `fig:Bnew`
2. multiline heading labels such as `s:coord`
3. secondary labels on already-supported targets such as `lem:df`
4. secondary equation labels inside aligned blocks such as `e:hexagon`, `e:LK_2_mult_var`, `e:LK_3_mult_var`, and their proof variants

The two current unsupported cleveref diagnostics are:

- `\cref{fig:jacobian_1}` — still points to a figure target that this phase will not model
- `\cref{rem:remove_int_eight}` — points to an already-known deterministic remark target

## Findings

### 1. The biggest non-figure misses come from labels the parser already partially understands

The source contains the currently missed labels:

- `s:coord` on a multiline `\subsection{...}` declaration
- `lem:df` as a second label inside `\begin{lem} ...`
- `e:hexagon` as a second label inside an `align` block
- `e:LK_*` proof labels on separate lines inside an aligned display

This means Phase 14 does not need new product concepts. It needs more complete label registration on already-supported nodes.

### 2. Multiline headings are currently a parser seam

The heading parser works line-by-line. A heading like:

```tex
\subsection{Coordinates ... 
  space}\label{s:coord}
```

does not appear on a single scanned line, so no heading event or heading label is emitted.

That is a deterministic parser gap, not a schema gap.

### 3. Node extraction currently keeps only the first label per target

`registerEnvironmentNode()` extracts:

- the first `\label{...}` as `latexLabel`
- reference metadata from the same block

But it does not preserve secondary labels on the same extracted target. This explains:

- `lem:df` on the same lemma as `c:double_fills`
- several `e:...` aliases inside one aligned display

The clean fix is to keep one canonical `latexLabel` for node identity while registering all labels as resolvable aliases to the same node ID.

### 4. Bounded cleveref support is feasible without broad package emulation

The parser already tokenizes `\cref` / `\Cref` separately. A bounded Phase 14 slice can:

- resolve `\cref` / `\Cref` when the label already maps to a known deterministic node
- keep unsupported or out-of-scope cases explicit

That satisfies the approved direction:

- support the command where the parser already knows the target
- do not guess through figure targets or broader cleveref-specific syntax

### 5. Duplicate labels are a trust problem, not just a convenience issue

The accepted corpus contains at least one duplicate label (`eq:add_euler_realization` appears twice).

Today the parser would silently overwrite earlier `labelToNodeId` entries. That weakens deterministic trust because refs can flip to the last-seen target with no explicit signal.

The approved Phase 14 policy is:

- first definition wins
- emit a warning

That fits the current trust model better than silent overwrite.

### 6. Figure references should stay explicit in this phase

Figure labels are still a major slice of the residual unresolved set, but they require either:

- a new first-class `figure` node kind, or
- an internal figure-target layer with public-contract implications

That is larger than the approved Phase 14 boundary. The measured non-figure misses are enough to materially beat the current unresolved baseline without reopening schema work.

## Framework Discovery Outcome

1. Existing codebase solution exists: `packages/core/src/ingestion/parsers/latex-parser.ts` is the right place to solve this.
2. Existing dependencies are sufficient: no new parsing library is needed.
3. No external library is justified: the remaining misses come from bounded parser seams, not from a missing TeX AST dependency.

Decision: extend the in-house parser with alias-aware label registration, multiline heading support, bounded cleveref resolution, and explicit duplicate-label diagnostics.

## Recommended Phase 14 Slice

1. Add fixture-level regressions for:
   - multiline subsection labels
   - multiple labels on one theorem/equation target
   - bounded `\cref` / `\Cref` support to known targets
   - duplicate-label warning semantics
2. Refactor label registration so one node can own:
   - one canonical `latexLabel`
   - multiple resolvable label aliases
3. Preserve first-definition-wins semantics with an explicit duplicate-label warning.
4. Re-measure `long_nalini` and lock the lower warning budget in both core and CLI acceptance tests.

## Risks

- Touching label registration can change reference resolution globally, so tests must lock both fixture behavior and real-corpus warning counts.
- Solving duplicate labels incorrectly could destabilize node identity or silently flip references.
- Overreaching on cleveref could accidentally imply broader package support than the browser/parser actually has.

## Suggested Acceptance Criteria

- `long_nalini` emits fewer than `22` unresolved references after deterministic parsing.
- `\cref` / `\Cref` resolve when they target already-known deterministic nodes.
- Duplicate labels emit an explicit warning and keep the first-defined target.
- Figure references remain explicit residual diagnostics rather than becoming hidden failures.
- Schema validation, consistency checks, and CLI acceptance remain green.

## Likely File Touch Points

- `packages/core/src/ingestion/parsers/latex-parser.ts`
- `packages/core/src/types/pipeline.ts`
- `packages/core/test/fixtures/latex/gold-paper-regressions/`
- `packages/core/test/ingestion-pipeline.test.ts`
- `packages/core/test/gold-paper-ingestion.test.ts`
- `packages/cli/test/gold-paper-acceptance.test.ts`
