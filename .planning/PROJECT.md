# PaperParser

## What This Is

PaperParser is a local-first TeX dependency parser and exploration tool for mathematicians. It ships a deterministic canonical JSON bundle, optional reviewable enrichment, paper-local search, and a local multi-paper corpus workflow across aligned CLI/API/dashboard/MCP surfaces without treating the UI or the agent layer as the source of truth.

## Core Value

A mathematician can feed in a TeX paper and get a trustworthy dependency artifact that makes the logical structure of the paper easier to navigate.

## Current State

- **Shipped milestone:** `v1.1 Search, Hardening & Corpus` on 2026-04-03
- **Active milestone:** `v1.2 Dashboard, Export & Math Rendering Hardening`
- **Representative acceptance paper:** `ref/papers/long_nalini/arXiv-2502.12268v2/main.tex`
- **Accepted local corpus:** `long_nalini`, `medium_Mueller.flat.tex`, and `short_Petri.tex`
- **Canonical output:** `manifest.json` / `graph.json` / `index.json`
- **Additive sidecars:** `diagnostics.json` and optional `enrichment.json`
- **Accepted workflows:** `analyze -> validate -> search -> inspect`, optional `enrich`, and explainable cross-paper `related`
- **Current non-blocking debt:** `long_nalini` still emits `22` unresolved references plus `2` explicit unsupported reference-command diagnostics, cross-paper navigation remains intentionally paper-local, and static export/dashboard startup still needs hardening against persistent render failures

## Last Shipped Milestone: v1.1 Search, Hardening & Corpus

**Goal:** Make the shipped `v1.0` TeX artifact substantially more usable by adding direct search, improving parser reliability on unresolved references and broader TeX patterns, and supporting a local multi-paper workflow.

**Delivered:**
- Search by label, title, or object name with direct explorer navigation
- Parser hardening across `long_nalini`, `medium_Mueller.flat.tex`, and `short_Petri.tex`
- Local multi-paper corpus support with explainable cross-paper navigation that preserves paper boundaries
- Real-corpus acceptance proof for the shipped workflow on the three-paper corpus

## Current Milestone: v1.2 Dashboard, Export & Math Rendering Hardening

**Goal:** Make static dashboard exports, dashboard startup behavior, and mathematical equation rendering reliable enough that local sharing and demo flows do not fail with a blank page, raw LaTeX-heavy text, or misleading render state.

**Target features:**
- Deterministic static export output, including `--paper latest` resolution and explicit `enrichment.json` handling when no sidecar exists
- Reliable MathJax-based equation and inline-math rendering across the current dashboard surfaces instead of raw statement text
- Consistent exported dashboard shell/bootstrap behavior with a clear supported mount target
- Actionable runtime handling for unsupported static `file://` usage instead of silent render failure
- Regression coverage and docs for the supported local export-and-serve workflow

## Requirements

### Validated

- ✓ Parse a representative heavy TeX project rooted at `main.tex` into a local canonical bundle without requiring PDF input — `v1.0`
- ✓ Extract sections, theorem-like objects, proofs, equations, citations, source anchors, and deterministic dependency relations into the canonical artifact — `v1.0`
- ✓ Preserve trust boundaries with explicit provenance, evidence, and deterministic rerun stability for the canonical output — `v1.0`
- ✓ Provide a local interactive explorer for dependency inspection and structured edge explanations — `v1.0`
- ✓ Provide an optional second-pass enrichment flow with separate storage, confidence, evidence, and provenance-gated visibility — `v1.0`
- ✓ Prove the full local workflow on `long_nalini` without manual graph editing — `v1.0`
- ✓ Add search by label, title, or object name across the parsed paper, with direct explorer navigation — `v1.1`
- ✓ Reduce unresolved-reference diagnostics on the representative paper and broaden deterministic TeX coverage across `long_nalini`, `medium_Mueller.flat.tex`, and `short_Petri.tex` — `v1.1`
- ✓ Support a local multi-paper corpus with safe paper isolation and explainable cross-paper navigation — `v1.1`
- ✓ Prove the accepted local workflow on `long_nalini`, `medium_Mueller.flat.tex`, and `short_Petri.tex` without manual graph editing — `v1.1`

### Active

- [ ] Harden static dashboard export completeness and latest-paper selection semantics
- [ ] Restore reliable MathJax-based mathematical rendering in the current web dashboard, including normalization of line-broken and package-dependent TeX fragments
- [ ] Eliminate persistent exported-dashboard rendering failures by aligning shell, bootstrap, and runtime expectations
- [ ] Document and verify the supported local export workflow so failures are reproducible and diagnosable

### Out of Scope

- PDF or OCR-derived inputs until a future milestone explicitly owns broader ingestion quality
- Shareable export and collaborator-facing review until a future milestone explicitly owns collaboration workflows
- Hosted multi-user deployment while the product remains local-first and single-user
- Treating agent inference as ground truth; enrichment stays separate from the canonical artifact
- Manual graph editing as a substitute for parser quality; parser and inference quality should improve at the source instead
- Broad “works on arbitrary TeX styles” claims without explicit bounded-corpus verification

## Context

The repository is a TypeScript monorepo with active workspace packages in `packages/core`, `packages/cli`, `packages/mcp`, and `packages/web`. The shipped architecture now has a stable canonical bundle pipeline, local storage, schema validation, optional enrichment, search, a corpus read model, a static/dashboard explorer, and MCP exposure all aligned around the same paper-local graph contract.

