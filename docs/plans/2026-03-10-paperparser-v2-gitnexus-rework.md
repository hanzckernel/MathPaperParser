# PaperParser v2 GitNexus Rework Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild PaperParser in-place as a TypeScript monorepo modeled on GitNexus, while preserving the PaperParser `0.1.0` bundle contract and shipping TeX/Markdown ingestion first.

**Architecture:** Add a new root npm-workspaces monorepo (`packages/core`, `packages/cli`, `packages/web`, `packages/mcp`) alongside the current Python tools and Svelte dashboard. Migrate additively: use `tools/`, `dashboard/`, `schema/`, `docs/`, and `prompts/` as reference sources until the TypeScript pipeline, CLI, React dashboard, and MCP server reach parity, then cut over.

**Tech Stack:** Node 22, npm workspaces, TypeScript 5 strict, Vitest, React + Vite, Commander, Kuzu, Graphology, AJV, Unified/Remark, Zustand, D3, KaTeX, `@huggingface/transformers`, `@modelcontextprotocol/sdk`.

---

## Summary
- Bootstrap the root workspace first and keep the current repo layout intact during migration.
- Treat the existing schema files as the immutable Stage 1 public contract; all serializers and validators must round-trip against `schema/*.schema.json`.
- Deliver v2 in two release lines:
  - Stage 1: TeX/Markdown parsing, Kuzu persistence, bundle export, CLI, React web app, MCP tools.
  - Stage 2: PDF parsing behind the same parser interface, with no Stage 1 API changes.
- Mirror GitNexus architecture, not GitNexus source code: no submodule, vendoring, or runtime dependency on GitNexus.

## Public Interfaces and Compatibility
- Root workspace:
  - Create `package.json`, `tsconfig.base.json`, `vitest.workspace.ts`, and shared scripts `build`, `test`, `typecheck`, `lint`.
  - Add `packages/core`, `packages/cli`, `packages/web`, `packages/mcp`; keep `schema/`, `docs/`, `prompts/`, `ref/`, `tools/`, and `dashboard/` in place until cutover.
- Core package public API:
  - `src/types/node.ts`, `edge.ts`, `graph.ts`, `bundle.ts`, `pipeline.ts`, `search.ts`.
  - Export `MathKnowledgeGraph`, `IngestionPipeline`, `BundleSerializer`, `KuzuStore`, `SchemaValidator`, `ConsistencyChecker`, and `HybridSearchEngine`.
  - Freeze `MathNode`, `MathEdge`, `PipelineContext`, `PipelineResult`, `BundleStats`, `SearchResult`, and `ProofStrategy` as the shared types used by CLI, web, and MCP.
- CLI contract:
  - `paperparser analyze <input>`
  - `paperparser query <question>`
  - `paperparser context <node-id>`
  - `paperparser impact <node-id>`
  - `paperparser validate <bundle-or-run-dir>`
  - `paperparser export <bundle-or-run-dir>`
  - `paperparser serve`
  - `paperparser mcp`
  - `paperparser list`
  - `paperparser clean`
  - `paperparser status`
- Web contract:
  - React app in `packages/web` reads either bundle JSON files or the `serve` API.
  - Keep the five existing page concepts: Overview, ProofGraph, TheoremExplorer, InnovationMap, Unknowns.
  - Support client-side upload for `.tex` and `.md`; PDF upload is visible but routed to server-only processing.
- MCP contract:
  - Tools: `query_math_objects`, `get_context`, `impact_analysis`, `trace_proof_chain`, `search_concepts`, `validate_bundle`.
  - Resources: `paperparser://papers`, `paperparser://papers/{id}/graph`, `paperparser://papers/{id}/manifest`, `paperparser://papers/{id}/enrichment`.

## Implementation Phases
### 1. Workspace bootstrap and migration guardrails
- Add the root workspace and stub all four packages with build/test/typecheck scripts before moving feature code.
- Create `docs/architecture.md` documenting additive migration mode and marking `tools/` plus `dashboard/` as v1 references.
- Keep the current root README as-is until the new CLI can analyze a TeX fixture end to end; add only a short v2 status note before then.
- Acceptance: `npm install`, `npm run build`, `npm run test`, and `npm run typecheck` all pass with stubs.

