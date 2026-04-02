# Phase 2: Canonical Objects & Deterministic Relations - Research

**Generated:** 2026-04-02
**Status:** Ready for planning

## Research Question

What is the minimum coherent contract change that makes the canonical PaperParser bundle satisfy Phase 2 requirements for first-class objects, source anchors, deterministic relations, provenance, and stable reruns without regressing the Phase 1 gold-paper baseline?

## Current Baseline

Phase 1 now provides a verified ingestion baseline on `ref/papers/long_nalini/arXiv-2502.12268v2/main.tex`:

- trustworthy title and author extraction
- explicit diagnostics persisted to `diagnostics.json`
- stable reruns for manifest title/authors, node count, edge count, and warning-code shape
- 46 explicit `unresolved_reference` warnings remaining on the gold paper

Current contract facts:

- `MathNode` already has optional `filePath`, `startLine`, and `endLine` fields in TypeScript.
- Serializers and schemas currently drop those anchor fields.
- Node kinds are limited to theorem-like objects plus `external_dependency`.
- Edge kinds are limited to `uses_in_proof`, `extends`, `generalizes`, `specializes`, `equivalent_to`, and `cites_external`.
- Edge `evidence` currently mixes provenance-like information (`explicit_ref`, `inferred`, `external`) and is used directly by schema, stats, validators, and the web graph filter.

## Findings

### 1. Source anchors are already half-designed

The least disruptive route for `OBJ-03` is to serialize and validate the existing `MathNode.filePath`, `startLine`, and `endLine` fields instead of inventing a second anchor object. That change touches:

- `packages/core/src/serialization/bundle-serializer.ts`
- `schema/graph.schema.json`
- `packages/core/src/validation/consistency-checker.ts`
- web/model consumers that deserialize graph nodes

This is preferable because it keeps anchors close to the node identity they explain and avoids a sidecar index.

### 2. The node contract must expand, but not every requirement needs a brand-new abstraction

Sections, proofs, and equations are genuinely missing as first-class objects and need additive node kinds plus stable ID abbreviations. The likely minimum additions are:

- `section`
- `proof`
- `equation`

For citations, the project already creates `external_dependency` nodes from `\cite{...}` keys. The minimum-scope Phase 2 path is to explicitly treat those as the first-class citation objects for this milestone rather than introducing a second `citation` node kind and then rewriting the graph around both. That preserves current behavior while satisfying the “first-class citation object” intent with less churn.

### 3. Provenance should become a separate edge field

The roadmap requires provenance values `explicit`, `structural`, and `agent_inferred`, while the current schema uses `evidence` values `explicit_ref`, `inferred`, and `external`. Keeping that overload will make later filtering and reasoning brittle.

Recommended contract:

- Add `provenance` to `MathEdge` and serialized graph edges.
- Use provenance enum:
  - `explicit`
  - `structural`
  - `agent_inferred`
- Keep `evidence` as the support basis and expand its enum minimally:
  - `explicit_ref`
  - `structural`
  - `external`
  - `inferred`

This gives a least-disruptive mapping:

- label/ref edges: `provenance=explicit`, `evidence=explicit_ref`
- citation edges: `provenance=explicit`, `evidence=external`
- containment/proof-attachment edges: `provenance=structural`, `evidence=structural`
- future agent edges: `provenance=agent_inferred`, `evidence=inferred`

This is cleaner than trying to make `evidence` carry both meanings, and it preserves much of the existing UI/filter vocabulary.

### 4. Structural relations need explicit edge kinds

Phase 2 cannot satisfy `REL-02` with metadata alone. It needs at least one structural containment edge kind and one proof-attachment edge kind. The minimum set appears to be:

- `contains`
- `proves`

Possible semantics:

- `section -> contained object` via `contains`
- `proof -> theorem/lemma/proposition/...` via `proves`

Existing `uses_in_proof` can continue to represent explicit dependency edges between mathematical objects and equations.

### 5. Phase 2 is a coordinated contract update, not just parser work

The file touch surface is broader than the parser:

- core types and stats
- serializers and validators
- schema JSON files and schema docs
- bundle builder logic that selects main results, clusters, and attention
- web graph filters and kind/evidence color maps
- markdown parser compatibility
- tests across core, web, CLI, and schema validation

Trying to implement only the parser side will leave the stored artifact inconsistent.

## Recommended Phase 2 Slice

The smallest coherent Phase 2 acceptance slice is:

1. Extend the canonical graph contract for:
   - node anchors (`filePath`, `startLine`, `endLine`)
   - new node kinds (`section`, `proof`, `equation`)
   - new edge kinds (`contains`, `proves`)
   - new edge field (`provenance`)
2. Populate those deterministically in the LaTeX parser for the gold paper.
3. Keep `external_dependency` as the Phase 2 first-class citation object model.
4. Update serializers, validators, stats, schemas, and web graph filters together.
5. Prove stable reruns on the gold paper after the contract change (`ACC-02`).

This is enough to satisfy Phase 2 without drifting into Phase 3 UI workflow work.

## Suggested Acceptance Criteria

- Gold-paper bundle contains first-class section, proof, and equation nodes.
- Gold-paper citation objects remain first-class through `external_dependency` nodes with stable IDs.
- Every deterministic node type serialized into `graph.json` preserves source anchors where extractable.
- Deterministic edges serialize `provenance` distinctly from `evidence`.
- Structural edges exist for section containment and proof attachment.
- Full test suite, typecheck, and gold-paper rerun comparison remain green.

## Risks

- Node ID pattern changes will require coordinated updates in schema, validators, and index references.
- New node kinds may distort existing stats, attention heuristics, and web rendering if section/proof nodes dominate counts.
- Markdown parser compatibility may be overlooked if Phase 2 is implemented TeX-first.
- Existing UI evidence filters currently key off `edge.evidence`; adding provenance will require a compatibility decision even if the Phase 3 UX is deferred.

## Recommended Defaults

- Do not introduce a separate `citation` node kind in Phase 2; keep `external_dependency` as the citation object model to control scope.
- Add `provenance` now rather than trying to reinterpret `evidence` later.
- Serialize source anchors on nodes, not in `metadata`, so downstream consumers get a stable typed contract.
- Exclude purely organizational section/proof nodes from “main result” heuristics and attention rankings unless explicitly requested.

## Likely File Touch Points

- `packages/core/src/types/node.ts`
- `packages/core/src/types/edge.ts`
- `packages/core/src/types/bundle.ts`
- `packages/core/src/serialization/bundle-serializer.ts`
- `packages/core/src/validation/consistency-checker.ts`
- `packages/core/src/graph/stats.ts`
- `packages/core/src/ingestion/parsers/latex-parser.ts`
- `packages/core/src/ingestion/parsers/markdown-parser.ts`
- `packages/core/src/ingestion/bundle-builder.ts`
- `schema/graph.schema.json`
- `schema/index.schema.json`
- `docs/schema_spec.md`
- `packages/web/src/components/proof-graph-page.tsx`

## Test Strategy

- Red/green contract tests for new node kinds and source-anchor serialization.
- Parser tests on reduced TeX fixtures for proofs and labeled equations.
- Gold-paper acceptance test extended to assert section/proof/equation presence and serialized anchors.
- Serializer and validator tests updated for node/edge enum and provenance changes.
- Web bundle-data/proof-graph tests updated for new kinds and provenance-aware filtering defaults.
