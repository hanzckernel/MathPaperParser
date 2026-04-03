---
phase: 14-residual-tex-parser-hardening
verified: 2026-04-03T20:26:59Z
status: passed
score: 3/3 must-haves verified
---

# Phase 14: Residual TeX Parser Hardening Verification Report

**Phase Goal:** Users see fewer residual deterministic parse failures on the accepted corpus while unsupported cases stay explicit and the canonical bundle remains stable.
**Verified:** 2026-04-03T20:26:59Z
**Status:** passed

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | The parser now resolves multiline heading labels, secondary labels on existing targets, and bounded `\cref` / `\Cref` references to already-known deterministic nodes. | ✓ VERIFIED | `packages/core/src/ingestion/parsers/latex-parser.ts` now captures multiline headings, registers label aliases, and upgrades bounded cleveref refs into explicit edges; `packages/core/test/ingestion-pipeline.test.ts` proves these seams directly. |
| 2 | Duplicate labels no longer silently overwrite earlier targets; they remain deterministic and explicit. | ✓ VERIFIED | The parser now emits `duplicate_label` warnings while keeping the first target, and `packages/core/test/fixtures/latex/gold-paper-regressions/duplicate-labels.tex` plus `packages/core/test/ingestion-pipeline.test.ts` verify the contract. |
| 3 | The accepted-corpus residual warning budget is materially lower than the shipped `v1.2` baseline without figure-schema work. | ✓ VERIFIED | `packages/core/test/gold-paper-ingestion.test.ts` and `packages/cli/test/gold-paper-acceptance.test.ts` now lock `long_nalini` at `7` unresolved references and `0` `unsupported_reference_command` diagnostics. |

**Score:** 3/3 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/core/src/ingestion/parsers/latex-parser.ts` | Residual parser hardening implementation | ✓ EXISTS + SUBSTANTIVE | Added alias-aware label registration, multiline heading capture, bounded cleveref resolution, and duplicate-label warnings. |
| `packages/core/src/types/pipeline.ts` | Warning contract compatibility | ✓ EXISTS + SUBSTANTIVE | Existing warning shape remained sufficient; Phase 14 reused it without schema churn. |
| `packages/core/test/fixtures/latex/gold-paper-regressions/duplicate-labels.tex` | Duplicate-label regression fixture | ✓ EXISTS + SUBSTANTIVE | Proves first-definition-wins semantics and explicit warning emission. |
| `packages/core/test/ingestion-pipeline.test.ts` | Fixture-level parser proof | ✓ EXISTS + SUBSTANTIVE | Covers multiline headings, label aliases, bounded cleveref, and duplicate labels. |
| `packages/core/test/gold-paper-ingestion.test.ts` | Accepted-corpus warning-budget proof | ✓ EXISTS + SUBSTANTIVE | Locks the lowered residual budget and preserved explicit residuals. |
| `packages/cli/test/gold-paper-acceptance.test.ts` | Persisted diagnostics proof at the CLI boundary | ✓ EXISTS + SUBSTANTIVE | Confirms stored diagnostics reflect the tighter real-corpus budget. |

**Artifacts:** 6/6 verified

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `packages/core/src/ingestion/parsers/latex-parser.ts` | `packages/core/test/ingestion-pipeline.test.ts` | fixture-backed parser regressions | ✓ WIRED | The fixture tests prove alias labels, multiline headings, duplicate-label warnings, and bounded cleveref behavior directly. |
| `packages/core/src/ingestion/parsers/latex-parser.ts` | `packages/core/test/gold-paper-ingestion.test.ts` | accepted-corpus warning budget | ✓ WIRED | The corpus test locks the lowered unresolved budget and preserved explicit residuals. |
| `packages/core/src/ingestion/parsers/latex-parser.ts` | `packages/cli/test/gold-paper-acceptance.test.ts` | stored diagnostics sidecar | ✓ WIRED | The end-to-end CLI workflow sees the same tightened warning budget as the direct parser path. |

**Wiring:** 3/3 connections verified

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| `HARD-06` | `14-01` | User sees fewer residual unresolved-reference diagnostics on the accepted corpus than the current `v1.2` baseline, while remaining unsupported cases stay explicit. | ✓ SATISFIED | `long_nalini` dropped from `22` unresolved references to `7`, with the remaining residuals still explicit in diagnostics. |
| `HARD-07` | `14-01` | Parser handles the next targeted deterministic TeX pattern classes behind current residual warnings or incomplete extraction without manual graph repair. | ✓ SATISFIED | Multiline headings, multi-label targets, and bounded cleveref refs now resolve through deterministic parser logic backed by fixture tests. |
| `HARD-08` | `14-01` | Parser hardening remains rerun-stable and does not weaken the canonical bundle contract used by CLI, API, dashboard, and MCP consumers. | ✓ SATISFIED | `SchemaValidator`, `ConsistencyChecker`, CLI acceptance, and workspace typecheck all pass after the parser change. |

**Coverage:** 3/3 requirements satisfied for this phase

## Anti-Patterns Found

None. Phase 14 stayed inside the parser/diagnostics boundary and did not broaden into figure-schema work or corpus-wide search.

## Human Verification Required

None for phase exit. The approved acceptance bar for Phase 14 is fixture regressions, accepted-corpus proof, and workspace typecheck.

## Gaps Summary

No blocker gaps remain for Phase 14. The remaining explicit residuals are a smaller deferred slice, primarily figure-oriented references.

## Verification Metadata

- **Verification approach:** Goal-backward against ROADMAP Phase 14 success criteria
- **Must-haves source:** `14-01-PLAN.md`
- **Automated checks:** 3 passed, 0 failed
- **Human checks required:** 0
- **Current verification commands:** `PATH=/opt/homebrew/bin:$PATH npm test -- packages/core/test/ingestion-pipeline.test.ts packages/core/test/gold-paper-ingestion.test.ts packages/cli/test/gold-paper-acceptance.test.ts`; `PATH=/opt/homebrew/bin:$PATH npm run typecheck`

---
*Verified: 2026-04-03T20:26:59Z*
*Verifier: Codex*
