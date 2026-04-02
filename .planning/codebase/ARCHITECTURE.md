# Architecture

**Analysis Date:** 2026-04-02

## System Boundaries

**Inputs:**
- Source documents enter through `packages/cli/src/index.ts` (`analyze`) or `packages/cli/src/server.ts` (`POST /api/papers`).
- Supported alpha inputs are routed from `packages/core/src/ingestion/pipeline.ts` to Markdown and LaTeX parsers. `pdf` is recognized as an input kind in `packages/core/src/types/pipeline.ts`, but `packages/core/src/ingestion/pipeline.ts` throws `PDF ingestion is not implemented in alpha yet.`

**Core system boundary:**
- The stable in-repo domain contract is the three-part bundle `manifest`, `graph`, and `index`, defined by `schema/manifest.schema.json`, `schema/graph.schema.json`, `schema/index.schema.json`, and represented in code by `packages/core/src/types/bundle.ts`.
- Every active surface consumes or produces that bundle shape through `packages/core/src/serialization/bundle-serializer.ts`.

**Output surfaces:**
- Local CLI output: `packages/cli/src/index.ts`
- Local HTTP API: `packages/cli/src/server.ts`
- Static dashboard bundle export: `packages/cli/src/export.ts`
- React dashboard: `packages/web/src/main.tsx` and `packages/web/src/App.tsx`
- MCP server over stdio: `packages/mcp/src/server.ts`

**Storage boundary:**
- The active runtime store is a local filesystem directory resolved to `.paperparser-data/` by `packages/cli/src/store.ts` and `packages/mcp/src/store.ts`.
- Stored papers are materialized as `manifest.json`, `graph.json`, and `index.json` under `.paperparser-data/<paperId>/`, with `.paperparser-data/latest.json` tracking the default paper. This layout is implemented in `packages/cli/src/store.ts`.
- Uploaded API files are staged under `.paperparser-data/_uploads/<paperId>/` before analysis in `packages/cli/src/server.ts`.

**Out of scope / not wired into the live flow:**
- `packages/core/src/persistence/kuzu-store.ts` defines a graph-database persistence adapter and is covered by `packages/core/test/kuzu-store.test.ts`, but no current entry point in `packages/cli/src`, `packages/mcp/src`, or `packages/web/src` imports it.
- `dashboard/`, `tools/`, and `prompts/` remain in the repository as legacy or reference areas per `README.md` and `docs/architecture.md`.

## Pattern Overview

**Overall:** Package-oriented monorepo with a shared domain core and thin delivery adapters.

**Key Characteristics:**
- `packages/core/src` owns parsing, bundle construction, serialization, validation, graph traversal, and query logic.
- `packages/cli/src`, `packages/mcp/src`, and `packages/web/src` are adapters around the same bundle contract rather than separate business-logic stacks.
- Data exchange between packages is file-backed JSON, not a shared service process or database.

## Layers

**Contract Layer:**
- Purpose: Define the stable bundle shape and type system used by every package.
- Location: `schema/`, `packages/core/src/types/`, `packages/core/src/serialization/`
- Contains: `PaperParserBundle`, node/edge enums, serialized snake_case JSON mappings, schema files, example bundles.
- Depends on: Local JSON schema files in `schema/`
- Used by: `packages/core/src/validation/`, `packages/cli/src/store.ts`, `packages/mcp/src/store.ts`, `packages/web/src/lib/data-source.ts`, `packages/web/src/lib/dashboard-model.ts`

**Ingestion Layer:**
- Purpose: Convert a document path into parsed mathematical objects plus diagnostics.
- Location: `packages/core/src/ingestion/`
- Contains: Input detection in `packages/core/src/ingestion/pipeline.ts`, Markdown parsing in `packages/core/src/ingestion/parsers/markdown-parser.ts`, LaTeX flattening in `packages/core/src/ingestion/flatten/latex-flattener.ts`, LaTeX parsing in `packages/core/src/ingestion/parsers/latex-parser.ts`, and bundle assembly in `packages/core/src/ingestion/bundle-builder.ts`
- Depends on: Node filesystem/path APIs plus core type definitions in `packages/core/src/types/`
- Used by: CLI analyze flow in `packages/cli/src/index.ts`, HTTP analyze flow in `packages/cli/src/server.ts`, and tests in `packages/core/test/`

