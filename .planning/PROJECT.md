# PaperParser

## What This Is

PaperParser is a local-first TeX dependency parser and exploration tool for mathematicians. It ships a deterministic canonical JSON bundle, optional reviewable enrichment, and aligned CLI/API/dashboard/MCP surfaces for inspecting a paper without treating the UI or the agent layer as the source of truth. The active milestone expands that foundation with search, parser hardening, and a local multi-paper corpus.

## Core Value

A mathematician can feed in a TeX paper and get a trustworthy dependency artifact that makes the logical structure of the paper easier to navigate.

## Current State

- **Shipped milestone:** `v1.0 TeX MVP` on 2026-04-02
- **Active milestone:** `v1.1 Search, Hardening & Corpus` (all phases complete; ready for closeout)
- **Representative acceptance paper:** `ref/papers/long_nalini/arXiv-2502.12268v2/main.tex`
- **Current milestone corpus target:** `long_nalini`, `medium_Mueller.flat.tex`, and `short_Petri.tex`
- **Canonical output:** `manifest.json` / `graph.json` / `index.json`
- **Additive sidecars:** `diagnostics.json` and optional `enrichment.json`
- **Accepted workflow:** `analyze -> enrich -> validate -> export`
- **Current non-blocking debt:** `long_nalini` still emits `22` unresolved references plus `2` explicit unsupported reference-command diagnostics, and corpus links are intentionally limited to deterministic explainable evidence rather than a global merged graph

## Current Milestone: v1.1 Search, Hardening & Corpus

**Goal:** Make the shipped `v1.0` TeX artifact substantially more usable by adding direct search, improving parser reliability on unresolved references and broader TeX patterns, and supporting a local multi-paper workflow.

**Target features:**
- Search by label, title, or object name with direct navigation into the explorer
- Parser hardening focused on unresolved references and broader TeX coverage beyond the original gold-paper bar
- Local multi-paper corpus support across `long_nalini`, `medium_Mueller.flat.tex`, and `short_Petri.tex`, including explainable cross-paper navigation without collapsing paper boundaries

## Requirements

### Validated

- ✓ Parse a representative heavy TeX project rooted at `main.tex` into a local canonical bundle without requiring PDF input — `v1.0`
- ✓ Extract sections, theorem-like objects, proofs, equations, citations, source anchors, and deterministic dependency relations into the canonical artifact — `v1.0`
- ✓ Preserve trust boundaries with explicit provenance, evidence, and deterministic rerun stability for the canonical output — `v1.0`
- ✓ Provide a local interactive explorer for dependency inspection and structured edge explanations — `v1.0`
- ✓ Provide an optional second-pass enrichment flow with separate storage, confidence, evidence, and provenance-gated visibility — `v1.0`
- ✓ Prove the full local workflow on `long_nalini` without manual graph editing — `v1.0`
- ✓ Add search by label, title, or object name across the parsed paper, with direct explorer navigation — `Phase 6`
- ✓ Reduce unresolved-reference diagnostics on the representative paper and broaden deterministic TeX coverage across `long_nalini`, `medium_Mueller.flat.tex`, and `short_Petri.tex` — `Phase 7`
- ✓ Support a local multi-paper corpus with safe paper isolation and explainable cross-paper navigation — `Phase 8`
- ✓ Prove the accepted local workflow on `long_nalini`, `medium_Mueller.flat.tex`, and `short_Petri.tex` without manual graph editing — `Phase 9`

### Active

- [ ] Close out `v1.1` cleanly and archive the shipped milestone state

### Out of Scope

- PDF or OCR-derived inputs in `v1.1` — defer broader ingestion until TeX hardening and corpus workflows are stable
- Shareable export and collaborator-facing review flows in `v1.1` — local single-user utility remains the priority for this milestone
- Hosted multi-user deployment — the current product remains local-first and single-user
- Treating agent inference as ground truth — enrichment stays separate from the canonical artifact
- Manual graph editing as a substitute for parser quality — parser and inference quality should improve at the source instead
- Broad “works on arbitrary TeX styles” claims — the next milestone broadens coverage, but it still needs explicit verification on a bounded corpus before stronger claims are justified