### 2. Core types, graph, serialization, and validation
- Implement `packages/core/src/types` first, matching the v0.1 schema and the abstractions in the draft architecture.
- Build `MathKnowledgeGraph` with map-backed node and edge stores, section/kind secondary indexes, traversal helpers, cycle-safe dependency search, and stats computation.
- Implement `BundleSerializer` with snake_case JSON output that round-trips against the existing schema examples; do not change schema fields in Stage 1.
- Port `tools/validate_bundle_schema.py` and `tools/check_bundle_consistency.py` into `packages/core/src/validation/` as pure library modules, then wrap them in CLI commands.
- Add `packages/core/src/persistence/kuzu-schema.ts`, `kuzu-store.ts`, and `json-store.ts`; Kuzu is the primary store and JSON bundle export is the compatibility format.
- Acceptance: graph unit tests, schema-example round-trip tests, Kuzu persist/load tests, and validation tests all pass.

### 3. Ingestion pipeline for LaTeX and Markdown
- Port `tools/prepare_latex.py` to `packages/core/src/ingestion/flatten/latex-flattener.ts` without changing include flattening or missing-asset reporting.
- Split `tools/build_bundle_from_latex.py` into `phases/scan.ts`, `structure.ts`, `parse.ts`, and `resolve.ts`, plus `parsers/latex-parser.ts`; keep node-id formation, theorem-environment mapping, label extraction, and explicit ref/cite resolution compatible with current bundle output.
- Add `parsers/markdown-parser.ts` using Unified/Remark and normalize blockquote-style theorem headers into the same `MathNode` shape as the LaTeX parser.
- Keep `parsers/pdf-parser.ts` as an interface plus placeholder implementation in Stage 1 so downstream code depends on `DocumentParser`, not LaTeX-only logic.
- Implement `packages/core/src/enrichment/stats-computer.ts` and `report-renderer.ts` by porting the current enrichment and reporting behavior from Python.
- Acceptance: analyzing `ref/papers/short_Petri.flat.tex` produces a schema-valid bundle, a consistency-valid bundle, and a deterministic report from the new core library.

### 4. Search, persistence-backed query APIs, and CLI
- Build math-aware tokenization, BM25, semantic embeddings, and hybrid RRF under `packages/core/src/search/`.
- Expose one query service interface used by CLI, web server, and MCP so ranking logic lives in one place.
- Implement Commander-based commands in `packages/cli/src/commands/` with lazy-loaded handlers and a common formatter for human output plus JSON mode.
- Port `tools/export_dashboard_bundle.py` into `packages/cli/src/commands/export.ts`; Stage 1 export writes bundle JSON plus a built React dashboard.
- Implement `serve` as a thin Express layer over the same core services used by CLI commands.
- Acceptance: `paperparser analyze ref/papers/short_Petri.flat.tex`, `paperparser validate`, `paperparser query "main theorem"`, and `paperparser export` all run against the same stored bundle.

### 5. React dashboard migration
- Create the React app in `packages/web` and keep the five existing page responsibilities and visual semantics from `dashboard/src/`.
- Port D3 and KaTeX logic directly where possible: `ForceGraph`, `BubbleChart`, `SectionTree`, `DetailSidebar`, `StatsBar`, and page composition.
- Replace Svelte stores with Zustand stores under `packages/web/src/stores/`, and move shared view helpers to `packages/web/src/lib/`.
- Preserve the current dark theme tokens initially; redesign is out of scope until parity is reached.
- Support two data modes from day one: static bundle loading and API-backed loading from `serve`.
- Cutover rule: do not delete `dashboard/` until the React app renders schema example data and one real analyzed fixture across all five pages.
- Acceptance: the React app loads schema examples, loads a real bundle, renders all five pages, and handles `.tex`/`.md` upload via the in-browser Stage 1 pipeline.

### 6. MCP server, clustering, and proof flows
- Implement `packages/mcp` only after query/context/impact services exist in `packages/core`.
- Add community detection and proof-flow tracing in `packages/core/src/graph/community.ts` and `packages/core/src/ingestion/phases/proof-flow.ts`; store results in `index.json` enrichment.
- Expose MCP tools and resources as thin adapters over the existing core services; no duplicate business logic in the MCP layer.
- Acceptance: every MCP tool returns data derived from a real analyzed fixture, and proof-chain results match the CLI context and impact views for the same node ids.