**Query and Graph Layer:**
- Purpose: Build an in-memory graph from a stored bundle and answer search/context/impact queries.
- Location: `packages/core/src/graph/`, `packages/core/src/search/`, `packages/core/src/services/`
- Contains: `MathKnowledgeGraph` in `packages/core/src/graph/knowledge-graph.ts`, keyword scoring in `packages/core/src/search/keyword-search.ts`, and `BundleQueryService` in `packages/core/src/services/bundle-query-service.ts`
- Depends on: Bundle graph and index data from `packages/core/src/types/bundle.ts`
- Used by: CLI read commands in `packages/cli/src/index.ts`, HTTP query endpoints in `packages/cli/src/server.ts`, and MCP tools in `packages/mcp/src/server.ts`

**Validation Layer:**
- Purpose: Enforce schema compliance and internal consistency before bundles are treated as valid outputs.
- Location: `packages/core/src/validation/`
- Contains: AJV-backed schema validation in `packages/core/src/validation/schema-validator.ts` and semantic checks in `packages/core/src/validation/consistency-checker.ts`
- Depends on: `schema/*.schema.json` and serialized bundle shapes from `packages/core/src/serialization/bundle-serializer.ts`
- Used by: CLI `validate` in `packages/cli/src/index.ts`, HTTP `/validate` in `packages/cli/src/server.ts`, MCP `validate_bundle` in `packages/mcp/src/server.ts`, and tests in `packages/core/test/validation.test.ts`

**Store Adapter Layer:**
- Purpose: Bridge the core bundle model to the filesystem-backed paper store.
- Location: `packages/core/src/persistence/json-store.ts`, `packages/cli/src/store.ts`, `packages/mcp/src/store.ts`
- Contains: JSON read/write primitives in `packages/core/src/persistence/json-store.ts` and package-specific store helpers for paper ID resolution, listing, and latest-paper selection in `packages/cli/src/store.ts` and `packages/mcp/src/store.ts`
- Depends on: `BundleSerializer` from `packages/core/src/serialization/bundle-serializer.ts`
- Used by: CLI commands, HTTP routes, MCP tools/resources, and static export flow

**Delivery Layer:**
- Purpose: Expose the same bundle and query capabilities through terminal, HTTP, MCP, and browser UI.
- Location: `packages/cli/src/`, `packages/mcp/src/`, `packages/web/src/`
- Contains: CLI command router in `packages/cli/src/index.ts`, HTTP request handler in `packages/cli/src/server.ts`, MCP JSON-RPC server in `packages/mcp/src/server.ts`, dashboard data loaders in `packages/web/src/lib/`, and React UI in `packages/web/src/components/`
- Depends on: `@paperparser/core`; `packages/cli` also depends on `@paperparser/mcp`
- Used by: End users and agent tooling

## Package Relationships

**`@paperparser/core`:**
- Purpose: Shared implementation foundation.
- Examples: `packages/core/src/index.ts`, `packages/core/src/ingestion/pipeline.ts`, `packages/core/src/services/bundle-query-service.ts`
- Pattern: Pure library package; no top-level process entry point

**`@paperparser/cli`:**
- Purpose: User-facing process entry point for analysis, validation, querying, export, serving, and MCP startup.
- Examples: `packages/cli/src/index.ts`, `packages/cli/src/server.ts`, `packages/cli/src/export.ts`
- Pattern: Thin orchestration package over `@paperparser/core` and `@paperparser/mcp`

**`@paperparser/mcp`:**
- Purpose: MCP-specific transport and resource/tool definitions over the stored bundle backend.
- Examples: `packages/mcp/src/server.ts`, `packages/mcp/src/store.ts`
- Pattern: Transport adapter; delegates bundle work to `@paperparser/core`

**`@paperparser/web`:**
- Purpose: Render stored or exported bundle JSON in the browser.
- Examples: `packages/web/src/App.tsx`, `packages/web/src/lib/data-source.ts`, `packages/web/src/lib/dashboard-model.ts`
- Pattern: Read-only client over serialized bundle JSON plus optional upload/list calls to the CLI HTTP server

## Data Flow

**Analyze and Store Flow:**

