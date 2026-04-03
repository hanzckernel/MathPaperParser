# Research Summary: PaperParser v1.3

**Milestone:** `v1.3 Corpus Search & Parse/Render Hardening`
**Status:** Complete
**Date:** 2026-04-03

## Stack additions

Recommended:
- No required new dependency for the first corpus-search phase
- New core service for corpus-wide search built on current bundle/store surfaces
- Keep MathJax 4 and improve normalization/fallback coverage instead of swapping renderers

Conditional fallback options:
- Lunr if BM25, field boosts, or fuzzy search become necessary quickly
- FlexSearch only if persistent larger-corpus indexing becomes a real requirement

## Feature table stakes

- Corpus-wide search across stored papers
- Paper-aware results with direct navigation into existing explorer/detail flows
- Parser hardening for the residual deterministic warning classes
- Render hardening that reduces fallback frequency on accepted and targeted hard-case fixtures
- Acceptance proof on the accepted corpus plus targeted regression fixtures

## Watch out for

- Do not collapse paper boundaries in the name of global search
- Do not let render normalization become the hidden parser
- Do not promise full LaTeX compatibility just because MathJax can render a subset
- Do not judge corpus search by non-empty results alone; require ranking-quality assertions

## Recommended planning shape

Natural phase split:
1. Corpus-wide search read model and interfaces
2. Parser hardening for residual TeX gap classes
3. Render hardening and acceptance proof expansion

## Best next step for requirements

Define requirement categories as:
- Corpus Search
- Parser Hardening
- Render Hardening
- Reliability / Acceptance

## Sources

- Local code:
  - `packages/core/src/services/bundle-query-service.ts`
  - `packages/core/src/services/corpus-query-service.ts`
  - `packages/core/src/search/keyword-search.ts`
  - `packages/web/src/lib/math-render.tsx`
  - `packages/cli/src/index.ts`
- External:
  - [MathJax line breaking](https://docs.mathjax.org/en/stable/output/linebreaks.html)
  - [MathJax TeX support](https://docs.mathjax.org/en/stable/input/tex/)
  - [Lunr searching guide](https://lunrjs.com/guides/searching.html)
  - [FlexSearch README](https://github.com/nextapps-de/flexsearch?tab=readme-ov-file)
