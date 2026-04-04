# PaperParser

## What This Is

PaperParser is a local-first TeX dependency parser and exploration tool for mathematicians. It ships a deterministic canonical JSON bundle, optional reviewable enrichment, paper-local search, a local multi-paper corpus workflow, and a hardened local export/dashboard path across aligned CLI/API/dashboard/MCP surfaces without treating the UI or the agent layer as the source of truth.

## Core Value

A mathematician can feed in a TeX paper and get a trustworthy dependency artifact that makes the logical structure of the paper easier to navigate.

## Current State

- **Shipped milestone:** `v1.3 Parse/Render Hardening` on 2026-04-03
- **Active milestone:** `v1.4 GCP Cloud Run Deployment Hardening`
- **Representative acceptance paper:** `ref/papers/long_nalini/arXiv-2502.12268v2/main.tex`
- **Accepted local corpus:** `long_nalini`, `medium_Mueller.flat.tex`, and `short_Petri.tex`
- **Canonical output:** `manifest.json` / `graph.json` / `index.json`
- **Additive sidecars:** `diagnostics.json` and optional `enrichment.json`
- **Accepted workflows:** `analyze -> validate -> search -> inspect`, `export -> serve -> browse`, optional `enrich`, and explainable cross-paper `related`
- **Current non-blocking debt:** `long_nalini` still emits `7` unresolved references concentrated in the deferred figure-reference slice, cross-paper navigation remains intentionally paper-local, unsupported TeX beyond the current normalization set still falls back to raw source, and Nyquist validation artifacts are still missing for phases 10-16
- **Current deployment blockers:** remote `inputPath` analysis is unsafe for untrusted clients, upload handling is still unbounded, the API has no auth layer, health/readiness endpoints are missing, and the repo does not yet ship a supported containerized Cloud Run packaging story

## Last Shipped Milestone: v1.3 Parse/Render Hardening

**Goal:** Reduce the remaining parser and math-render failure modes that still surface as unresolved diagnostics, weak extraction, or raw-source fallback on the accepted corpus.

**Delivered:**
- Alias-aware label resolution, bounded `\cref` / `\Cref` support, and explicit duplicate-label warnings that reduced the accepted-corpus residual parser budget to `7` unresolved references
- Broader shared MathJax normalization for list-heavy, wrapper-heavy, and bounded `cases` fragments plus preserved explicit fallback for unsupported structures
- Exported-dashboard MathJax runtime hardening so browser rendering waits for `startup.promise` and static exports ship the required `assets/sre/` worker payloads
- A named repo-level `npm run test:acceptance:v1.3` proof command with aligned docs and fresh acceptance/browser verification

## Current Milestone: v1.4 GCP Cloud Run Deployment Hardening

**Goal:** make PaperParser safe and supportable to deploy on Google Cloud Run as the first supported shared deployment target.

**Target features:**
- A versioned deployment artifact for Cloud Run, likely containerized, for the combined web/API runtime
- An explicit supported deployment topology so the dashboard and API work correctly on GCP with same-origin or otherwise deliberate routing
- Internet-facing hardening for the current API surface, including removing or restricting remote `inputPath` ingestion
- Shared-deployment security hardening so access is authenticated or otherwise explicitly bounded rather than implicitly public
- Deployment guardrails such as request/upload limits, health/readiness endpoints, and production logging basics
- Operator-facing GCP deployment documentation covering config, persistence, rollout, and rollback

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
- ✓ Harden static dashboard export completeness and latest-paper selection semantics — `v1.2`
- ✓ Restore reliable MathJax-based mathematical rendering in the current web dashboard, including normalization of line-broken and package-dependent TeX fragments — `v1.2`
- ✓ Eliminate persistent exported-dashboard rendering failures by aligning shell, bootstrap, and runtime expectations — `v1.2`
- ✓ Document and verify the supported local export workflow so failures are reproducible and diagnosable — `v1.2`
- ✓ Harden the parser against the remaining recurring TeX patterns that still produce unresolved references or incomplete extraction — `v1.3`
- ✓ Expand render compatibility so more extracted math fragments typeset cleanly instead of falling back to raw source — `v1.3`
- ✓ Prove the upgraded parse/render workflow on the accepted corpus plus targeted hard cases — `v1.3`

### Active

- [ ] Package the current app into a supported Cloud Run deployment artifact with explicit runtime configuration
- [ ] Define the supported GCP web/API topology and same-origin serving strategy for the dashboard
- [ ] Remove or lock down unsafe internet-facing server behavior such as remote filesystem path analysis
- [ ] Add explicit shared-deployment security controls for authenticated or otherwise bounded access
- [ ] Add request-size, upload-size, and readiness/health guardrails suitable for a shared deployment
- [ ] Publish a GCP operator runbook for deploy, config, persistence, upgrades, and rollback

### Out of Scope

- PDF or OCR-derived inputs until a future milestone explicitly owns broader ingestion quality
- Shareable export and collaborator-facing review until a future milestone explicitly owns collaboration workflows
- Broad multi-cloud deployment support beyond the first supported Cloud Run path
- Treating agent inference as ground truth; enrichment stays separate from the canonical artifact
- Manual graph editing as a substitute for parser quality; parser and inference quality should improve at the source instead
- Broad “works on arbitrary TeX styles” claims without explicit bounded-corpus verification

