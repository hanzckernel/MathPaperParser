# Codebase Structure

**Analysis Date:** 2026-04-02

## Directory Layout

```text
PaperParser/
├── packages/
│   ├── core/        # Shared domain types, ingestion, serialization, validation, graph/query logic
│   ├── cli/         # CLI commands, local-store helpers, HTTP API, static export orchestration
│   ├── mcp/         # MCP server and MCP-facing store access
│   └── web/         # React/Vite dashboard
├── schema/          # Public JSON schema contract and example bundles
├── docs/            # User guide, architecture notes, deployment/readiness docs
├── dashboard/       # Legacy Svelte dashboard kept as reference
├── tools/           # Legacy Python scripts for earlier workflows
├── prompts/         # Legacy prompt-driven paper analysis workflow
├── ref/             # Local-only fixture/reference area
├── .planning/       # Generated planning and codebase mapping documents
├── AGENTS.md        # Repo agent instructions
├── AGENT_WORKFLOW.md # Canonical workflow instructions
├── package.json     # Workspace scripts and package manager definition
├── tsconfig.json    # TS project references for `core`, `cli`, and `mcp`
├── tsconfig.base.json # Shared TS compiler settings
└── vitest.config.ts # Root test runner config and path aliases
```

## Active vs Legacy Areas

**Active product code:**
- `packages/core/`, `packages/cli/`, `packages/mcp/`, and `packages/web/` are the active TypeScript workspace packages described in `README.md`.
- `schema/` is part of the active contract surface because `packages/core/src/validation/schema-validator.ts` loads `schema/*.schema.json` at runtime.
- `docs/` is active documentation for the current TypeScript alpha, including `docs/architecture.md`, `docs/user_guide.md`, and `docs/deployment_readiness.md`.

**Legacy or reference code kept in-repo:**
- `dashboard/` is the older Svelte/Vite dashboard. `README.md` and `docs/architecture.md` describe it as legacy reference material while `packages/web/` is the active dashboard.
- `tools/` contains Python utilities such as `tools/build_bundle_from_pdf.py`, `tools/sync_bundle_to_dashboard.py`, and `tools/validate_bundle_schema.py` for earlier or adjacent workflows rather than the active TypeScript runtime.
- `prompts/` contains the manual prompt-suite workflow documented in `prompts/README.md`; it is not imported by the workspace packages.

**Local-only or operational areas:**
- `ref/` is a reference area; `ref/papers/README.md` explicitly says `ref/papers/` is local-only and not meant to be committed or published with real fixture content.
- `.worktrees/` and `.backup/` are workspace/backup operational directories, not application code.
- `.planning/codebase/` is generated analysis output for planning workflows.

**Unknown / absent:**
- `AGENTS.md` points to `specs/` for project-specific overrides, but no root `specs/` directory is present in the current repository state.

## Directory Purposes

**`packages/core/`:**
- Purpose: Shared domain package used by every active surface.
- Contains: Source in `packages/core/src/`, tests in `packages/core/test/`, fixtures in `packages/core/test/fixtures/`
- Key files: `packages/core/src/index.ts`, `packages/core/src/ingestion/pipeline.ts`, `packages/core/src/ingestion/bundle-builder.ts`, `packages/core/src/services/bundle-query-service.ts`, `packages/core/src/validation/schema-validator.ts`

**`packages/cli/`:**
- Purpose: Local process entry point for CLI commands, HTTP serving, and static export orchestration.
- Contains: Source in `packages/cli/src/`, tests in `packages/cli/test/`
- Key files: `packages/cli/src/index.ts`, `packages/cli/src/server.ts`, `packages/cli/src/store.ts`, `packages/cli/src/export.ts`

**`packages/mcp/`:**
- Purpose: MCP transport layer over the stored-paper backend.
- Contains: Source in `packages/mcp/src/`, tests in `packages/mcp/test/`
- Key files: `packages/mcp/src/index.ts`, `packages/mcp/src/server.ts`, `packages/mcp/src/store.ts`

**`packages/web/`:**
- Purpose: Active React dashboard for static exports and API-backed browsing.
- Contains: App shell in `packages/web/src/App.tsx`, entry point in `packages/web/src/main.tsx`, components in `packages/web/src/components/`, data helpers in `packages/web/src/lib/`, tests in `packages/web/test/`
- Key files: `packages/web/src/main.tsx`, `packages/web/src/App.tsx`, `packages/web/src/lib/data-source.ts`, `packages/web/src/lib/dashboard-model.ts`, `packages/web/vite.config.ts`

