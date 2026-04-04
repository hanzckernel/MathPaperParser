# Milestones

## v1.4 GCP Cloud Run Deployment Hardening (Shipped: 2026-04-04)

**Phases completed:** 6 phases, 6 plans, 18 tasks

**Key accomplishments:**

- Hardened the deployed server boundary with explicit `local` versus `deployed` behavior, bounded request/upload limits, and app-level health/readiness plus structured logs
- Shipped the first repo-defined Cloud Run artifact and same-origin dashboard/API topology for the combined service
- Locked the shared deployment model to authenticated Cloud Run access and rejected public invoker drift in repo-owned helpers
- Documented and tested the supported Cloud Storage bucket-mount persistence bridge, plus deploy, rollback, and smoke workflows
- Published `npm run test:acceptance:v1.4` as the named Cloud Run proof bundle
- Added a wiki-style `docs/project_wiki.md` start page linked from the root README

---

## v1.3 Parse/Render Hardening (Shipped: 2026-04-03)

**Phases completed:** 3 phases, 3 plans, 9 tasks

**Key accomplishments:**

- Reduced the accepted-corpus residual parser budget to `7` explicit unresolved references with alias-aware labels, bounded `\cref` / `\Cref` handling, and deterministic duplicate-label warnings
- Salvaged list-heavy, wrapper-heavy, and bounded `cases` math fragments through the shared MathJax boundary instead of dropping them to raw-source fallback
- Fixed the exported-dashboard MathJax startup race and made `assets/sre/` worker files part of the static export contract
- Published and re-verified `npm run test:acceptance:v1.3` as the named parse/render proof for the accepted corpus and hard-case fixtures

---

## v1.2 Dashboard, Export & Math Rendering Hardening (Shipped: 2026-04-03)

**Phases completed:** 4 phases, 4 plans, 12 tasks

**Key accomplishments:**

- Harden the CLI export contract before dashboard runtime work begins
- Repair dashboard statement rendering with local MathJax plus fragment normalization
- Turn bootstrap/runtime edge cases into explicit product behavior
- Publish the acceptance proof and operator guidance for the hardened local workflow

---

## v1.1 Search, Hardening & Corpus (Shipped: 2026-04-03)

**Phases completed:** 4 phases, 4 plans, 10 tasks

**Key accomplishments:**

- Added paper-local search across CLI, API, MCP, and the dashboard with richer result metadata and direct explorer deep links
- Hardened deterministic TeX parsing across `long_nalini`, `medium_Mueller.flat.tex`, and `short_Petri.tex`, reducing `long_nalini` unresolved references from `121` to `22`
- Added a local corpus read model with per-paper metadata and explainable cross-paper navigation that preserves paper boundaries
- Proved the shipped workflow on the real three-paper corpus and tightened related-link evidence toward meaningful terms such as `hyperbolic` and `surface`

---

## v1.0 TeX MVP (Shipped: 2026-04-02)

**Phases completed:** 5 phases, 9 plans, 16 tasks

**Key accomplishments:**

- Real-paper LaTeX acceptance regression plus reduced fixtures for front matter, missing includes, and diagnostics persistence
- Brace-aware gold-paper front matter, explicit unresolved-reference diagnostics, `.bbl`-aware bibliography handling, and persisted CLI diagnostics sidecars
- Additive canonical bundle contract for anchors, provenance, structural edges, and expanded stats
- Populate anchored canonical objects and deterministic relations on the parser path, then keep the web graph consumer compatible
- Fence structural edges out of dependency traversal, then verify the richer canonical graph across CLI, serve-app, MCP, tests, and typecheck
- Make deterministic relation inspection first-class in the graph explorer
- Create a real enrichment sidecar and expose it across CLI, export, serve, and MCP without touching the canonical bundle
- Load optional enrichment into the explorer and gate it behind provenance-level opt-in
- Turn the representative-paper success bar into an executable CLI acceptance gate

---
