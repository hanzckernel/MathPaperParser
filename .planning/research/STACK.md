# Stack Research: PaperParser v1.3

**Milestone:** `v1.3 Corpus Search & Parse/Render Hardening`
**Status:** Complete
**Date:** 2026-04-03

## Recommendation

Default recommendation:
- Keep the existing TypeScript monorepo and current query services.
- Add corpus search as a new core service above the existing per-paper `BundleQueryService`.
- Do not add a heavy search dependency by default in this milestone.
- Keep MathJax as the browser renderer and expand normalization/fallback coverage before considering any renderer switch.

## Stack Options

### Search stack

#### Option A: Extend the current in-repo search/index logic (Recommended)

Why it fits this milestone:
- Lowest architectural risk because `BundleQueryService` and `CorpusQueryService` already exist in `packages/core`.
- Keeps ranking explainable and paper-aware.
- Avoids adding a dependency before the true corpus-search needs are proven on the accepted corpus.

Recommended additions:
- A new `CorpusSearchService` in `packages/core/src/services/`
- A corpus-level result type that includes `paperId`, paper metadata, and node metadata
- Shared ranking helpers so paper-local and corpus-wide search do not drift arbitrarily

#### Option B: Evaluate Lunr if ranking quality becomes the main blocker

Useful capabilities from the official Lunr docs:
- BM25 scoring
- field-restricted search
- per-term boosts
- fuzzy matching

Why it is not the default:
- It introduces a second ranking model when the current product already has a custom search model
- The milestone goal is explainable local corpus search, not generic text-search breadth

Official reference:
- [Lunr searching guide](https://lunrjs.com/guides/searching.html)

#### Option C: FlexSearch only if large persistent corpus indexing becomes a hard requirement

Useful capabilities from the official FlexSearch docs/repo:
- multi-field document search
- workers
- persistent indexes
- browser and Node support

Why it is not the default:
- More moving parts than this milestone needs
- Better fit for a later milestone with explicit persistent corpus indexing or larger-scale shared deployment concerns

Official reference:
- [FlexSearch README](https://github.com/nextapps-de/flexsearch?tab=readme-ov-file)

### Math/render stack

Keep:
- `mathjax@4.x`
- local bundled `tex-chtml-nofont`
- normalization in `packages/web/src/lib/math-render.tsx`

Research-backed notes:
- MathJax 4 now supports automatic line breaking, including inline expressions and configurable display overflow behavior.
- MathJax still implements only a subset of TeX/LaTeX, and not all LaTeX packages are available.

Implication:
- The milestone should improve normalization and fragment shaping, not assume browser-side package compatibility will close the remaining gap.

Official references:
- [MathJax line breaking](https://docs.mathjax.org/en/stable/output/linebreaks.html)
- [MathJax TeX support](https://docs.mathjax.org/en/stable/input/tex/)

## Recommended Stack Decision for v1.3

1. Add no new required dependency for corpus search in the first phase.
2. Build corpus search on top of the current core services and node metadata.
3. Keep Lunr as the fallback option if ranking quality cannot be reached quickly with the in-repo scorer.
4. Keep FlexSearch out of scope for `v1.3` unless persistent large-corpus indexing becomes a demonstrated requirement.
5. Keep MathJax and invest in better normalization, diagnostics, and render-safe fragment shaping.

## Sources

- Local code:
  - `packages/core/src/services/bundle-query-service.ts`
  - `packages/core/src/services/corpus-query-service.ts`
  - `packages/core/src/search/keyword-search.ts`
  - `packages/web/src/lib/math-render.tsx`
- External:
  - [MathJax line breaking](https://docs.mathjax.org/en/stable/output/linebreaks.html)
  - [MathJax TeX support](https://docs.mathjax.org/en/stable/input/tex/)
  - [Lunr searching guide](https://lunrjs.com/guides/searching.html)
  - [FlexSearch README](https://github.com/nextapps-de/flexsearch?tab=readme-ov-file)