**`schema/`:**
- Purpose: Public bundle contract consumed by validators and used as examples for legacy tooling.
- Contains: `schema/manifest.schema.json`, `schema/graph.schema.json`, `schema/index.schema.json`, plus examples in `schema/examples/`
- Key files: `schema/manifest.schema.json`, `schema/graph.schema.json`, `schema/index.schema.json`

**`docs/`:**
- Purpose: Human-facing product and architecture documentation for the current TypeScript alpha.
- Contains: Architecture, schema, deployment, user-guide, and phase/runbook docs
- Key files: `docs/architecture.md`, `docs/user_guide.md`, `docs/deployment_readiness.md`, `docs/schema_spec.md`

**`dashboard/`:**
- Purpose: Legacy Svelte dashboard retained for reference and older workflows.
- Contains: Svelte app source under `dashboard/src/`, tracked mock JSON under `dashboard/public/data/`
- Key files: `dashboard/README.md`, `dashboard/src/App.svelte`, `dashboard/public/data/manifest.json`

**`tools/`:**
- Purpose: Legacy Python helpers and utility scripts.
- Contains: One-file scripts for bundle building, schema checks, report rendering, and data syncing
- Key files: `tools/build_bundle_from_latex.py`, `tools/build_bundle_from_pdf.py`, `tools/sync_bundle_to_dashboard.py`, `tools/validate_bundle_schema.py`

**`prompts/`:**
- Purpose: Manual prompt-based workflow for paper analysis.
- Contains: Sequential prompt documents `00` through `04` plus `prompts/README.md`
- Key files: `prompts/00_skeleton.md`, `prompts/04_assembly.md`, `prompts/README.md`

**`ref/`:**
- Purpose: Reference fixtures and run artifacts outside the active package graph.
- Contains: `ref/papers/README.md`; additional local fixture content is expected but not tracked in the current repository snapshot
- Key files: `ref/papers/README.md`

## Key File Locations

**Entry Points:**
- `package.json`: Root workspace scripts for `build`, `test`, `typecheck`, and `lint`
- `packages/cli/src/index.ts`: CLI process entry and command router
- `packages/cli/src/server.ts`: HTTP request handler used by `paperparser serve`
- `packages/mcp/src/server.ts`: MCP JSON-RPC server and stdio runner
- `packages/web/src/main.tsx`: Browser entry point for the React dashboard
- `packages/core/src/index.ts`: Shared barrel export for adapter packages

**Configuration:**
- `package.json`: Workspace definitions and root scripts
- `tsconfig.base.json`: Shared strict compiler options
- `tsconfig.json`: TS project references for `packages/core`, `packages/cli`, and `packages/mcp`
- `packages/core/tsconfig.json`: Library build output to `packages/core/dist/`
- `packages/cli/tsconfig.json`: Library/build output to `packages/cli/dist/`
- `packages/mcp/tsconfig.json`: Library/build output to `packages/mcp/dist/`
- `packages/web/tsconfig.json`: Standalone web TS config; `packages/web` is not listed in root `tsconfig.json` references
- `packages/web/vite.config.ts`: Vite config for the active dashboard
- `vitest.config.ts`: Root test config and source aliases for `@paperparser/core` and `@paperparser/mcp`

**Core Logic:**
- `packages/core/src/ingestion/pipeline.ts`: Input-kind routing and pipeline entry
- `packages/core/src/ingestion/parsers/markdown-parser.ts`: Markdown parser
- `packages/core/src/ingestion/parsers/latex-parser.ts`: LaTeX parser
- `packages/core/src/ingestion/flatten/latex-flattener.ts`: LaTeX include/input flattening
- `packages/core/src/ingestion/bundle-builder.ts`: Build `manifest`, `graph`, and `index`
- `packages/core/src/services/bundle-query-service.ts`: Search/context/impact service
- `packages/core/src/graph/knowledge-graph.ts`: In-memory graph implementation
- `packages/core/src/serialization/bundle-serializer.ts`: `camelCase` to `snake_case` boundary
- `packages/core/src/validation/schema-validator.ts`: AJV schema checks
- `packages/core/src/validation/consistency-checker.ts`: Cross-part consistency checks