1. `packages/cli/src/index.ts` (`runAnalyze`) or `packages/cli/src/server.ts` (`handleAnalyzeRequest`) accepts an input path or uploaded file.
2. `packages/core/src/ingestion/pipeline.ts` resolves the input into a `DocumentInput`, detects `markdown` or `latex`, and dispatches to `packages/core/src/ingestion/parsers/markdown-parser.ts` or `packages/core/src/ingestion/parsers/latex-parser.ts`.
3. The parser returns a `ParsedDocument`; `packages/core/src/ingestion/bundle-builder.ts` transforms it into a `PipelineResult` with `manifest`, `graph`, `index`, and diagnostics.
4. `packages/cli/src/store.ts` serializes the bundle and writes it to `.paperparser-data/<paperId>/`, then updates `.paperparser-data/latest.json`.

**Query and Validation Flow:**

1. CLI read commands in `packages/cli/src/index.ts`, HTTP routes in `packages/cli/src/server.ts`, and MCP tools in `packages/mcp/src/server.ts` resolve a paper ID through store helpers in `packages/cli/src/store.ts` or `packages/mcp/src/store.ts`.
2. `packages/core/src/persistence/json-store.ts` reads the stored JSON parts and rehydrates them into a `PaperParserBundle`.
3. `packages/core/src/services/bundle-query-service.ts` constructs a `MathKnowledgeGraph` from the bundle and answers `search`, `getContext`, and `getImpact`.
4. Validation routes call `packages/core/src/validation/schema-validator.ts` and `packages/core/src/validation/consistency-checker.ts` before returning success.

**Static Export and Dashboard Flow:**

1. `packages/cli/src/export.ts` reads a stored paper from `.paperparser-data/` and builds `@paperparser/web` with Vite.
2. The export step writes the serialized bundle parts into `<output>/data/manifest.json`, `<output>/data/graph.json`, and `<output>/data/index.json`.
3. `packages/web/src/lib/data-source.ts` loads either `./data/*.json` (static mode) or `/api/papers/...` endpoints (API mode selected by `?api=` in the URL).
4. `packages/web/src/lib/dashboard-model.ts` reshapes the serialized bundle into section, node, and edge indexes for the React pages in `packages/web/src/components/`.

**MCP Flow:**

1. `packages/cli/src/index.ts` starts the MCP server through `runPaperParserMcpStdioServer` from `packages/mcp/src/server.ts`.
2. `packages/mcp/src/server.ts` handles JSON-RPC frames on stdio, exposes tool definitions and resource URIs, and reads bundles from the same local store layout as the CLI.
3. Tool handlers delegate to `BundleQueryService`, `SchemaValidator`, and `ConsistencyChecker` in `@paperparser/core`.

**State Management:**
- Persistent state is local filesystem state under `.paperparser-data/`, managed by `packages/cli/src/store.ts` and `packages/mcp/src/store.ts`.
- Query state is rebuilt in memory per request by `BundleQueryService` and `MathKnowledgeGraph` in `packages/core/src/services/bundle-query-service.ts` and `packages/core/src/graph/knowledge-graph.ts`.
- Browser UI state is local React component state in `packages/web/src/App.tsx` and `packages/web/src/components/proof-graph-page.tsx`; no global state library is present in `packages/web/src`.

## Key Abstractions

**`PaperParserBundle`:**
- Purpose: Canonical in-memory representation of a parsed paper bundle.
- Examples: `packages/core/src/types/bundle.ts`, `packages/core/src/serialization/bundle-serializer.ts`
- Pattern: One bundle object with three top-level parts: `manifest`, `graph`, and `index`

**`DocumentInput` / `ParsedDocument` / `PipelineResult`:**
- Purpose: Model the ingestion pipeline from raw source path to validated bundle output.
- Examples: `packages/core/src/types/pipeline.ts`, `packages/core/src/ingestion/pipeline.ts`
- Pattern: Staged pipeline types rather than direct parser-to-JSON output

**`MathKnowledgeGraph`:**
- Purpose: In-memory adjacency/index structure for node/edge traversal.
- Examples: `packages/core/src/graph/knowledge-graph.ts`
- Pattern: Mutable graph object built on top of bundle data for each query session

