# Phase 15: Math Fragment Render Hardening - Research

**Generated:** 2026-04-03
**Status:** Ready for planning

## Research Question

What is the smallest render-boundary expansion that materially lowers the current accepted-corpus raw-source fallback rate without mutating canonical bundle text or pretending MathJax supports broad LaTeX package behavior in the browser?

## Current Baseline

The current `prepareMathStatementText()` helper in `packages/web/src/lib/math-render.tsx` only normalizes:

- theorem-style wrappers
- a bounded display-environment list (`equation`, `align`, `gather`, `split`, `multline`)
- `\ref`, `\eqref`, and `\cite`

After that pass, any remaining `\begin{...}` / `\end{...}` pair causes an explicit fallback block.

An accepted-corpus scan of `.paperparser-data/long-nalini-baseline/graph.json` shows the next recurring render classes:

- `41` `itemize`
- `11` `cases`
- `6` `enumerate`
- `3` `split`
- `3` `pmatrix`
- `2` `figure`
- `1` `proof`

The same scan also shows frequent wrapper or readability commands inside otherwise renderable statements:

- `83` `\emph`
- `41` `\mathrm`
- `40` `\quad`
- `20` `\text`
- `17` `\textbf`
- `13` `\qquad`
- `10` `\overline`
- `3` `\mbox`

Not all of those commands currently trigger fallback, but they are the next bounded class where project-owned normalization can improve readability without adding browser-side package rescue behavior.

## Findings

### 1. List environments are the biggest accepted-corpus fallback driver

Representative statements in `long_nalini` embed `\begin{itemize}` or `\begin{enumerate}` directly inside theorem-like text. The current helper sees those residual environments and drops the whole statement into raw-source fallback, even though the underlying content is readable as plain prose once the list markers are flattened.

This is the highest-leverage accepted-corpus-first target.

### 2. A smaller display-like tier can be salvaged without broad package emulation

The accepted corpus still contains bounded display-like sub-environments such as:

- `cases`
- `pmatrix`
- `split`

These are not arbitrary package features; they are structured layout forms that can be normalized into simpler display-safe fragments or flattened rows when the shape is clear enough. This fits the approved `2B` decision to prefer aggressive salvage over conservative fallback.

### 3. Wrapper and spacing commands are common enough to justify bounded rewrites

Commands such as `\emph`, `\textbf`, `\text`, `\mathrm`, `\mbox`, `\quad`, and `\qquad` occur frequently in otherwise understandable statements. A bounded normalization pass can:

- strip textual wrappers to their readable contents
- collapse spacing commands into plain spaces
- keep the rendered fragment honest without claiming full LaTeX compatibility

This matches the approved `3A` direction.

### 4. Some parser-produced statement edges still need local cleanup at render time

Representative accepted-corpus statements begin with harmless wrapper residue such as leading `}` or short prefix noise before the real statement text. That is not a reason to mutate canonical bundle text, but it is a defensible render-time cleanup target because the render helper already owns bounded statement shaping.

### 5. Figure and proof environments should remain explicit fallbacks

The accepted corpus still contains a small number of `figure` and `proof` environments inside statement text. Those are not good candidates for render-only salvage in this phase:

- `figure` implies non-math asset/layout semantics
- `proof` implies richer textual structure than a bounded math fragment rewrite

They should stay explicit fallback paths.

## Framework Discovery Outcome

1. The right extension point already exists: `packages/web/src/lib/math-render.tsx`.
2. The existing direct regression boundary already exists: `packages/web/test/math-render.test.ts`.
3. No renderer swap or new package is justified. The remaining gaps are normalization and fallback-shaping seams inside the current MathJax boundary.

Decision: keep MathJax, extend the project-owned normalization pipeline, and prove the new behavior with accepted-corpus-first helper regressions plus existing surface tests.

## Recommended Phase 15 Slice

1. Add failing regressions for:
   - list-environment flattening (`itemize`, `enumerate`)
   - bounded wrapper/spacing normalization
   - one adjacent display-salvage class (`cases`, `pmatrix`, or similar)
   - still-explicit fallback for `figure` / other out-of-scope environments
2. Refactor `prepareMathStatementText()` into an ordered normalization pipeline that:
   - strips readable wrappers
   - flattens list content to prose-safe text
   - rewrites bounded display-like fragments into `$$ ... $$` where the structure is still honest
   - keeps unsupported environments visible through fallback
3. Re-prove the shared statement surfaces and workspace type safety after the normalization expansion.

## Risks

- Aggressive salvage can over-normalize a fragment and make it look more semantically certain than it is, so explicit fallback must remain the exit path for unclear structures.
- Rewriting mixed prose-plus-math lists incorrectly could damage readability more than the current raw-source fallback.
- Broad command stripping could silently remove meaning if the rewrite set expands beyond simple textual wrappers and spacing helpers.

## Suggested Acceptance Criteria

- More accepted-corpus representative statements typeset instead of falling back.
- `itemize` / `enumerate` no longer force raw-source fallback when their content can be flattened honestly.
- The next bounded display-like fragment class is normalized into a render-safe shape without adding browser-side package emulation.
- `figure` and similarly out-of-scope environments still fall back explicitly.
- Shared statement-surface wiring and typecheck remain green.

## Likely File Touch Points

- `packages/web/src/lib/math-render.tsx`
- `packages/web/test/math-render.test.ts`
- `packages/web/test/proof-graph-render.test.ts`
