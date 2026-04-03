# Phase 14: Residual TeX Parser Hardening - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Reduce the remaining deterministic parser gaps that still surface as unresolved-reference diagnostics or incomplete extraction on the accepted corpus. This phase improves source parsing itself, not dashboard rendering, corpus-wide search, or broad schema expansion beyond what is necessary to keep the accepted parser contract trustworthy.

</domain>

<decisions>
## Implementation Decisions

### Residual Target Scope
- **D-01:** Phase 14 should not add figure-target extraction or a new `figure` node kind. Figure references may remain an explicit residual class in this phase.
- **D-02:** Success for this phase comes from reducing other deterministic parser gaps and making any remaining unsupported cases clearer, not from forcing `fig:*` references into the canonical graph.

### Package-Specific Reference Commands
- **D-03:** Phase 14 should broaden support beyond raw `\ref` / `\eqref` and attempt bounded deterministic support for `\cref` / `\Cref`.
- **D-04:** `\cref` / `\Cref` support should stay tied to already-known deterministic targets; unsupported cleveref forms must remain explicit instead of being guessed.

### Duplicate Label Policy
- **D-05:** If the TeX source defines the same `\label{...}` more than once, the parser should resolve deterministically to the first definition and emit an explicit warning.
- **D-06:** Duplicate labels should not silently replace earlier targets and should not stop the analysis workflow unless they break a stronger invariant elsewhere.

### Hardening Scope
- **D-07:** Phase 14 should optimize for the accepted-corpus residuals first, plus targeted fixtures that directly represent those residual classes.
- **D-08:** The phase may absorb one adjacent deterministic pattern class if it falls out naturally from the same parser work, but it should not turn into a broad LaTeX parser rewrite.

### the agent's Discretion
- The exact residual pattern classes to target first, as long as they fit the accepted-corpus-first scope.
- The exact warning code and metadata shape for duplicate-label diagnostics.
- The exact fixture split between real-corpus assertions and targeted regression fixtures.

</decisions>

<specifics>
## Specific Ideas

- Duplicate-label ambiguity here means the source defines the same label twice, for example two theorem or equation targets sharing one `\label{...}`.
- Phase 14 may improve `\cref` / `\Cref` handling, but only where the parser can still point to a known deterministic canonical target.
- Figure references do not need to become first-class navigable objects in this milestone slice.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and phase scope
- `.planning/PROJECT.md` — Active `v1.3` scope, parser/render trust constraints, and the decision to defer corpus-wide search.
- `.planning/REQUIREMENTS.md` — `HARD-06`, `HARD-07`, and `HARD-08` acceptance criteria for parser hardening.
- `.planning/ROADMAP.md` — Phase 14 goal, dependency order, and success criteria.
- `.planning/STATE.md` — Current milestone state and the expectation that Phase 14 is the active next step.

### Prior parser-hardening baseline
- `.planning/milestones/v1.1-phases/07-tex-hardening-diagnostic-reduction/07-CONTEXT.md` — Prior measured residual split and the earlier decision to leave figure references explicit.
- `.planning/milestones/v1.1-phases/07-tex-hardening-diagnostic-reduction/07-01-SUMMARY.md` — What Phase 7 actually shipped, including the post-phase residual budgets.

### Current milestone research
- `.planning/research/ARCHITECTURE.md` — Current parser/render architecture guidance for targeted regression-driven hardening.
- `.planning/research/FEATURES.md` — User-facing hardening goals and the recommendation to add explicit regression fixtures for residual classes.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/core/src/ingestion/parsers/latex-parser.ts`: Owns the deterministic LaTeX extraction path, current label/reference matching, and warning emission.
- `packages/core/test/ingestion-pipeline.test.ts`: Best fixture-level boundary for new residual parser regressions such as duplicate labels or bounded `\cref` / `\Cref` support.
- `packages/core/test/gold-paper-ingestion.test.ts`: Current accepted-corpus guardrail that locks residual-warning budgets and bundle validity.
- `packages/cli/test/gold-paper-acceptance.test.ts`: End-to-end local workflow proof that reads stored diagnostics and catches contract regressions outside `packages/core`.

### Established Patterns
- Parser hardening is tracked with explicit real-corpus warning budgets plus targeted fixture tests, not with broad “supports LaTeX” claims.
- Unsupported cases stay visible through diagnostics instead of being hidden behind enrichment or silent fallback.
- The canonical bundle contract is validated through `SchemaValidator` and `ConsistencyChecker` in parser-facing tests, so parser work must preserve those checks.

### Integration Points
- `packages/core/src/ingestion/parsers/latex-parser.ts` for label extraction, reference resolution, and warning emission.
- `packages/core/src/types/pipeline.ts` if Phase 14 adds a duplicate-label warning code or metadata shape.
- `packages/core/test/ingestion-pipeline.test.ts`, `packages/core/test/gold-paper-ingestion.test.ts`, and `packages/cli/test/gold-paper-acceptance.test.ts` for the automated proof.

</code_context>

<deferred>
## Deferred Ideas

- First-class `figure` nodes or any broader figure/caption schema expansion.
- Full cleveref/package emulation beyond bounded deterministic cases tied to known parser targets.
- Corpus-wide search and cross-paper result UX, which remain deferred to a later milestone.

</deferred>

---

*Phase: 14-residual-tex-parser-hardening*
*Context gathered: 2026-04-03*