**`BundleQueryService`:**
- Purpose: Package the search, context, and impact operations over a bundle.
- Examples: `packages/core/src/services/bundle-query-service.ts`
- Pattern: Service object that wraps graph creation and exposes read-only query methods

**Serialized bundle JSON:**
- Purpose: Runtime interchange format between CLI/API/MCP/web and on-disk storage.
- Examples: `packages/core/src/serialization/bundle-serializer.ts`, `packages/core/src/persistence/json-store.ts`, `packages/web/src/lib/data-source.ts`
- Pattern: `camelCase` domain model in TypeScript, `snake_case` persisted JSON at the contract boundary

## Entry Points

**CLI Process:**
- Location: `packages/cli/src/index.ts`
- Triggers: `node packages/cli/dist/index.js ...` and workspace builds from root `package.json`
- Responsibilities: Parse commands, route analyze/read/export/serve/mcp flows, and map failures to exit code `1`

**HTTP API:**
- Location: `packages/cli/src/server.ts`
- Triggers: `paperparser serve` via `runServe` in `packages/cli/src/index.ts`
- Responsibilities: Accept uploads or JSON analyze requests, expose stored bundle parts, and serve query/context/impact/validate endpoints

**MCP Server:**
- Location: `packages/mcp/src/server.ts`
- Triggers: `paperparser mcp` via `runMcp` in `packages/cli/src/index.ts`
- Responsibilities: Expose bundle search/context/impact/validate operations and resource reads over JSON-RPC stdio

**React Dashboard:**
- Location: `packages/web/src/main.tsx`
- Triggers: Vite entry from `packages/web/index.html`
- Responsibilities: Mount `App`, choose static or API-backed data loading, and render overview/graph/explorer/innovation/unknowns pages

**Core Library Barrel:**
- Location: `packages/core/src/index.ts`
- Triggers: Imports from `@paperparser/core` in `packages/cli`, `packages/mcp`, `packages/web`, and tests
- Responsibilities: Re-export the domain surface so adapter packages do not reach into deep paths

## Error Handling

**Strategy:** Throw explicit errors in core modules and translate them at process or transport boundaries.

**Patterns:**
- `packages/core/src/ingestion/pipeline.ts`, `packages/core/src/validation/schema-validator.ts`, and `packages/core/src/validation/consistency-checker.ts` throw plain `Error` objects with actionable messages.
- `packages/cli/src/index.ts` catches command failures and writes the message to stderr before returning `1`.
- `packages/cli/src/server.ts` returns structured JSON errors for invalid requests (`400`, `404`, `415`) and wraps unexpected exceptions in a `500` JSON response.
- `packages/mcp/src/server.ts` converts failures into JSON-RPC error objects with code `-32000`.
- `packages/web/src/App.tsx` stores load/upload failures in React state and renders an error card instead of crashing the app shell.

## Cross-Cutting Concerns

**Logging:** Minimal and boundary-local.
- CLI output uses `console.log` and `console.error` through `defaultIo()` in `packages/cli/src/index.ts`.
- No dedicated logging abstraction or structured logger is present in `packages/core/src`, `packages/cli/src`, `packages/mcp/src`, or `packages/web/src`.

**Validation:** Centralized in the core package.
- Schema validation lives in `packages/core/src/validation/schema-validator.ts`.
- Semantic consistency checks live in `packages/core/src/validation/consistency-checker.ts`.
- The web client in `packages/web/src` does not run AJV validation; it assumes the stored or API-served JSON already matches the contract.

**Authentication:** Not detected.
- `packages/cli/src/server.ts` exposes analyze, list, read, query, context, impact, and validate routes without authentication or authorization checks.
- `packages/mcp/src/server.ts` likewise exposes the local store without auth logic.

**Transport contract stability:**
- The schema version is hard-coded as `0.2.0` across `packages/core/src/ingestion/bundle-builder.ts`, `packages/core/src/types/bundle.ts`, and the JSON schemas in `schema/`.
- `packages/core/src/validation/consistency-checker.ts` enforces schema-version agreement across bundle parts.

**Unknowns / Absences:**
- No background job runner, queue, or worker process is present under `packages/`.
- No shared application service layer exists outside `@paperparser/core`; adapters call core modules directly.
- No server-side persistence backend beyond local JSON storage is wired into the active runtime path.

---

*Architecture analysis: 2026-04-02*
