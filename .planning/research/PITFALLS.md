# Pitfalls Research: PaperParser v1.3

**Milestone:** `v1.3 Corpus Search & Parse/Render Hardening`
**Status:** Complete
**Date:** 2026-04-03

## Pitfall 1: Turning corpus search into an opaque merged graph

Risk:
- Cross-paper search becomes less trustworthy if results lose paper attribution or if ranking cannot be inspected.

Prevention:
- Keep every result explicitly tied to `paperId`
- Expose matched field(s) and paper metadata in results
- Reuse existing paper-aware navigation instead of inventing a graph-wide abstraction layer

## Pitfall 2: Letting paper-local and corpus-wide ranking drift arbitrarily

Risk:
- Users will get inconsistent search behavior across CLI/API/web surfaces.

Prevention:
- Share tokenization and scoring helpers where possible
- Add acceptance assertions for ranking quality, not just non-empty results

## Pitfall 3: Treating render fallback as a parser substitute

Risk:
- Browser normalization grows into an implicit parser layer, making unsupported content look more understood than it is.

Prevention:
- Keep parser hardening and render normalization separate
- Preserve explicit diagnostics for unsupported parse cases
- Use render fallback as a local UI boundary, not as canonical recovery logic

## Pitfall 4: Over-promising MathJax compatibility

Risk:
- MathJax does not implement full LaTeX and does not support every package, so broad compatibility promises will fail.

Prevention:
- Normalize only the targeted fragment classes you can test
- Add explicit fixture coverage for each newly supported class
- Keep unsupported macros/environments visible through fallback or diagnostics

Official reference:
- [MathJax TeX support](https://docs.mathjax.org/en/stable/input/tex/)

## Pitfall 5: Adding a search dependency before proving the current need

Risk:
- A new search library adds integration complexity, index-format questions, and ranking drift before the milestone proves it is necessary.

Prevention:
- Start with a core-service implementation on the current architecture
- Treat Lunr or FlexSearch as fallback stack decisions if ranking/scale evidence forces them

## Pitfall 6: Using synthetic tests as the only proof

Risk:
- Corpus-search relevance and parser/render improvements can look good on fixtures but fail on real papers.

Prevention:
- Keep the accepted corpus in the acceptance proof
- Add a small number of targeted hard-case fixtures alongside the real-corpus run

## Summary

The biggest failure mode is not technical impossibility. It is boundary drift:
- corpus search drifting into opaque cross-paper semantics
- parser hardening drifting into UI-only normalization
- render hardening drifting into silent pseudo-support
