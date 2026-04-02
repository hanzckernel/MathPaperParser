---
phase: 02
slug: canonical-objects-deterministic-relations
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-02
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run packages/core/test/gold-paper-canonical-artifact.test.ts packages/core/test/ingestion-pipeline.test.ts packages/core/test/bundle-serializer.test.ts packages/core/test/validation.test.ts packages/web/test/bundle-data.test.ts` |
| **Full suite command** | `npm test && npm run typecheck` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run packages/core/test/gold-paper-canonical-artifact.test.ts packages/core/test/ingestion-pipeline.test.ts packages/core/test/bundle-serializer.test.ts packages/core/test/validation.test.ts packages/web/test/bundle-data.test.ts`
- **After every plan wave:** Run `npm test`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-W0-01 | W0 | 0 | OBJ-01, OBJ-03 | contract + integration | `npx vitest run packages/core/test/gold-paper-canonical-artifact.test.ts packages/core/test/ingestion-pipeline.test.ts` | ❌ W0 | ⬜ pending |
| 02-W0-02 | W0 | 0 | REL-03, REL-04 | serializer + schema | `npx vitest run packages/core/test/bundle-serializer.test.ts packages/core/test/validation.test.ts` | ❌ W0 | ⬜ pending |
| 02-W0-03 | W0 | 0 | ACC-02 | integration + web compatibility | `npx vitest run packages/core/test/gold-paper-canonical-artifact.test.ts packages/web/test/bundle-data.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/core/test/gold-paper-canonical-artifact.test.ts` — full-paper contract assertions for section/proof/equation/external dependency nodes, anchors, structural edges, provenance, and rerun stability
- [ ] Reduced latex canonical fixture — reproduces labeled equation, proof, and section containment with expected anchors
- [ ] Serializer and validation regressions — preserve anchors and provenance round-trip without breaking current schema examples
- [ ] Web compatibility regression — dashboard model tolerates new node kinds and edge provenance without losing bundle loading

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Gold-paper canonical object mix feels plausible for a mathematician | OBJ-01, REL-02 | Automated tests can count nodes and edges, but not whether the extracted object mix is obviously nonsensical | Run `node packages/cli/dist/index.js analyze ref/papers/long_nalini/arXiv-2502.12268v2/main.tex --store /tmp/paperparser-phase2-acceptance --paper long-nalini` and inspect `graph.json` for section, proof, equation, and citation-object presence |
| Deterministic reruns remain stable after contract expansion | ACC-02 | Automated compare catches count drift, but a human should still sanity-check whether the new bundle shape is stable in the expected fields | Run the two `analyze` commands from `02-03-PLAN.md` and inspect that section/proof/equation node IDs and relation provenance look stable across outputs |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers first-class objects, anchors, provenance, and rerun stability
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