**Store and Surface Glue:**
- `packages/cli/src/store.ts`: Active filesystem store layout and paper ID resolution
- `packages/cli/src/export.ts`: Build-and-copy static export flow for `packages/web`
- `packages/mcp/src/store.ts`: MCP-side access to the same filesystem store
- `packages/web/src/lib/data-source.ts`: Static-vs-API data loading for the dashboard
- `packages/web/src/lib/api-client.ts`: Upload and list requests against the CLI HTTP API
- `packages/web/src/lib/dashboard-model.ts`: Bundle-to-UI shaping layer

**Testing:**
- `packages/core/test/`: Core parsing, validation, query, graph, and persistence tests
- `packages/core/test/fixtures/`: Markdown and LaTeX fixtures used by core and adapter tests
- `packages/cli/test/`: CLI command, export, and HTTP API tests
- `packages/mcp/test/`: MCP server/tool/resource tests
- `packages/web/test/`: Dashboard data-loading, client, and render tests

## Naming Conventions

**Files:**
- Source modules are mostly kebab-case in the active packages: `packages/core/src/ingestion/bundle-builder.ts`, `packages/cli/src/server.ts`, `packages/web/src/components/data-controls.tsx`
- React root component naming uses `App.tsx` in `packages/web/src/App.tsx`; this is an observed exception to the otherwise kebab-case pattern
- Test files use `*.test.ts`: `packages/cli/test/serve-app.test.ts`, `packages/web/test/api-client.test.ts`
- Schema files use `<part>.schema.json`: `schema/manifest.schema.json`

**Directories:**
- Workspace package names are lower-case and flat under `packages/`: `packages/core`, `packages/cli`, `packages/mcp`, `packages/web`
- Active packages use the common `src/` and `test/` split
- `packages/core/src/` is subdivided by responsibility rather than by feature screen: `ingestion/`, `graph/`, `search/`, `services/`, `serialization/`, `types/`, `validation/`, `persistence/`

## Where to Add New Code

**New parsing or bundle-generation work:**
- Primary code: `packages/core/src/ingestion/`
- Shared bundle/query helpers: `packages/core/src/services/`, `packages/core/src/graph/`, `packages/core/src/search/`
- Tests: `packages/core/test/`

**New CLI command or HTTP endpoint:**
- CLI command dispatch: `packages/cli/src/index.ts`
- HTTP route behavior: `packages/cli/src/server.ts`
- Shared filesystem-store helpers for CLI/API: `packages/cli/src/store.ts`
- Tests: `packages/cli/test/`

**New MCP capability:**
- Tool/resource definitions and request handling: `packages/mcp/src/server.ts`
- Store access shared by MCP handlers: `packages/mcp/src/store.ts`
- Tests: `packages/mcp/test/server.test.ts`

**New web UI feature:**
- Route/page composition: `packages/web/src/App.tsx` and `packages/web/src/components/`
- Data loading or transformation: `packages/web/src/lib/data-source.ts`, `packages/web/src/lib/dashboard-model.ts`, `packages/web/src/lib/api-client.ts`
- Tests: `packages/web/test/`

**New schema or bundle-contract change:**
- JSON contract: `schema/*.schema.json`
- Type definitions: `packages/core/src/types/`
- Serialization boundary: `packages/core/src/serialization/bundle-serializer.ts`
- Validation: `packages/core/src/validation/`
- Cross-package regression coverage: `packages/core/test/`, `packages/cli/test/`, `packages/mcp/test/`, `packages/web/test/`

**Legacy-only work:**
- If the task explicitly targets the old dashboard, use `dashboard/`
- If the task explicitly targets the prompt suite, use `prompts/`
- If the task explicitly targets the Python helpers, use `tools/`
- Do not put new active product work in those directories when the feature is meant for the TypeScript alpha surfaces under `packages/`

## Special Directories

**`packages/*/dist/`:**
- Purpose: Build outputs for `packages/core`, `packages/cli`, and `packages/mcp`
- Generated: Yes
- Committed: No tracked files detected via `git ls-files 'packages/*/dist/*'`

**`packages/web/dist/`:**
- Purpose: Vite build output for the active dashboard
- Generated: Yes
- Committed: No tracked files detected in the current repository state

**`dashboard/public/data/`:**
- Purpose: Tracked mock bundle data for the legacy dashboard
- Generated: No
- Committed: Yes

**`ref/papers/`:**
- Purpose: Local-only paper fixtures described in `ref/papers/README.md`
- Generated: No
- Committed: The README is tracked; actual fixture content is expected to be local-only

**`.planning/codebase/`:**
- Purpose: Generated planning/reference documents for mapper workflows
- Generated: Yes
- Committed: No tracked files were present before this mapping run

---

*Structure analysis: 2026-04-02*
