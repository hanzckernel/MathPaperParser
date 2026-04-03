---
phase: 07-tex-hardening-diagnostic-reduction
verified: 2026-04-02T23:51:11Z
status: passed
score: 5/5 must-haves verified
---

# Phase 7: TeX Hardening & Diagnostic Reduction Verification Report

**Phase Goal:** Users can trust that the parser handles a broader real-paper TeX corpus while surfacing fewer unresolved references on the gold paper.
**Verified:** 2026-04-02T23:51:11Z
**Status:** passed

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | The `long_nalini` baseline emits materially fewer unresolved-reference diagnostics than before the phase. | ✓ VERIFIED | Real-corpus guardrails in `packages/core/test/gold-paper-ingestion.test.ts` and `packages/cli/test/gold-paper-acceptance.test.ts` lock `long_nalini` at `22` unresolved references instead of the pre-phase `121`. |
| 2 | `medium_Mueller.flat.tex` parses without unresolved references. | ✓ VERIFIED | `packages/core/test/gold-paper-ingestion.test.ts` asserts zero `unresolved_reference` diagnostics for the medium fixture. |
| 3 | `short_Petri.tex` parses without unresolved references while keeping missing-asset diagnostics explicit. | ✓ VERIFIED | `packages/core/test/gold-paper-ingestion.test.ts` asserts zero unresolved references and preserves one `missing_bibliography` plus four `missing_graphics` warnings. |
| 4 | The parser now handles the measured equation-like, nested-environment, and labeled-heading patterns. | ✓ VERIFIED | `packages/core/test/ingestion-pipeline.test.ts` covers nested `align`, same-line `eqnarray`, nested lemma/proof structure, and labeled subsection/subsubsection nodes. |
| 5 | Deterministic parsing remains safe for downstream consumers. | ✓ VERIFIED | `npm run typecheck`, `npm test`, bundle validation, and the CLI acceptance workflow all passed after the parser changes. |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/core/src/ingestion/parsers/latex-parser.ts` | Broader deterministic LaTeX coverage for the milestone corpus | ✓ EXISTS + SUBSTANTIVE | Adds broader equation-like environment coverage, nested supported-environment extraction, depth-aware same-name environment scanning, and labeled subsection handling. |
| `packages/core/test/fixtures/latex/gold-paper-regressions/nested-envs.tex` | Stable regression fixture for Phase 7 parser failures | ✓ EXISTS + SUBSTANTIVE | Reproduces nested, same-line, and labeled-heading gaps in one deterministic fixture. |
| `packages/core/test/ingestion-pipeline.test.ts` | Parser regression proof | ✓ EXISTS + SUBSTANTIVE | Verifies nested equations, same-line `eqnarray`, nested lemma extraction, and hierarchical section labels. |
| `packages/core/test/gold-paper-ingestion.test.ts` | Real-corpus hardening guardrails | ✓ EXISTS + SUBSTANTIVE | Locks the post-phase unresolved counts and preserved explicit diagnostics across the accepted corpus. |
| `packages/cli/test/gold-paper-acceptance.test.ts` | End-to-end CLI proof on the representative paper | ✓ EXISTS + SUBSTANTIVE | Reads `diagnostics.json` from the CLI store and asserts the tightened residual-diagnostics budget. |

**Artifacts:** 5/5 verified

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `packages/core/src/ingestion/parsers/latex-parser.ts` | `packages/core/test/ingestion-pipeline.test.ts` | nested supported-environment extraction | ✓ WIRED | Regression tests prove nested theorem/equation blocks and labeled subheadings resolve deterministically. |
| `packages/core/src/ingestion/parsers/latex-parser.ts` | `packages/core/test/gold-paper-ingestion.test.ts` | corpus-level unresolved-diagnostic budgets | ✓ WIRED | Real papers are checked directly against the post-phase baseline. |
| `packages/core/src/ingestion/parsers/latex-parser.ts` | `packages/cli/test/gold-paper-acceptance.test.ts` | stored CLI diagnostics artifact | ✓ WIRED | The representative paper’s end-to-end workflow now asserts the tightened `diagnostics.json` content. |

**Wiring:** 3/3 connections verified

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| `HARD-01` | `07-01` | Fewer unresolved-reference diagnostics on `long_nalini`, with remaining gaps explicit. | ✓ SATISFIED | `long_nalini` dropped from `121` unresolved references to `22`, with `2` explicit unsupported reference-command diagnostics still present. |
| `HARD-02` | `07-01` | Parse both `medium_Mueller.flat.tex` and `short_Petri.tex` without manual graph repair steps. | ✓ SATISFIED | Both fixtures parse directly through `analyzeDocumentPath`, and the hardening tests assert no unresolved references remain. |
| `HARD-03` | `07-01` | Handle the broader TeX patterns encountered across the milestone corpus. | ✓ SATISFIED | Added support for broader equation-like environments, nested supported nodes, same-line blocks, and labeled subsection/subsubsection targets. |
| `HARD-04` | `07-01` | Unsupported or ambiguous constructs stay explicit. | ✓ SATISFIED | `missing_bibliography`, `missing_graphics`, and `unsupported_reference_command` warnings remain explicit in tests and real-paper output. |
| `HARD-05` | `07-01` | Deterministic parsing remains rerun-stable and valid for downstream consumers. | ✓ SATISFIED | Full test suite, typecheck, bundle validation, and CLI acceptance all pass with the new parser behavior. |

**Coverage:** 5/5 requirements satisfied

## Anti-Patterns Found

None. The phase did not hide deterministic gaps behind enrichment and did not widen the node schema just to absorb a smaller residual figure-reference slice.

## Human Verification Required

None. The phase contract is covered by deterministic parser regressions, real-corpus ingestion tests, CLI acceptance, typecheck, and the full workspace suite.

## Gaps Summary

No blocker gaps remain for Phase 7. Residual `long_nalini` warnings are explicit and bounded; Phase 8 can proceed.

## Verification Metadata

- **Verification approach:** Goal-backward against ROADMAP Phase 7 success criteria and the measured three-paper corpus
- **Must-haves source:** `07-01-PLAN.md`
- **Automated checks:** 4 passed, 0 failed
- **Human checks required:** 0
- **Current verification commands:** `npx vitest run packages/core/test/ingestion-pipeline.test.ts`; `npx vitest run packages/core/test/gold-paper-ingestion.test.ts packages/cli/test/gold-paper-acceptance.test.ts`; `npm run typecheck`; `npm test`

---
*Verified: 2026-04-02T23:51:11Z*
*Verifier: Codex*