## Context

The repository is a TypeScript monorepo with active workspace packages in `packages/core`, `packages/cli`, `packages/mcp`, and `packages/web`. The shipped architecture now has a stable canonical bundle pipeline, local storage, schema validation, optional enrichment, search, a corpus read model, a hardened static/dashboard explorer path, and MCP exposure all aligned around the same paper-local graph contract.

`v1.0` established the GitNexus-inspired direction: a machine-readable graph artifact first, with human exploration layered on top. `v1.1` proved that this foundation can absorb search and corpus workflows without creating a second source of truth or collapsing paper boundaries.

`v1.2` closed the major reliability gap around local export sharing by hardening the CLI export contract, bundling MathJax with fragment normalization, and turning unsupported static runtime states into explicit product behavior instead of blank pages. `v1.3` then reduced residual parser gaps, broadened accepted-corpus render salvage, and fixed the remaining exported MathJax runtime/export-asset failures discovered during browser verification. `v1.4` shifts from local-only hardening to deployment hardening on Google Cloud Run, which means the repo now needs a supported packaging, topology, and internet-facing safety story rather than only local operator guidance.

## Constraints

- **Tech Stack:** Stay within the existing TypeScript monorepo and reuse the shipped `manifest` / `graph` / `index` contract unless a future phase explicitly evolves it
- **Trust Model:** Deterministic parse output remains the baseline artifact; probabilistic enrichment must stay optional, labeled, and reviewable
- **User Mode:** Optimize for a single mathematician working locally before adding collaboration or deployment complexity
- **Corpus Model:** Preserve paper boundaries unless a future milestone explicitly owns a merged-graph design
- **Export Reliability:** Static exports are supported through a local HTTP-serving path, not direct `file://` loading
- **Math Presentation:** Mathematical statements render through a shared MathJax normalization/fallback boundary without mutating the canonical bundle text
- **Parser/Render Trust:** Parser hardening and render compatibility should improve source fidelity without masking unsupported content as if it were fully understood
- **Deployment Target:** The first supported shared deployment target is Google Cloud Run, not a generic multi-cloud abstraction
- **Service Safety:** Internet-facing deployment must not preserve the current local-only trust assumptions around filesystem access, unbounded uploads, or open APIs
- **Milestone Discipline:** Keep `v1.4` focused on deployment hardening rather than mixing in corpus-wide search, collaboration, or broader ingestion

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
| Harden the export contract before touching visible dashboard reliability | Export completeness and latest-paper semantics needed to be deterministic before debugging browser behavior | ✓ Good — Phase 10 narrowed the problem and removed stale-output ambiguity |
| Use a bundled MathJax boundary with render-time normalization and explicit fallback | The dashboard needed readable math without changing canonical text or depending on browser addon rescue packages | ✓ Good — Phase 11 made statement rendering reliable on the supported surfaces |
| Treat unsupported static `file://` usage as an explicit product blocker | A deliberate blocker is safer than a blank or misleading shell when the runtime is unsupported | ✓ Good — Phase 12 now fails fast with an actionable local-server command |
| Publish a named repo-level acceptance proof for the local export workflow | Closeout and future regressions need one reproducible command instead of scattered manual checks | ✓ Good — `npm run test:acceptance:v1.2` now anchors the shipped workflow proof |
| Defer corpus-wide search until parser/render hardening stabilizes again | Better global discovery is valuable, but residual extraction and rendering gaps still distort the user-facing reading path | ✓ Good — `v1.3` shipped the bounded hardening first, so search can start from a cleaner baseline |
| Treat MathJax `startup.promise` and `assets/sre/` as part of the supported export runtime contract | Script `onload` and partial asset copies were not enough to guarantee real browser rendering on exported dashboards | ✓ Good — the browser path now matches the acceptance claim for exported theorem rendering |
| Standardize the first supported shared deployment target on Google Cloud Run | A concrete target is more valuable than vague “production readiness” work because topology, packaging, and safety constraints depend on the platform | ✓ Good — `v1.4` can harden toward one deployable shape instead of a generic cloud story |
| Treat shared deployment security as a first-class milestone slice rather than an implied side effect of Cloud Run | The repo explicitly calls out missing auth/authz and open internet-facing assumptions; packaging alone would not fix that | ✓ Good — `v1.4` now includes a dedicated security-hardening phase |

## Next Milestone Goals

- Make the current web/API stack deployable on Cloud Run with a supported packaging and routing model
- Replace local-only trust assumptions with explicit server-side deployment and security guardrails
- Leave corpus-wide search, collaboration, and broader ingestion for a later milestone after the Cloud Run path is real

## Evolution

This document tracks the shipped product state plus the next-milestone starting point.

**After each future milestone:**
1. Move shipped requirements from Active to Validated
2. Re-check whether the core value and trust model still match the product
3. Record new decisions with outcomes, not just proposals
4. Keep Current State accurate enough that the next milestone starts from facts rather than memory

---
*Last updated: 2026-04-04 after starting milestone v1.4*