### 7. PDF parser and final cutover
- Implement `packages/core/src/ingestion/parsers/pdf-parser.ts` as the only Stage 2 feature gate; reuse the same `PipelineContext`, node and edge shapes, persistence, validation, search, web, and MCP surfaces.
- Port the heuristics from `tools/build_bundle_from_pdf.py`, but isolate PDF extraction so failures do not affect LaTeX and Markdown paths.
- After PDF parsing is validated on at least one fixture, move the legacy Python tools and Svelte dashboard behind a documented `legacy/` or archived-branch strategy and update the root README to present v2 as the default path.
- Acceptance: Stage 2 can parse a PDF fixture into the same bundle format without modifying CLI, web, or MCP public interfaces.

## Migration Map
- `tools/prepare_latex.py` -> `packages/core/src/ingestion/flatten/latex-flattener.ts`
- `tools/build_bundle_from_latex.py` -> `packages/core/src/ingestion/phases/{structure,parse,resolve}.ts` plus `packages/core/src/ingestion/parsers/latex-parser.ts`
- `tools/build_bundle_from_pdf.py` -> `packages/core/src/ingestion/parsers/pdf-parser.ts`
- `tools/validate_bundle_schema.py` -> `packages/core/src/validation/schema-validator.ts`
- `tools/check_bundle_consistency.py` -> `packages/core/src/validation/consistency-checker.ts`
- `tools/refresh_index_from_graph.py` -> `packages/core/src/enrichment/stats-computer.ts`
- `tools/render_report.py` -> `packages/core/src/enrichment/report-renderer.ts`
- `tools/export_dashboard_bundle.py` -> `packages/cli/src/commands/export.ts`
- `dashboard/src/components/*`, `dashboard/src/pages/*`, `dashboard/src/stores/*`, and `dashboard/src/lib/*` -> `packages/web/src/{components,pages,stores,lib}/*`

## Suggested Handoff Slices
- Slice A, sequential first: workspace bootstrap, shared tsconfig/scripts, package skeletons, and core type definitions.
- Slice B, after Slice A: graph, serializer, validation, and Kuzu persistence.
- Slice C, after Slice B starts: LaTeX flattener/parser/resolve pipeline and enrichment/report generation.
- Slice D, after Slice B starts: CLI shell plus query services and export/serve commands.
- Slice E, after Slice A and schema types exist: React app shell, data loading, and page/component migration.
- Slice F, after Slices B and D: MCP server, clustering, and proof flows.
- Slice G, last: PDF parser and legacy cutover/cleanup.

## Test Plan
- Unit tests for node/edge stores, traversal, cycle handling, stats, bundle serialization, schema validation, and consistency rules.
- Fixture integration tests for `ref/papers/short_Petri.flat.tex`, `ref/papers/medium_Mueller.gz`, and `ref/papers/long_nalini/arXiv-2502.12268v2/main.flat.tex`.
- Markdown fixture tests covering theorem headers in blockquotes, labels/anchors, and inline/display math extraction.
- CLI integration tests covering `analyze`, `validate`, `query`, `context`, `impact`, `export`, and `status`.
- Web smoke tests covering schema example load, real bundle load, page routing, sidebar detail rendering, KaTeX rendering, and `.tex`/`.md` upload.
- MCP integration tests calling each tool against a stored fixture and asserting stable response shape.
- Regression tests comparing selected v1 Python outputs against v2 output for `short_Petri` on node ids, node counts by kind, explicit-ref edges, and schema validity.

## Assumptions and Defaults
- The implementation happens in this repo, not in a new sibling repo.
- The migration is additive until parity; legacy code is reference material, not an immediate deletion target.
- `npm` is the workspace package manager.
- GitNexus is an architectural reference only; do not vendor or import its source tree.
- `schema/*.schema.json`, `docs/schema_spec.md`, and `docs/prompt_protocol.md` remain authoritative unless a later explicit schema-version bump is planned.
- Stage 1 ships without PDF ingestion; PDF is the only deferred parser, not a deferred architecture decision.
- Local fixtures under `ref/papers/` remain the canonical acceptance corpus for migration and regression checks.
- Save this handoff as `docs/plans/2026-03-10-paperparser-v2-gitnexus-rework.md` before implementation begins.
