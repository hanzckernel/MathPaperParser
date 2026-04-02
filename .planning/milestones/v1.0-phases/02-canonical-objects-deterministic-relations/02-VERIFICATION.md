---
phase: 02-canonical-objects-deterministic-relations
verified: 2026-04-02T21:59:36Z
status: passed
score: 4/4 must-haves verified
---

# Phase 2: Canonical Objects & Deterministic Relations Verification Report

**Phase Goal:** Users can trust the deterministic canonical artifact as the source of truth for extracted math objects and deterministic dependencies.
**Verified:** 2026-04-02T21:59:36Z
**Status:** passed

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User gets first-class extracted objects for sections, theorems, lemmas, corollaries, definitions, propositions, proofs, equations, and citations in the canonical artifact. | ✓ VERIFIED | `packages/core/test/gold-paper-canonical-artifact.test.ts` passed and asserts all required object kinds on the representative paper. |
| 2 | Each extracted object keeps a stable identifier and a source anchor back to the original TeX file and span. | ✓ VERIFIED | The same gold-paper artifact test asserts stable IDs plus `file_path`, `start_line`, and `end_line` serialization on canonical nodes. |
| 3 | User gets deterministic explicit and structural relations with distinct provenance and evidence explaining why each visible deterministic edge exists. | ✓ VERIFIED | `packages/core/test/bundle-serializer.test.ts`, `packages/core/test/validation.test.ts`, `packages/core/test/query-service.test.ts`, and web render/data tests passed; explicit and structural edges remain distinct and explainable. |
| 4 | Re-running deterministic parsing on the same TeX input produces stable canonical output apart from explicitly versioned parser metadata. | ✓ VERIFIED | `packages/core/test/gold-paper-canonical-artifact.test.ts` passed its normalized rerun-stability assertion on `long_nalini`. |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/core/src/types/node.ts` | Canonical node kinds and anchor fields | ✓ EXISTS + SUBSTANTIVE | Supports Phase 2 object vocabulary and source anchors. |
| `packages/core/src/types/edge.ts` | Canonical edge kinds with provenance/evidence | ✓ EXISTS + SUBSTANTIVE | Supports explicit and structural deterministic relations. |
| `packages/core/src/serialization/bundle-serializer.ts` | Canonical bundle round-trip for anchors and provenance | ✓ EXISTS + SUBSTANTIVE | Serializes Phase 2 fields without breaking the bundle line. |
| `packages/core/src/ingestion/parsers/latex-parser.ts` | Parser emission of Phase 2 objects and deterministic relations | ✓ EXISTS + SUBSTANTIVE | Emits sections, proofs, equations, citations, and deterministic edges. |
| `packages/core/test/fixtures/latex/canonical-objects/main.tex` | Reduced canonical-object fixture | ✓ EXISTS + SUBSTANTIVE | Replaces the earlier plan-name placeholder with the shipped canonical fixture used across tests. |
| `packages/core/test/gold-paper-canonical-artifact.test.ts` | Gold-paper contract and rerun-stability verification | ✓ EXISTS + SUBSTANTIVE | Contains both canonical object/edge assertions and ACC-02 stability coverage. |
| `packages/core/src/services/bundle-query-service.ts` | Theorem-centric traversal over the richer graph | ✓ EXISTS + SUBSTANTIVE | Keeps structural edges inspectable without polluting dependency traversal. |
| `packages/cli/test/read-commands.test.ts` | CLI acceptance for stored richer bundles | ✓ EXISTS + SUBSTANTIVE | Verifies context/impact reads on Phase 2 bundles. |
| `packages/mcp/test/server.test.ts` | MCP acceptance for richer canonical bundles | ✓ EXISTS + SUBSTANTIVE | Verifies stored-surface compatibility after graph expansion. |

**Artifacts:** 9/9 verified

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `packages/core/src/ingestion/parsers/latex-parser.ts` | `packages/core/src/types/node.ts` | stable IDs and anchors for new node kinds | ✓ WIRED | `gsd-tools verify key-links` confirmed parser emission is aligned with canonical node types. |
| `packages/core/src/ingestion/parsers/latex-parser.ts` | `packages/core/src/types/edge.ts` | deterministic `contains`, `proves`, `uses_in_proof`, and `cites_external` edges | ✓ WIRED | Deterministic edge kinds are emitted on the parser path and verified by serializer and query tests. |
| `packages/core/src/graph/knowledge-graph.ts` | `packages/core/src/services/bundle-query-service.ts` | dependency traversal and impact collection | ✓ WIRED | Query-service regression proves structural edges remain stored but are fenced out of theorem-centric traversal. |
| `packages/core/test/gold-paper-canonical-artifact.test.ts` | `ref/papers/long_nalini/arXiv-2502.12268v2/main.tex` | normalized rerun comparison for ACC-02 | ✓ WIRED | The shipped gold-paper artifact test covers deterministic reruns directly on the representative paper. |

**Wiring:** 4/4 connections verified

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| `OBJ-01` | `02-02` | User gets first-class extracted objects for sections, theorems, lemmas, corollaries, definitions, propositions, proofs, equations, and citations. | ✓ SATISFIED | Gold-paper canonical artifact test asserts all required object kinds. |
| `OBJ-02` | `02-01` | Each extracted object has a stable identifier that survives downstream querying and visualization. | ✓ SATISFIED | Canonical IDs are serialized and consumed by query, CLI, MCP, and web tests. |
| `OBJ-03` | `02-01`, `02-02` | Each extracted object preserves a source anchor back to the original TeX file and span. | ✓ SATISFIED | Gold-paper canonical artifact and ingestion-pipeline tests assert serialized anchors. |
| `REL-01` | `02-02`, `02-03` | User gets deterministic explicit relations derived from directly declared TeX links. | ✓ SATISFIED | Parser, serializer, and query tests verify explicit `uses_in_proof` and `cites_external` edges. |
| `REL-02` | `02-02`, `02-03` | User gets deterministic structural relations derived from document structure. | ✓ SATISFIED | Structural `contains` and `proves` edges are present and remain inspectable. |
| `REL-03` | `02-01`, `02-03` | Each relation records its provenance as `explicit`, `structural`, or `agent_inferred`. | ✓ SATISFIED | Phase 2 bundle and schema tests verify deterministic edges serialize provenance correctly. |
| `REL-04` | `02-01`, `02-03` | Each visible deterministic relation includes evidence that explains why the edge exists. | ✓ SATISFIED | Serializer, validation, and explorer tests verify evidence/detail fields on deterministic edges. |
| `ACC-02` | `02-03` | Re-running deterministic parsing on the same TeX input produces stable canonical output apart from explicitly versioned parser metadata. | ✓ SATISFIED | Gold-paper canonical artifact test passes normalized rerun equality on `long_nalini`. |

**Coverage:** 8/8 requirements satisfied

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `.planning/phases/02-canonical-objects-deterministic-relations/02-02-PLAN.md` | 18 | Planned fixture path drift | ⚠️ Warning | The plan still names `gold-paper-relations/proof-equation.tex`, but the shipped equivalent fixture is `packages/core/test/fixtures/latex/canonical-objects/main.tex`. |
| `.planning/phases/02-canonical-objects-deterministic-relations/02-03-PLAN.md` | 18 | Planned test path drift | ⚠️ Warning | The plan still names `gold-paper-canonical-stability.test.ts`, but the shipped equivalent rerun test lives in `packages/core/test/gold-paper-canonical-artifact.test.ts`. |

**Anti-patterns:** 2 found (0 blockers, 2 warnings)

## Human Verification Required

None — the phase goal is covered by the current gold-paper contract test, stored-surface regressions, and repo-wide automated verification.

## Gaps Summary

**No gaps found.** Phase goal achieved. Ready to proceed.

## Verification Metadata

- **Verification approach:** Goal-backward using Phase 2 success criteria with actual shipped artifacts, not stale intermediate plan filenames
- **Must-haves source:** ROADMAP Phase 2 success criteria with confirmation from `02-01-PLAN.md`, `02-02-PLAN.md`, and `02-03-PLAN.md`
- **Automated checks:** 4 passed, 0 failed
- **Human checks required:** 0
- **Current verification commands:** `npx vitest run packages/core/test/gold-paper-canonical-artifact.test.ts packages/core/test/bundle-serializer.test.ts packages/core/test/validation.test.ts packages/core/test/query-service.test.ts packages/core/test/knowledge-graph.test.ts packages/cli/test/read-commands.test.ts packages/cli/test/serve-app.test.ts packages/mcp/test/server.test.ts packages/web/test/bundle-data.test.ts packages/web/test/proof-graph-render.test.ts`; `npm test`; `npm run typecheck`

---
*Verified: 2026-04-02T21:59:36Z*
*Verifier: Codex*
