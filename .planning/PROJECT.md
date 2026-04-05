# PaperParser

## What This Is

PaperParser is a local-first TeX dependency parser and exploration tool for mathematicians. It ships a deterministic canonical JSON bundle, optional reviewable enrichment, paper-local search, a local multi-paper corpus workflow, a hardened local export/dashboard path, and a supported Cloud Run deployment slice across aligned CLI/API/dashboard/MCP surfaces without treating the UI or the agent layer as the source of truth.

## Core Value

A mathematician can feed in a TeX paper and get a trustworthy dependency artifact that makes the logical structure of the paper easier to navigate.

## Current State

- **Shipped milestone:** `v1.4 GCP Cloud Run Deployment Hardening` on 2026-04-04
- **Active milestone:** `v1.5 GCP Deployment & CI/CD`
- **Representative acceptance paper:** `ref/papers/long_nalini/arXiv-2502.12268v2/main.tex`
- **Accepted local corpus:** `long_nalini`, `medium_Mueller.flat.tex`, and `short_Petri.tex`
- **Canonical output:** `manifest.json` / `graph.json` / `index.json`
- **Additive sidecars:** `diagnostics.json` and optional `enrichment.json`
- **Accepted workflows:** `analyze -> validate -> search -> inspect`, `export -> serve -> browse`, optional `enrich`, explainable cross-paper `related`, and `deploy -> smoke -> rollback` for the supported Cloud Run path
- **Supported shared deployment:** Google Cloud Run with a combined same-origin dashboard/API service, authenticated direct access, a documented mounted Cloud Storage persistence bridge, and repo-owned deploy/rollback helpers
- **Current non-blocking debt:** `long_nalini` still emits `7` unresolved references concentrated in the deferred figure-reference slice, cross-paper navigation remains intentionally paper-local, unsupported TeX beyond the current normalization set still falls back to raw source, the mounted bucket is still a low-concurrency persistence bridge rather than a high-write architecture, a live GCP deployment has not yet been executed from this repo-owned path, CI/CD automation for Cloud Run is still absent, and Nyquist validation artifacts are still missing for phases 10-16

## Last Shipped Milestone: v1.4 GCP Cloud Run Deployment Hardening

**Goal:** Make PaperParser safe and supportable to deploy on Google Cloud Run as the first supported shared deployment target.

**Delivered:**
- A repo-defined multi-stage Cloud Run container artifact with same-origin dashboard/API serving and browser runtime configuration
- Explicit deployed-mode request boundaries, bounded upload/request handling, and `/healthz` plus `/readyz` endpoints with structured logs
- Authenticated shared deployment helpers that reject public invoker grants and document the supported access model
- A documented Cloud Storage bucket-mount persistence bridge, rollback helper, named smoke workflow, and repo-level `npm run test:acceptance:v1.4` proof
- A wiki-style `docs/project_wiki.md` entry page linked from the root README for faster onboarding through the repo surfaces

## Current Milestone: v1.5 GCP Deployment & CI/CD

**Goal:** Turn the supported Cloud Run deployment path into a real GCP-hosted deployment workflow with full CI/CD support.

**Target features:**
- Execute the first repo-backed deployment onto GCP using the existing Cloud Run topology and security model
- Provision or script the required GCP resources and deployment inputs so the environment can be recreated cleanly
- Add CI/CD for test, build, image publish, and rollout on the supported Cloud Run path
- Keep deployed runtime behavior aligned with the current same-origin, authenticated, mounted-store contract
- Add operator and contributor guidance for managing the automated delivery path after deployment exists

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
- ✓ Package the current app into a supported Cloud Run deployment artifact with explicit runtime configuration — `v1.4`
- ✓ Define the supported GCP web/API topology and same-origin serving strategy for the dashboard — `v1.4`
- ✓ Remove or lock down unsafe internet-facing server behavior such as remote filesystem path analysis — `v1.4`
- ✓ Add explicit shared-deployment security controls for authenticated or otherwise bounded access — `v1.4`
- ✓ Add request-size, upload-size, and readiness/health guardrails suitable for a shared deployment — `v1.4`
- ✓ Publish a GCP operator runbook for deploy, config, persistence, upgrades, and rollback — `v1.4`
- ✓ Publish a named Cloud Run proof workflow covering packaging, runtime config, and bounded deployed behavior — `v1.4`
- ✓ Add a wiki-style project entry page that routes readers to the right product, developer, and operator docs — `v1.4`

### Active

- [ ] Execute the first supported GCP deployment from this repo-owned Cloud Run path
- [ ] Provision or script the GCP-side resources and configuration needed for repeatable deployment
- [ ] Add CI/CD for validation, image publishing, and rollout on the supported Cloud Run target
- [ ] Keep the deployed runtime aligned with the existing security, same-origin, and persistence contracts

### Out of Scope

