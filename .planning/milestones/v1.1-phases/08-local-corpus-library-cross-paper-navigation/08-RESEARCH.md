# Phase 8: Local Corpus Library & Cross-Paper Navigation - Research

**Generated:** 2026-04-03
**Status:** Ready for planning

## Research Question

What is the smallest trustworthy corpus layer that lets a mathematician manage multiple local papers and follow cross-paper links without collapsing paper boundaries or pretending there is a global canonical graph?

## Findings

### 1. The store and transport layers are already multi-paper

The repo already has the right basic primitives:

- per-paper bundle directories in `.paperparser-data/<paper-id>/`
- `latest.json` selection
- `list` / `GET /api/papers`
- API-backed dashboard paper switching
- MCP resource and tool access by `paperId`

This means Phase 8 does not need a new storage subsystem. It needs a corpus contract and user-facing surfaces.

### 2. The canonical bundle should stay paper-local

The current graph, index, validation, and enrichment flows are all intentionally paper-scoped. Folding multiple papers into one graph would create unnecessary schema churn and would blur provenance at exactly the point where the product promise is trustworthiness.

Recommendation: keep the canonical artifact unchanged and add a corpus-level read model above it.

### 3. Exact cross-paper anchors are sparse in the milestone corpus

Measured corpus inspection shows:

- no shared LaTeX labels across the three selected papers
- no obvious exact cross-paper citation anchors in the current bundle surface
- some domain-level terminology overlap, but raw token overlap is dominated by TeX and generic mathematical vocabulary

Therefore, a literal edge-reuse design will not produce enough useful links for this milestone.

### 4. Explainable terminology overlap is the right v1.1 cross-paper evidence

The viable deterministic design is:

- derive distinctive terms from a selected node's label, section title, and statement
- filter out generic math and TeX tokens
- search other papers for nodes sharing enough distinctive terms
- expose the matching terms and the target node context as the explanation

This keeps the links:

- deterministic
- inspectable
- optional when no evidence exists

### 5. Cross-paper navigation should be additive, not invasive

The right user experience is not "teleport this graph into a global graph". It is:

- inspect a node in paper A
- see related nodes in papers B/C when explainable evidence exists
- click through into that target paper's explorer view
- keep the source and target paper IDs visible throughout

Recommendation: add a dedicated related-across-corpus surface in CLI/API/MCP/Web, not a new canonical edge kind.

## Framework Discovery Outcome

1. Existing codebase solution exists: reuse the stored-paper model, query service, serve API, dashboard controls, and MCP paper resources.
2. Existing dependencies are sufficient: the phase can be implemented with current TypeScript and React tooling.
3. No external library is justified: the required logic is a narrow deterministic corpus matcher, not a vector-search system.

Decision: implement a first-party corpus query layer and expose it through the existing local surfaces.

## Recommended Phase 8 Slice

1. Add a deterministic corpus-link service that compares a selected node against other stored papers and returns related nodes plus evidence terms.
2. Extend corpus listing surfaces with enough metadata to feel like a real local library, including origin and artifact state.
3. Add a CLI/API/MCP surface for related-across-corpus results.
4. Upgrade the dashboard controls and explorer so API mode presents a corpus library and a related-across-corpus panel.
5. Lock the behavior with tests on a three-paper local corpus.

## Risks

- Overly permissive term matching will create noisy or misleading cross-paper links.
- Overly strict matching will produce an empty feature and fail the navigation goal.
- Reusing existing search output without evidence filtering will leak generic tokens like `theorem`, `eqref`, `left`, `right`, or TeX commands.
- A corpus UI that hides paper IDs or relation evidence would violate the trust model even if the underlying logic is correct.

## Suggested Acceptance Criteria

- The local store and listing surface can hold and report all three milestone papers without collisions.
- The dashboard can switch between stored papers in API mode and show corpus membership clearly.
- Cross-paper results appear only when the matcher has explainable evidence terms.
- Cross-paper results always include source paper, target paper, target node identity, and explanation.
- When no evidence exists, the system returns an explicit empty state rather than speculative links.

## Likely File Touch Points

- `packages/core/src/services/`
- `packages/core/src/types/search.ts`
- `packages/cli/src/store.ts`
- `packages/cli/src/index.ts`
- `packages/cli/src/server.ts`
- `packages/web/src/App.tsx`
- `packages/web/src/components/data-controls.tsx`
- `packages/web/src/components/dashboard-pages.tsx`
- `packages/web/src/lib/api-client.ts`
- `packages/mcp/src/server.ts`
