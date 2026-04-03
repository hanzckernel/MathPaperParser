---
phase: 09-multi-paper-acceptance-gate
verified: 2026-04-03T00:22:47Z
status: passed
score: 3/3 must-haves verified
---

# Phase 9: Multi-Paper Acceptance Gate Verification Report

**Phase Goal:** Users can run the accepted local workflow across a small real-paper corpus and treat it as the milestone proof point.
**Verified:** 2026-04-03T00:22:47Z
**Status:** passed

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `long_nalini` now proves the `analyze -> validate -> search -> inspect` workflow directly. | ✓ VERIFIED | `packages/cli/test/gold-paper-acceptance.test.ts` now asserts `query hyperbolic` and `context sec1::thm:t-dream` in addition to the existing analyze/enrich/validate/export flow. |
| 2 | The same local workflow succeeds on a shared store containing `long_nalini`, `medium_Mueller.flat.tex`, and `short_Petri.tex`. | ✓ VERIFIED | `packages/cli/test/gold-paper-acceptance.test.ts` loads all three papers into one store and asserts list, validate, query, context, and related behavior on the real corpus. |
| 3 | Milestone verification now covers search navigation, parser hardening, and corpus behavior without manual graph editing. | ✓ VERIFIED | The Phase 9 acceptance tests sit on top of the Phase 6-8 work, and `npm test`, `npm run typecheck`, and `npm run build` all pass after the real-corpus gate was added. |

**Score:** 3/3 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/cli/test/gold-paper-acceptance.test.ts` | Milestone-level CLI workflow proof on the real corpus | ✓ EXISTS + SUBSTANTIVE | Covers single-paper and shared-store acceptance on the actual milestone papers. |
| `packages/cli/test/serve-app.test.ts` | API-backed corpus workflow proof | ✓ EXISTS + SUBSTANTIVE | Covers real-corpus listing, search, context, and related results through the serve API helper. |
| `packages/core/src/services/corpus-query-service.ts` | Final matcher cleanup for explainable evidence | ✓ EXISTS + SUBSTANTIVE | Filters generic/TeX-heavy terms more aggressively and expands the source-term window so the real-corpus proof uses better evidence. |

**Artifacts:** 3/3 verified

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `packages/cli/test/gold-paper-acceptance.test.ts` | `ref/papers/long_nalini/arXiv-2502.12268v2/main.tex` | accepted search and inspect workflow | ✓ WIRED | Search and context are now asserted directly on the representative paper. |
| `packages/cli/test/gold-paper-acceptance.test.ts` | `ref/papers/medium_Mueller.flat.tex` and `ref/papers/short_Petri.tex` | shared-store workflow | ✓ WIRED | The real-corpus test proves list, validate, query, and inspect with all three papers coexisting. |
| `packages/core/src/services/corpus-query-service.ts` | `packages/cli/test/serve-app.test.ts` | explainable real-corpus related results | ✓ WIRED | API acceptance now asserts `short-petri` theorem linkage from the selected `long_nalini` theorem with evidence containing `hyperbolic` and `surface`. |

**Wiring:** 3/3 connections verified

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| `ACC-01` | `09-01` | User can complete the local `analyze -> validate -> search -> inspect` workflow on `long_nalini`. | ✓ SATISFIED | `packages/cli/test/gold-paper-acceptance.test.ts` now covers query and context on the real paper in addition to the old end-to-end flow. |
| `ACC-02` | `09-01` | User can complete the same workflow on a local corpus containing `long_nalini`, `medium_Mueller.flat.tex`, and `short_Petri.tex`. | ✓ SATISFIED | The shared-store acceptance test covers all three papers in one local corpus. |
| `ACC-03` | `09-01` | Milestone verification covers search navigation, parser hardening, and corpus behavior without requiring manual graph editing. | ✓ SATISFIED | The acceptance gate sits on top of all prior phase work and the full suite remains green. |

**Coverage:** 3/3 requirements satisfied

## Anti-Patterns Found

None. Phase 9 kept its scope to acceptance proof and narrow matcher cleanup and did not reopen schema or surface work.

## Human Verification Required

None for milestone exit. The full acceptance proof is automated on the accepted corpus.

## Gaps Summary

No blocker gaps remain for `v1.1`. The milestone is ready for audit and closeout.

## Verification Metadata

- **Verification approach:** Goal-backward against ROADMAP Phase 9 success criteria and the full `v1.1` corpus
- **Must-haves source:** `09-01-PLAN.md`
- **Automated checks:** 4 passed, 0 failed
- **Human checks required:** 0
- **Current verification commands:** `npx vitest run packages/cli/test/gold-paper-acceptance.test.ts packages/cli/test/serve-app.test.ts`; `npm test`; `npm run typecheck`; `npm run build`

---
*Verified: 2026-04-03T00:22:47Z*
*Verifier: Codex*
