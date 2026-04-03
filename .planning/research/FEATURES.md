# Feature Research: PaperParser v1.3

**Milestone:** `v1.3 Corpus Search & Parse/Render Hardening`
**Status:** Complete
**Date:** 2026-04-03

## Category: Corpus Search

### Table stakes

- Search across all stored papers, not only one selected paper
- Return paper-aware result metadata: `paperId`, title, source type, node id, node kind, section title
- Keep direct navigation into the existing explorer/detail flow
- Make ranking understandable enough that a mathematician can see why a result surfaced

### Differentiators

- Result grouping by paper or paper-first facets
- Match reasons such as matched field (`label`, `latexLabel`, `statement`, `sectionTitle`)
- Search modes or filters that stay faithful to math use: theorem-like only, exact label, section/title bias

### Anti-features for this milestone

- Opaque merged-corpus search with no paper attribution
- Embedding-heavy semantic search as the default ranking path
- Hosted/shared search infrastructure

## Category: Parser Hardening

### Table stakes

- Reduce recurring unresolved-reference diagnostics on the accepted corpus
- Add explicit regression fixtures for the next unresolved-pattern classes instead of only broad corpus assertions
- Preserve explicit diagnostics when a pattern is still unsupported

### Differentiators

- Better extraction around the theorem/equation boundary cases already hinted by residual warnings
- Broader support for reference-command variants only when they can be kept deterministic
- Better statement shaping where parser output feeds rendering quality

### Anti-features for this milestone

- Broad "handles arbitrary TeX" claims
- Schema churn that widens the canonical artifact without strong evidence

## Category: Render Hardening

### Table stakes

- Fewer `MathTextBlock` fallbacks on accepted and targeted hard-case fixtures
- Better handling of environments and macros already partially normalized today
- More explicit render diagnostics so unsupported content is inspectable

### Differentiators

- Better width/overflow handling for long expressions using MathJax 4 line-breaking options where safe
- Safer normalization for structured display math and theorem wrappers without mutating the canonical source text

### Anti-features for this milestone

- Renderer replacement
- Silent coercion that hides unsupported fragments as if they were correctly understood

## Research Takeaway

The natural scope split is:
1. Corpus-wide search as a new read model
2. Parser hardening on the residual deterministic gap classes
3. Render hardening on top of improved extracted fragments plus expanded normalization
