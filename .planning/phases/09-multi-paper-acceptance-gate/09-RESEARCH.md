# Phase 9: Multi-Paper Acceptance Gate - Research

**Generated:** 2026-04-03
**Status:** Ready for planning

## Research Question

What is the smallest acceptance slice that proves `v1.1` behavior on the full three-paper corpus without reopening product scope?

## Findings

### 1. Most of the milestone is already proven in isolation

The repo already has:

- search tests from Phase 6
- real-corpus hardening guardrails from Phase 7
- corpus and cross-paper integration tests from Phase 8

What is missing is one milestone-level proof that those pieces work together on the accepted real corpus.

### 2. The acceptance workflow should move from export-centric proof to inspection-centric proof

`v1.0` acceptance emphasized `analyze -> enrich -> validate -> export`.

For `v1.1`, the more important observable behavior is:

- analyze into one store
- validate each paper
- search each paper
- inspect selected nodes
- confirm corpus listing and cross-paper navigation work on the same store

Recommendation: keep the old gold-paper export proof, but add a new multi-paper acceptance test that targets the milestone's actual value.

### 3. The real-corpus queries are stable enough for acceptance

Current search probes on the real corpus return stable hits:

- `long_nalini` responds to `hyperbolic`
- `medium_Mueller.flat.tex` responds to `torsion`
- `short_Petri.tex` responds to `Cheeger constant`

These are better acceptance anchors than theorem numbers alone because they prove the user-facing search value instead of merely internal IDs.

### 4. The only likely code change left is matcher hardening, not a new surface

The corpus matcher already returns real-corpus links, but some evidence terms remain too weak for a convincing proof.

Recommendation:

- add the acceptance tests first
- if they expose weak evidence quality, do one narrow matcher cleanup:
  - better token normalization
  - stronger stopword filtering for TeX/math boilerplate
  - no schema or API expansion

### 5. API-level acceptance is enough for the dashboard side

The dashboard is API-backed in corpus mode. Proving:

- `GET /api/papers`
- `GET /api/papers/:id/query`
- `GET /api/papers/:id/context/:nodeId`
- `GET /api/papers/:id/related/:nodeId`

on a shared real-paper store is sufficient acceptance evidence for the dashboard-facing workflow without requiring browser automation in this phase.

## Framework Discovery Outcome

1. Existing codebase solution exists: extend the acceptance test suite rather than building new tooling.
2. Existing dependencies are sufficient: Vitest plus the current CLI/API helpers cover the proof gate.
3. No external library is justified: this is milestone verification, not a new subsystem.

Decision: implement a multi-paper acceptance gate in tests, with only narrow matcher cleanup if the real corpus exposes weak evidence quality.

## Recommended Phase 9 Slice

1. Add failing acceptance tests that load all three real papers into one local store and assert:
   - validate succeeds for each paper
   - search returns stable hits for each paper
   - inspect surfaces return the expected node context
   - corpus listing includes all three papers
   - at least one real cross-paper navigation path is explainable
2. Tighten the corpus matcher only if the failing acceptance test shows evidence terms that are too weak or noisy.
3. Run full milestone verification and mark the milestone ready for audit/closeout.

## Risks

- Acceptance probes that rely on brittle exact node IDs or raw counts may create maintenance noise.
- If the matcher remains too permissive, the acceptance proof could pass on low-quality evidence that does not meet the product bar.
- If the matcher becomes too strict, cross-paper acceptance could disappear entirely on the current corpus.

## Suggested Acceptance Criteria

- `long_nalini` completes `analyze -> validate -> search -> inspect`.
- A single store containing all three papers supports listing, validation, search, inspection, and explainable cross-paper navigation.
- All verification remains green with no manual graph edits or paper-specific repair steps.

## Likely File Touch Points

- `packages/core/src/services/corpus-query-service.ts`
- `packages/cli/test/gold-paper-acceptance.test.ts`
- `packages/cli/test/serve-app.test.ts`
