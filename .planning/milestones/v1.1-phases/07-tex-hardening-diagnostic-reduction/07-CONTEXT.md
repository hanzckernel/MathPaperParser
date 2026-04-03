# Phase 07 Context

## Goal

Reduce real-corpus unresolved-reference noise by hardening deterministic LaTeX parsing around the concrete patterns found in `long_nalini`, `medium_Mueller.flat.tex`, and `short_Petri.tex`.

## Starting Point

- Phase 6 is complete; `v1.1` now moves to parser hardening.
- The current deterministic parser lives in `packages/core/src/ingestion/parsers/latex-parser.ts`.
- The current baseline on the built parser is:
  - `ref/papers/long_nalini/arXiv-2502.12268v2/main.tex`: `416` nodes, `617` edges, `121` `unresolved_reference`, `2` `unsupported_reference_command`
  - `ref/papers/medium_Mueller.flat.tex`: `185` nodes, `206` edges, `16` `unresolved_reference`
  - `ref/papers/short_Petri.tex`: `16` nodes, `27` edges, `7` `unresolved_reference`, `1` `missing_bibliography`, `4` `missing_graphics`
- All unresolved labels sampled from the milestone corpus exist in the flattened TeX source. The current misses are parser coverage gaps, not missing source targets.

## What Is Missing

- HARD-01 is not met:
  - `long_nalini` still emits `121` unresolved references, most of them on labels that exist in the source
- HARD-02 and HARD-03 are only partially met:
  - `medium_Mueller.flat.tex` and `short_Petri.tex` analyze without crashing, but they still miss deterministic targets that should be recognized
  - the parser only recognizes `\section`, `proof`, `equation`, `equation*`, and theorem-like environments
  - the parser does not resolve common corpus patterns such as `align`, `align*`, `multline`, `multline*`, `eqnarray`, labeled `\subsection` / `\subsubsection`, and supported environments nested inside proofs or theorem bodies
  - the parser also fails when supported environments open and close on the same line
- HARD-04 is only partially met:
  - unsupported `\cref` / `\Cref` already remain explicit, but the current unresolved-reference volume hides which gaps are truly unsupported versus simply unparsed

## Measured Diagnostic Split

- `long_nalini`
  - `85` unresolved warnings are equation-like labels
  - `17` unresolved warnings are labeled sections / subsections / subsubsections
  - `17` unresolved warnings are figure labels
- `medium_Mueller.flat.tex`
  - all `16` unresolved warnings are equation-like labels
- `short_Petri.tex`
  - `6` unresolved warnings are equation-like labels
  - `1` unresolved warning is a lemma label nested inside a proof

## Constraints

- Keep the parser deterministic. Do not use the enrichment layer to hide deterministic parser gaps.
- Preserve explicit diagnostics for genuinely unsupported or out-of-scope patterns such as `\cref`, missing graphics, and missing bibliography files.
- Prefer a narrow parser hardening slice that covers the measured corpus patterns instead of a general LaTeX rewrite.
- Avoid schema churn unless the remaining gaps justify it. In particular, figure references may remain explicit if the clean fix would expand the canonical node contract beyond this phase.

## Relevant Files

- `packages/core/src/ingestion/parsers/latex-parser.ts`
- `packages/core/src/ingestion/flatten/latex-flattener.ts`
- `packages/core/test/ingestion-pipeline.test.ts`
- `packages/core/test/gold-paper-ingestion.test.ts`
- `packages/cli/test/gold-paper-acceptance.test.ts`
- `ref/papers/long_nalini/arXiv-2502.12268v2/main.tex`
- `ref/papers/medium_Mueller.flat.tex`
- `ref/papers/short_Petri.tex`
