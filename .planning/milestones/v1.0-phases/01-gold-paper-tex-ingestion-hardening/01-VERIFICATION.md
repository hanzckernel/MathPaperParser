---
phase: 01-gold-paper-tex-ingestion-hardening
verified: 2026-04-02T21:59:36Z
status: passed
score: 3/3 must-haves verified
---

# Phase 1: Gold-Paper TeX Ingestion Hardening Verification Report

**Phase Goal:** Users can parse the representative heavy TeX project from `main.tex` with explicit diagnostics and without relying on PDF input.
**Verified:** 2026-04-02T21:59:36Z
**Status:** passed

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can analyze a TeX paper or TeX project rooted at `main.tex` and receive a parsed artifact without requiring PDF input. | ✓ VERIFIED | `packages/core/test/gold-paper-ingestion.test.ts` passed against `ref/papers/long_nalini/arXiv-2502.12268v2/main.tex`; current targeted rerun passed: 4 files, 12 tests. |
| 2 | The representative heavy TeX paper parses with the include, macro, and package handling required by that paper. | ✓ VERIFIED | `packages/core/test/gold-paper-ingestion.test.ts`, `packages/core/test/latex-flattener.test.ts`, and `packages/core/test/ingestion-pipeline.test.ts` passed; the built CLI audit smoke still analyzes `long_nalini` successfully. |
| 3 | User receives explicit diagnostics for unresolved references, citations, includes, or unsupported constructs instead of silent failure. | ✓ VERIFIED | `packages/core/test/ingestion-pipeline.test.ts` and `packages/cli/test/analyze-command.test.ts` passed; `diagnostics.json` persists beside stored bundles and the CLI surfaces warning summaries. |

**Score:** 3/3 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/core/test/gold-paper-ingestion.test.ts` | Real-paper ingestion regression on `main.tex` | ✓ EXISTS + SUBSTANTIVE | Verifies title/authors, graph content, and warning behavior on `long_nalini`. |
| `packages/core/test/fixtures/latex/gold-paper-regressions/front-matter.tex` | Fixture for brace-aware front matter | ✓ EXISTS + SUBSTANTIVE | Isolates optional-argument title plus nested-brace author parsing. |
| `packages/core/test/fixtures/latex/gold-paper-regressions/missing-input.tex` | Fixture for explicit missing-include diagnostics | ✓ EXISTS + SUBSTANTIVE | Exercises `missing_input` behavior directly. |
| `packages/core/test/fixtures/latex/gold-paper-regressions/unsupported-refs.tex` | Fixture for unresolved and unsupported reference commands | ✓ EXISTS + SUBSTANTIVE | Exercises `unresolved_reference` and unsupported reference-command diagnostics. |
| `packages/core/src/ingestion/parsers/latex-command-extractor.ts` | Brace-aware command extractor for gold-paper front matter | ✓ EXISTS + SUBSTANTIVE | Narrow helper added for reliable title/author extraction without parser replacement. |
| `packages/core/src/ingestion/parsers/latex-parser.ts` | Metadata repair plus structured warning generation | ✓ EXISTS + SUBSTANTIVE | Emits explicit unresolved and unsupported reference diagnostics. |
| `packages/cli/src/store.ts` | Persisted `diagnostics.json` sidecar | ✓ EXISTS + SUBSTANTIVE | Writes diagnostics beside `manifest.json`, `graph.json`, and `index.json` without schema drift. |
| `packages/cli/src/index.ts` | Human-readable analyze output with diagnostics visibility | ✓ EXISTS + SUBSTANTIVE | Reports diagnostics path and warning summary after store write. |

**Artifacts:** 8/8 verified

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `packages/core/test/gold-paper-ingestion.test.ts` | `ref/papers/long_nalini/arXiv-2502.12268v2/main.tex` | `analyzeDocumentPath()` | ✓ WIRED | `gsd-tools verify key-links` confirmed the real paper remains the acceptance target. |
| `packages/core/src/ingestion/pipeline.ts` | `packages/core/src/ingestion/parsers/latex-parser.ts` | `parseLatexDocument()` | ✓ WIRED | Current ingestion path stays on the intended pipeline; no helper-only shortcut replaced it. |
| `packages/cli/src/index.ts` | `packages/cli/src/store.ts` | `writeBundleToStore(bundle, ...)` | ✓ WIRED | Analyze writes the stored bundle and persists diagnostics through the same CLI surface. |
| `packages/core/test/ingestion-pipeline.test.ts` | `packages/core/src/ingestion/parsers/latex-parser.ts` | warning-code assertions | ✓ WIRED | Structured warning-code assertions cover include, bibliography, unresolved-reference, and unsupported-command diagnostics. |

**Wiring:** 4/4 connections verified

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| `INGEST-01` | `01-01`, `01-02` | User can analyze a TeX paper or TeX project rooted at `main.tex` and produce a parsed artifact without requiring PDF input. | ✓ SATISFIED | Real-paper ingestion regression passes on `long_nalini` via `analyzeDocumentPath()` and CLI analyze. |
| `INGEST-02` | `01-01`, `01-02` | User can parse one representative heavy TeX paper with the include, macro, and package handling required by that paper. | ✓ SATISFIED | Gold-paper tests plus current CLI smoke prove the representative project parses on the supported path. |
| `INGEST-03` | `01-01`, `01-02` | User receives explicit parser diagnostics for unresolved references, citations, includes, or unsupported constructs instead of silent failure. | ✓ SATISFIED | Reduced fixtures, ingestion-pipeline assertions, and persisted `diagnostics.json` verify explicit warning codes and storage. |

**Coverage:** 3/3 requirements satisfied

## Anti-Patterns Found

None — no blocker placeholders, TODO stubs, or log-only implementations were found in the phase-owned test and CLI ingestion artifacts.

## Human Verification Required

None — the phase contract is covered by the current automated regressions plus the built-CLI audit smoke on the representative paper.

## Gaps Summary

**No gaps found.** Phase goal achieved. Ready to proceed.

## Verification Metadata

- **Verification approach:** Goal-backward using ROADMAP success criteria, plan must-haves, and current repo state
- **Must-haves source:** ROADMAP Phase 1 success criteria with confirmation from `01-01-PLAN.md` and `01-02-PLAN.md`
- **Automated checks:** 3 passed, 0 failed
- **Human checks required:** 0
- **Current verification commands:** `npx vitest run packages/core/test/gold-paper-ingestion.test.ts packages/core/test/latex-flattener.test.ts packages/core/test/ingestion-pipeline.test.ts packages/cli/test/analyze-command.test.ts`; `npm test`; `npm run typecheck`; built CLI analyze/validate smoke on `long_nalini`

---
*Verified: 2026-04-02T21:59:36Z*
*Verifier: Codex*