`v1.0` established the GitNexus-inspired direction: a machine-readable graph artifact first, with human exploration layered on top. `v1.1` proved that this foundation can absorb search and corpus workflows without creating a second source of truth or collapsing paper boundaries.

`v1.2` is intentionally a hardening milestone, not a new product-surface milestone. The immediate gap is reliability around static exports, dashboard startup, and mathematical display: current work in progress already points at export payload completeness, `--paper latest` correctness, root mount consistency, explicit runtime behavior when a user opens an export in an unsupported way, and a mismatch between the documented dashboard expectation of rendered math and the current React implementation that still shows raw statement text. The rendering fix should use MathJax, but not by assuming raw extracted fragments are already valid browser-ready TeX; the milestone should include normalization for hard line breaks and package-dependent fragments rather than depending on `amsmath` or `amsthm` addons to rescue malformed HTML rendering.

## Constraints

- **Tech Stack:** Stay within the existing TypeScript monorepo and reuse the shipped `manifest` / `graph` / `index` contract unless a future phase explicitly evolves it
- **Trust Model:** Deterministic parse output remains the baseline artifact; probabilistic enrichment must stay optional, labeled, and reviewable
- **User Mode:** Optimize for a single mathematician working locally before adding collaboration or deployment complexity
- **Corpus Model:** Preserve paper boundaries unless a future milestone explicitly owns a merged-graph design
- **Export Reliability:** Static exports must fail explicitly when used outside the supported local-serving path instead of rendering a blank or misleading shell
- **Math Presentation:** Mathematical statements should render through MathJax in a readable form without changing the underlying canonical bundle text contract
- **Math Compatibility:** The dashboard should normalize extracted TeX fragments for line breaks and package-dependent constructs instead of relying on `amsmath` / `amsthm` addon compatibility at render time
- **Milestone Discipline:** Keep `v1.2` focused on export/dashboard/math rendering hardening rather than mixing in PDF ingestion, global corpus search, or collaborator review work

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Keep the canonical output as machine-readable JSON instead of Markdown or HTML-only output | The parser result needs to be queryable, comparable, and reusable across CLI/API/MCP/dashboard surfaces | ✓ Good — this became the stable v1 contract |
| Generate a local interactive HTML explorer on top of the canonical artifact | The user needs human-friendly navigation, but the UI should not be the source of truth | ✓ Good — the explorer shipped as a consumer of the canonical bundle |
| Treat agent semantic inference as an optional second pass | Separating deterministic parsing from probabilistic enrichment preserves trust, debuggability, and testability | ✓ Good — `enrichment.json` shipped as a separate sidecar |
| Track relation provenance as `explicit`, `structural`, or `agent_inferred` | Mixed-confidence edges need different handling in both storage and UI | ✓ Good — provenance now drives storage, validation, and UI filtering |
| Optimize the first milestone for one representative heavy TeX paper | Narrowing the acceptance bar keeps the phase realistic and measurable | ✓ Good — `long_nalini` became the executable proof point |
| Keep structural edges stored but out of theorem-centric dependency traversal | Mathematical inspection needs context edges available without polluting dependency queries | ✓ Good — raw graph completeness and dependency semantics now coexist cleanly |
| Persist diagnostics and enrichment as sidecars instead of mutating the canonical bundle schema | Additive files preserve trust boundaries without destabilizing shipped consumers | ✓ Good — `diagnostics.json` and `enrichment.json` both shipped cleanly |
| Make `v1.1` about search, hardening, and corpus support instead of broader input formats | These three additions compound directly on top of the shipped v1 artifact and raise day-to-day usefulness without weakening the trust model | ✓ Good — `v1.1` shipped as a coherent product slice |
| Reuse the existing stored-paper and canonical-bundle surfaces for search and corpus features | Search and corpus workflows should stay aligned across CLI, API, dashboard, and MCP instead of growing separate data paths | ✓ Good — search and corpus both ship through shared contracts |
| Keep Phase 7 focused on deterministic parser gaps instead of adding first-class figure nodes | The measured corpus was dominated by nested/same-line equation-like misses and labeled headings; figure nodes would have introduced broader schema churn | ✓ Good — hardening landed with a bounded explicit residual class and no node-kind expansion |
| Keep Phase 8 corpus behavior as a read model above paper-local bundles | The milestone needs local corpus navigation without destabilizing the canonical schema | ✓ Good — corpus behavior now ships consistently across CLI/API/MCP/web with paper-local boundaries preserved |
| Limit cross-paper navigation to explicit or explainable links | Multi-paper workflows need to remain inspectable and trustworthy, not speculative global linkage | ✓ Good — related links now carry evidence terms and may return an explicit empty state |
| Tighten matcher evidence using real-corpus acceptance instead of synthetic tuning | The acceptance gate should prefer meaningful terms a mathematician can inspect, not just any overlapping tokens | ✓ Good — Phase 9 prefers the stronger `hyperbolic` / `surface` link on the accepted corpus |
| Deep-link search results into `#/explorer/<nodeId>` instead of creating a separate search page | Search should accelerate the existing explorer, not fork the navigation model | ✓ Good — Phase 6 made result-to-explorer jumps explicit and testable |

## Evolution

This document tracks the shipped product state and the starting point for the next milestone.

**After each future milestone:**
1. Move shipped requirements from Active to Validated
2. Re-check whether the core value and trust model still match the product
3. Record new decisions with outcomes, not just proposals
4. Keep Current State accurate enough that the next milestone starts from facts rather than memory

---
*Last updated: 2026-04-03 after starting milestone v1.2*