## Context

The repository is a TypeScript monorepo with active workspace packages in `packages/core`, `packages/cli`, `packages/mcp`, and `packages/web`. The current architecture now has a shipped v1 bundle pipeline, local storage, schema validation, a static/dashboard explorer, and MCP exposure all aligned around the same canonical graph contract.

`v1.0` confirmed the core product direction inspired by GitNexus: a machine-readable graph artifact first, with human exploration layered on top. For this domain, the important design outcome is that deterministic parsing remains the baseline, while agent reasoning is preserved as explicit, optional enrichment rather than blended into the canonical graph.

`v1.1` chooses the first three post-MVP priorities together: search, parser hardening, and multi-paper corpus support. Search should reuse the shipped canonical bundle and stored-paper surfaces instead of inventing a parallel index. Corpus work should preserve paper boundaries, make cross-paper links explainable, and prefer explicit evidence such as citations, normalized object metadata, or other deterministic anchors before leaning on enrichment.

## Constraints

- **Tech Stack:** Stay within the existing TypeScript monorepo and reuse the shipped `manifest` / `graph` / `index` contract unless a future phase explicitly evolves it
- **Trust Model:** Deterministic parse output remains the baseline artifact; probabilistic enrichment must stay optional, labeled, and reviewable
- **User Mode:** Optimize for a single mathematician working locally before adding collaboration or deployment complexity
- **Milestone Scope:** `v1.1` is limited to the first three approved post-MVP priorities; PDF/OCR and collaboration stay deferred
- **Milestone Discipline:** Archive shipped milestones cleanly before starting the next one so planning artifacts do not drift between versions

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
| Make `v1.1` about search, hardening, and corpus support instead of broader input formats | These three additions compound directly on top of the shipped v1 artifact and raise day-to-day usefulness without weakening the trust model | — Pending |
| Reuse the existing stored-paper and canonical-bundle surfaces for search and corpus features | Search and corpus workflows should stay aligned across CLI, API, dashboard, and MCP instead of growing separate data paths | ✓ Good — Phase 6 search now reuses the shared core query path in the web shell |
| Keep Phase 7 focused on deterministic parser gaps instead of adding first-class figure nodes | The measured corpus was dominated by nested/same-line equation-like misses and labeled headings; figure nodes would have introduced broader schema churn | ✓ Good — hardening landed with a bounded explicit residual class and no node-kind expansion |
| Keep Phase 8 corpus behavior as a read model above paper-local bundles | The milestone needs local corpus navigation without destabilizing the canonical schema | ✓ Good — corpus behavior now ships consistently across CLI/API/MCP/Web with paper-local boundaries preserved |
| Limit cross-paper navigation to explicit or explainable links | Multi-paper workflows need to remain inspectable and trustworthy, not speculative global linkage | ✓ Good — related links now carry evidence terms and may return an explicit empty state |
| Tighten matcher evidence using real-corpus acceptance instead of synthetic tuning | The acceptance gate should prefer meaningful terms a mathematician can inspect, not just any overlapping tokens | ✓ Good — Phase 9 now prefers the stronger `hyperbolic` / `surface` link on the accepted corpus |
| Deep-link search results into `#/explorer/<nodeId>` instead of creating a separate search page | Search should accelerate the existing explorer, not fork the navigation model | ✓ Good — Phase 6 made result-to-explorer jumps explicit and testable |

## Evolution

This document now tracks the shipped product state and the currently active milestone.

**After each future milestone:**
1. Move shipped requirements from Active to Validated
2. Re-check whether the core value and trust model still match the product
3. Record new decisions with outcomes, not just proposals
4. Keep Current State accurate enough that the next milestone starts from facts rather than memory

---
*Last updated: 2026-04-03 after completing Phase 9*