- Corpus-wide search until deployment execution and CI/CD are real
- Collaborator-facing review and export workflows until hosted delivery is stable
- PDF or OCR-derived inputs until a later milestone explicitly owns broader ingestion quality
- Broad multi-cloud deployment support beyond the supported Cloud Run path
- Treating agent inference as ground truth; enrichment stays separate from the canonical artifact
- Manual graph editing as a substitute for parser quality; parser and inference quality should improve at the source instead
- Broad “works on arbitrary TeX styles” claims without explicit bounded-corpus verification

## Context

The repository is a TypeScript monorepo with active workspace packages in `packages/core`, `packages/cli`, `packages/mcp`, and `packages/web`. The shipped architecture now has a stable canonical bundle pipeline, local storage, schema validation, optional enrichment, search, a corpus read model, a hardened static/dashboard explorer path, and MCP exposure all aligned around the same paper-local graph contract.

`v1.0` established the GitNexus-inspired direction: a machine-readable graph artifact first, with human exploration layered on top. `v1.1` proved that this foundation can absorb search and corpus workflows without creating a second source of truth or collapsing paper boundaries.

`v1.2` closed the major reliability gap around local export sharing by hardening the CLI export contract, bundling MathJax with fragment normalization, and turning unsupported static runtime states into explicit product behavior instead of blank pages. `v1.3` then reduced residual parser gaps, broadened accepted-corpus render salvage, and fixed the remaining exported MathJax runtime/export-asset failures discovered during browser verification. `v1.4` completed the first supported shared deployment slice on Google Cloud Run with explicit server boundaries, authenticated access, a bounded persistence bridge, a named proof workflow, and a wiki-style entry page for project navigation.

`v1.5` is not about inventing a new deployment shape. It is about operationalizing the shipped `v1.4` contract: execute the real GCP deployment, provision the required resources cleanly, and add CI/CD so the Cloud Run path becomes reproducible delivery infrastructure instead of a manual operator-only workflow.

## Constraints

- **Tech Stack:** Stay within the existing TypeScript monorepo and reuse the shipped `manifest` / `graph` / `index` contract unless a future phase explicitly evolves it
- **Trust Model:** Deterministic parse output remains the baseline artifact; probabilistic enrichment must stay optional, labeled, and reviewable
- **User Mode:** Optimize for a single mathematician working locally before adding collaboration or deployment complexity
- **Corpus Model:** Preserve paper boundaries unless a future milestone explicitly owns a merged-graph design
- **Export Reliability:** Static exports are supported through a local HTTP-serving path, not direct `file://` loading
- **Math Presentation:** Mathematical statements render through a shared MathJax normalization/fallback boundary without mutating the canonical bundle text
- **Parser/Render Trust:** Parser hardening and render compatibility should improve source fidelity without masking unsupported content as if it were fully understood
- **Deployment Target:** The supported shared deployment target today is Google Cloud Run, not a generic multi-cloud abstraction
- **Service Safety:** Shared deployment must not preserve local-only trust assumptions around filesystem access, unbounded uploads, or open anonymous access
- **Delivery Discipline:** CI/CD must reinforce the shipped deployment contract rather than introduce a second deployment path with different assumptions
- **Milestone Discipline:** `v1.5` stays focused on real GCP deployment execution and CI/CD rather than mixing in corpus search, collaboration, or broader ingestion

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
| Keep direct Cloud Run service access authenticated and reject public invoker grants in repo-owned helpers | The supported shared path needed one explicit access model instead of a public-by-default endpoint | ✓ Good — the deploy/access scripts now preserve IAM auth and reject `allUsers` / `allAuthenticatedUsers` grants |
| Use a mounted Cloud Storage bucket as the first persistence bridge instead of redesigning the store in the deployment milestone | The deployment slice needed a bounded supported path that stays compatible with the shipped store contract | ✓ Good — `v1.4` shipped a documented bucket-mount bridge and deferred higher-write storage redesign |
| Add a wiki-style start page after the deployment proof rather than bloating the root README | Operators and developers needed a route through the repo that reflects shipped workflows without turning the README into a wall of text | ✓ Good — `docs/project_wiki.md` now acts as the start-here entry point |
| Keep `v1.5` on real GCP execution and CI/CD instead of reopening product-surface scope | The next bottleneck is operationalization of the shipped Cloud Run path, not new parser or corpus features | — Pending |

## Next Milestone Goals

- Execute the first repo-backed GCP deployment on the supported Cloud Run path
- Add CI/CD that proves, publishes, and rolls out the same supported deployment contract
- Keep the deterministic canonical bundle and the paper-local trust model intact while improving hosted delivery maturity

## Evolution

This document tracks the shipped product state plus the next-milestone starting point.

**After each future milestone:**
1. Move shipped requirements from Active to Validated
2. Re-check whether the core value and trust model still match the product
3. Record new decisions with outcomes, not just proposals
4. Keep Current State accurate enough that the next milestone starts from facts rather than memory

---
*Last updated: 2026-04-05 after starting milestone v1.5*
