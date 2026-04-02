---
phase: 01
slug: gold-paper-tex-ingestion-hardening
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-02
---

# Phase 01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run packages/core/test/latex-flattener.test.ts packages/core/test/ingestion-pipeline.test.ts packages/cli/test/analyze-command.test.ts` |
| **Full suite command** | `npm test && npm run typecheck` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run packages/core/test/latex-flattener.test.ts packages/core/test/ingestion-pipeline.test.ts packages/cli/test/analyze-command.test.ts`
- **After every plan wave:** Run `npm test`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-W0-01 | W0 | 0 | INGEST-01 | integration + CLI | `npx vitest run packages/core/test/gold-paper-ingestion.test.ts packages/cli/test/analyze-command.test.ts` | ❌ W0 | ⬜ pending |
| 01-W0-02 | W0 | 0 | INGEST-02 | integration + regression | `npx vitest run packages/core/test/gold-paper-ingestion.test.ts packages/core/test/latex-flattener.test.ts packages/core/test/ingestion-pipeline.test.ts` | ❌ W0 | ⬜ pending |
| 01-W0-03 | W0 | 0 | INGEST-03 | integration + CLI persistence | `npx vitest run packages/core/test/ingestion-pipeline.test.ts packages/cli/test/analyze-command.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/core/test/gold-paper-ingestion.test.ts` — full-paper acceptance on `ref/papers/long_nalini/arXiv-2502.12268v2/main.tex`
- [ ] Reduced front-matter fixture or assertions — reproduces `\title[short]{long}` and nested-brace `\author{...}` parsing failures
- [ ] Reduced missing-input fixture or assertions — reproduces explicit `missing_input` diagnostics for unresolved required `\input`
- [ ] Reduced unresolved-reference fixture — reproduces unresolved `\ref` plus unsupported `\cref` diagnostics
- [ ] CLI stored-diagnostics regression — extends `packages/cli/test/analyze-command.test.ts` or a sibling test to assert persisted diagnostics visibility
- [ ] Existing tracked latex-project fixture still asserts `missing_bibliography` so citation-source diagnostics remain executable under INGEST-03

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| CLI analyze output remains understandable on the real paper | INGEST-01, INGEST-03 | Automated tests can verify exit codes and files, but not whether the human-facing diagnostic summary is actually usable | Run `node packages/cli/dist/index.js analyze ref/papers/long_nalini/arXiv-2502.12268v2/main.tex --store /tmp/paperparser-phase1-acceptance --paper long-nalini` and inspect whether success or warning output names the real issue clearly |
| Re-running analyze on the gold paper is stable enough for later canonical guarantees | INGEST-02, INGEST-03 | Phase 2 owns formal stable-output guarantees, but Phase 1 should still confirm the hardening work does not make diagnostics/title-author output drift between deterministic reruns | Run the two `analyze` commands from `01-02-PLAN.md`, then compare manifest title/authors and `diagnostics.json` warning codes across the two output folders |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
