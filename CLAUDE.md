<!-- GSD:project-start source:PROJECT.md -->
## Project

**PaperParser**

PaperParser is a local-first parser and exploration tool for mathematicians working with research papers. The existing codebase already parses academic Markdown and LaTeX into a structured bundle and exposes that bundle through a CLI, HTTP API, React dashboard, and MCP server; the current project focus is to make the TeX path strong enough for a mathematician to navigate a heavy paper through an explicit dependency structure rather than raw source files.

**Core Value:** A mathematician can feed in a TeX paper and get a trustworthy dependency artifact that makes the logical structure of the paper easier to navigate.

### Constraints

- **Tech Stack**: Stay within the existing TypeScript monorepo and reuse the current `manifest` / `graph` / `index` bundle contract unless a phase explicitly evolves that contract — the codebase already has working CLI, API, dashboard, and MCP adapters around it.
- **Input Scope**: Focus this milestone on TeX only — narrowing scope is necessary to make dependency parsing trustworthy.
- **Trust Model**: Deterministic parse output is the baseline artifact; agent-inferred semantic edges must be optional and explicitly marked with provenance, confidence, and evidence — otherwise the graph becomes hard to trust and debug.
- **User Mode**: Optimize for a single local mathematician, not collaborative or internet-facing workflows — this keeps the first milestone productively narrow.
- **Success Bar**: One representative heavy paper parsed well is sufficient for v1 — broad paper coverage is a later expansion problem.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 5.9.2 - active application and library code across `packages/core/src/**/*.ts`, `packages/cli/src/**/*.ts`, and `packages/mcp/src/**/*.ts`, configured in `package.json`.
- TSX / React JSX - browser UI code in `packages/web/src/App.tsx` and `packages/web/src/main.tsx`, compiled with `packages/web/tsconfig.json`.
- JavaScript + Svelte - legacy dashboard package in `dashboard/`, with its own `dashboard/package.json`; it is present in the repo but not part of the root `package.json` workspace list.
- Python - legacy utility scripts in `tools/*.py`; no `pyproject.toml`, `requirements.txt`, `poetry.lock`, or `uv.lock` was detected at the repo root.
- JSON Schema - runtime bundle contracts in `schema/manifest.schema.json`, `schema/graph.schema.json`, and `schema/index.schema.json`, loaded by `packages/core/src/validation/schema-validator.ts`.
## Runtime
- Node.js v22.20.0 - verified in `README.md` and `docs/user_guide.md`; the CLI/API code also relies on modern Node Web APIs such as `Request`, `Response`, `FormData`, and `File` in `packages/cli/src/server.ts`.
- Browser runtime - required for the React dashboard in `packages/web/`.
- npm 10.9.3 - declared in `package.json` as `packageManager` and repeated in `README.md`.
- Lockfile: `package-lock.json` present at the repository root.
## Workspace Topology
- `package.json` declares `workspaces: ["packages/*"]`.
- `packages/core` - shared ingestion, validation, serialization, search, and persistence library.
- `packages/cli` - CLI entrypoint plus the local HTTP API server.
- `packages/mcp` - MCP server exposing the stored-paper/query surface over stdio.
- `packages/web` - React dashboard that reads static bundle JSON or calls the local API.
- `dashboard/` - legacy Svelte/Vite dashboard with its own package manifest in `dashboard/package.json`.
- `tools/` - legacy Python helper scripts.
- `schema/` - runtime JSON schemas plus examples, consumed by `packages/core/src/validation/schema-validator.ts`.
- `docs/` - operational and product documentation, including `docs/deployment_readiness.md` and `docs/user_guide.md`.
## Frameworks
- npm workspaces - monorepo package orchestration from the root `package.json`.
- TypeScript project references and composite builds - root `tsconfig.json` references `packages/core`, `packages/cli`, and `packages/mcp`; package-level compiler settings live in `packages/*/tsconfig.json`.
- React 19.1.1 - UI framework for `packages/web`, declared in `packages/web/package.json`.
- Vite 6.4.1 with `@vitejs/plugin-react` 4.7.0 - web build toolchain in `packages/web/package.json` and `packages/web/vite.config.ts`.
- Node built-in HTTP server - `createServer` from `node:http` in `packages/cli/src/index.ts`; there is no Express/Fastify/Koa dependency in the active workspace manifests.
- MCP over stdio - custom JSON-RPC framing in `packages/mcp/src/server.ts`.
- Vitest 3.2.4 - root test runner configured in `vitest.config.ts` and invoked from the root `package.json`.
- AJV 8.17.1 + `ajv-formats` 3.0.1 - schema validation in `packages/core/src/validation/schema-validator.ts`.
- Kuzu 0.11.2 - graph database adapter in `packages/core/src/persistence/kuzu-store.ts`; it is exported and tested, but the current CLI/API/MCP flows read and write the JSON store instead of Kuzu.
## Key Dependencies
- `typescript` `^5.9.2` - compiler and type system for all active workspace packages, declared in the root `package.json`.
- `vitest` `^3.2.4` - root test framework, configured in `vitest.config.ts`.
- `react` `^19.1.1` and `react-dom` `^19.1.1` - dashboard runtime in `packages/web/package.json`.
- `vite` `^6.4.1` and `@vitejs/plugin-react` `^4.7.0` - dashboard build pipeline in `packages/web/package.json`.
- `ajv` `^8.17.1` and `ajv-formats` `^3.0.1` - JSON schema enforcement against `schema/*.schema.json` from `packages/core/src/validation/schema-validator.ts`.
- `@paperparser/core` - local workspace dependency consumed by `packages/cli`, `packages/mcp`, and `packages/web`, declared as `file:../core` in each package manifest.
- `@paperparser/mcp` - local workspace dependency consumed by `packages/cli`, declared as `file:../mcp` in `packages/cli/package.json`.
- `kuzu` `^0.11.2` - optional graph persistence layer implemented in `packages/core/src/persistence/kuzu-store.ts` and covered by `packages/core/test/kuzu-store.test.ts`.
- `@types/node`, `@types/react`, `@types/react-dom` - type packages declared in the root and `packages/web/package.json`.
## Command Surface
- `npm run build` in the root `package.json` delegates to `npm run build --workspaces --if-present`.
- `npm test` runs `vitest run --config vitest.config.ts`.
- `npm run typecheck` delegates to `npm run typecheck --workspaces --if-present`.
- `npm run lint` is currently an alias for `npm run typecheck`; no separate ESLint/Biome/Prettier command is configured.
- `packages/core/package.json`: `npm run build --workspace @paperparser/core`, `npm run typecheck --workspace @paperparser/core`
- `packages/cli/package.json`: `npm run build --workspace @paperparser/cli`, `npm run typecheck --workspace @paperparser/cli`
- `packages/mcp/package.json`: `npm run build --workspace @paperparser/mcp`, `npm run typecheck --workspace @paperparser/mcp`
- `packages/web/package.json`: `npm run build --workspace @paperparser/web`, `npm run typecheck --workspace @paperparser/web`
## Configuration
- No `.env*` files were detected in the repository root or first-level subdirectories.
- No `process.env.*` reads were detected in the active `packages/` source tree.
- Runtime configuration is flag- and path-based rather than env-based:
- Schema validation defaults to `resolve(process.cwd(), "schema")` in `packages/core/src/validation/schema-validator.ts`, so `schema/` is an active runtime dependency, not just reference documentation.
- Root build/test config lives in `package.json`, `tsconfig.base.json`, `tsconfig.json`, and `vitest.config.ts`.
- Package build config lives in `packages/core/tsconfig.json`, `packages/cli/tsconfig.json`, `packages/mcp/tsconfig.json`, `packages/web/tsconfig.json`, and `packages/web/vite.config.ts`.
- No ESLint, Prettier, Biome, Ruff, `.nvmrc`, or `.python-version` files were detected.
## Platform Requirements
- Node 22.20.0 and npm 10.9.3 are the only explicitly documented prerequisites in `README.md` and `docs/user_guide.md`.
- Root build output goes to `packages/*/dist` for `core`, `cli`, and `mcp`; `packages/web` builds with Vite and can be exported via `packages/cli/src/export.ts`.
- The default local persistence target is `.paperparser-data/`, resolved by `packages/cli/src/store.ts` and `packages/mcp/src/store.ts`.
- `docs/deployment_readiness.md` explicitly limits the current stack to local development, internal demos, static exports, and trusted-network self-hosting.
- Production packaging artifacts are not detected: no `.github/workflows/`, `Dockerfile`, `docker-compose*.yml`, or `Procfile` exists at the repo root.
- Deployment topology is not finalized in code: the Node API server in `packages/cli/src/server.ts` does not also serve the React bundle from `packages/web`.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- Use kebab-case file names for source and tests: `packages/core/src/ingestion/parsers/markdown-parser.ts`, `packages/cli/test/export-command.test.ts`, `packages/web/src/components/data-controls.tsx`.
- Package entrypoints are named `index.ts` or `main.tsx`: `packages/core/src/index.ts`, `packages/mcp/src/index.ts`, `packages/web/src/main.tsx`.
- React component files also stay kebab-case instead of PascalCase: `packages/web/src/components/dashboard-pages.tsx`, `packages/web/src/components/proof-graph-page.tsx`.
- Use camelCase for functions and methods: `analyzeDocumentPath`, `resolveStorePath`, `writeBundleToStore`, `listApiPapers`.
- Verb-prefixed names are the dominant pattern. Reuse the existing verbs before inventing new ones:
- Use camelCase for locals and parameters: `dependentNodes`, `createdDirs`, `fetchMock`, `pendingPaperId`.
- Pluralize array and collection names: `papers`, `results`, `outgoingEdges`, `createdDirs`.
- Use `ALL_CAPS` for exported constants and enum-like value sets: `PAPERPARSER_CLI_NAME`, `PAPERPARSER_MCP_SERVER_NAME`, `SEARCH_MODES`, `KUZU_SCHEMA_STATEMENTS`.
- Use PascalCase for interfaces, classes, and named types: `PaperParserBundle`, `BundleDataControlsProps`, `PaperParserMcpServer`, `SerializedPaperParserBundle`.
- Define enum-like domains with string literal unions backed by `as const` arrays in `packages/core/src/types/*.ts`, for example `packages/core/src/types/node.ts`, `packages/core/src/types/edge.ts`, and `packages/core/src/types/pipeline.ts`.
- Keep branded or domain-specific primitive aliases when a raw string would be ambiguous, as in `NodeId` in `packages/core/src/types/node.ts`.
## Code Style
- No Prettier, Biome, or ESLint config files were detected at the repo root. Formatting is established by existing source, not by a checked-in formatter config.
- Match the current TypeScript style in `packages/cli/src/index.ts`, `packages/core/src/services/bundle-query-service.ts`, and `packages/web/src/App.tsx`:
- Relative imports in `.ts` and `.tsx` files use explicit `.js` suffixes even in source form: `packages/core/src/index.ts`, `packages/web/src/main.tsx`.
- Root `package.json` defines `npm run lint`, but it aliases `npm run typecheck`; there is no separate linter command.
- TypeScript is the effective quality gate. `tsconfig.base.json` enables:
- No `any` usages were found under active source or test files in `packages/core`, `packages/cli`, `packages/mcp`, and `packages/web`.
## Type Safety
- Prefer explicit interfaces and named return types for public surfaces. Representative files: `packages/core/src/types/bundle.ts`, `packages/web/src/lib/dashboard-model.ts`, `packages/mcp/src/server.ts`.
- Use `import type` or inline `type` specifiers for type-only imports, as in `packages/core/src/services/bundle-query-service.ts` and `packages/core/src/validation/schema-validator.ts`.
- Use `as const` and `satisfies` to keep literal types stable instead of widening values. Examples: `packages/core/src/ingestion/parsers/markdown-parser.ts`, `packages/cli/src/store.ts`.
- Keep serialized and runtime shapes separate at boundaries. The current split is:
## Import Organization
- Runtime code depends on sibling workspaces through package names, not direct cross-package relative paths:
- `vitest.config.ts` defines aliases for `@paperparser/core` and `@paperparser/mcp` test resolution.
- No repo-wide `@/` alias or `paths` mapping was detected in `tsconfig.base.json`.
## Error Handling
- Throw `Error` with a concrete message when invariants fail or an input is unsupported:
- At process and request boundaries, catch unknown errors and normalize them with `error instanceof Error ? error.message : String(error)`:
- Silent `catch { return undefined; }` is used only for optional state reads such as `latest.json` in `packages/cli/src/store.ts` and `packages/mcp/src/store.ts`. Do not extend that pattern into parsing, validation, or transport code.
- Fail-fast error branches are preferred over nullable returns in core logic. `BundleQueryService.requireNode()` in `packages/core/src/services/bundle-query-service.ts` is the representative pattern.
## Logging
- Core packages do not log internally; they return typed data or throw errors.
- CLI output is routed through injectable IO in `packages/cli/src/index.ts`:
- No structured logger, log levels, or request logging middleware were detected in `packages/cli/src/server.ts` or `packages/mcp/src/server.ts`.
## Comments
- Comments are rare. Preserve that style by commenting only when the runtime behavior is non-obvious or interoperability-driven.
- The clearest example is the AJV CommonJS/NodeNext interoperability note in `packages/core/src/validation/schema-validator.ts`.
- No `TODO`, `FIXME`, `HACK`, or `XXX` markers were found under active `packages/**` source.
- JSDoc/TSDoc is not part of the current TypeScript package style. Public functions and classes in `packages/core/src`, `packages/cli/src`, `packages/mcp/src`, and `packages/web/src` generally ship without docblocks.
- `AGENT_WORKFLOW.md` asks contributors to document public contracts, but that requirement is not yet reflected consistently in the checked-in TypeScript source. If adding new public APIs, keep documentation short and colocated rather than introducing verbose block comments.
## Function Design
- Small helpers are common, but a few orchestration files are already large:
- New logic should be split into focused helpers before adding more branches to those files.
- Use positional parameters for simple pure helpers such as `resolveStoredPaperId(storePath, explicitPaperId)` in `packages/cli/src/store.ts`.
- Use typed options objects when the callsite needs optional or environment-dependent inputs:
- CLI commands return numeric exit codes from `runCli()` and helper subcommands in `packages/cli/src/index.ts`.
- Service and parsing layers return typed objects or arrays, not `{ ok, error }` unions.
- Async boundaries return `Promise<T>` explicitly. Mixed sync/async behavior is guarded against, for example the async-parser rejection in `packages/core/src/ingestion/pipeline.ts`.
## Module Design
- Each active package has a narrow public entrypoint:
- Internal helpers usually stay file-local; exported symbols are the main class/function/type for a module.
- Barrel exports are used at package boundaries, not throughout every folder.
- `packages/core/src/index.ts` is the main shared barrel consumed by `packages/cli`, `packages/mcp`, and `packages/web`.
- Keep new cross-package dependencies flowing through workspace entrypoints instead of importing sibling package internals directly.
## Package Organization
- `packages/core` contains domain types, parsing, validation, persistence, search, and serialization.
- `packages/cli` wraps core services in CLI commands, store helpers, HTTP handlers, and export logic.
- `packages/mcp` exposes the stored-paper surface over MCP and reuses `@paperparser/core`.
- `packages/web` contains React UI and thin browser-facing data helpers.
- Tests live in sibling `test/` directories, not inside `src/`.
- Put reusable domain logic in `packages/core/src`.
- Keep `packages/cli/src`, `packages/mcp/src`, and `packages/web/src` thin and oriented around transport, IO, or presentation concerns.
## Docs Expectations
- Current behavior is explained more through README and docs than through inline API comments.
- The main contributor-facing references for workflow and quality are `AGENTS.md`, `AGENT_WORKFLOW.md`, and `README.md`.
- When behavior changes, update the nearest user-facing or operator doc rather than relying on source comments alone:
## Repo Workflow Conventions
- The repo-level verification commands documented in `README.md` and `docs/deployment_readiness.md` are:
- Because `npm run lint` is only an alias for typechecking, contributors should treat the three commands above as the real pre-merge baseline.
- Use the npm workspace root defined in `package.json`.
- Active packages are `packages/core`, `packages/cli`, `packages/web`, and `packages/mcp`.
- Package-level `test` scripts are not defined; tests are run from the repo root through `vitest.config.ts`.
- `AGENT_WORKFLOW.md` requires searching existing code and dependencies before adding new code or libraries.
- `AGENT_WORKFLOW.md` also prefers atomic changes, explicit error handling, and strict TypeScript over convenience shortcuts.
- `docs/deployment_readiness.md` states that no `.github/workflows/` CI is currently shipped for the v2 monorepo, so local verification is the effective workflow gate today.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## System Boundaries
- Source documents enter through `packages/cli/src/index.ts` (`analyze`) or `packages/cli/src/server.ts` (`POST /api/papers`).
- Supported alpha inputs are routed from `packages/core/src/ingestion/pipeline.ts` to Markdown and LaTeX parsers. `pdf` is recognized as an input kind in `packages/core/src/types/pipeline.ts`, but `packages/core/src/ingestion/pipeline.ts` throws `PDF ingestion is not implemented in alpha yet.`
- The stable in-repo domain contract is the three-part bundle `manifest`, `graph`, and `index`, defined by `schema/manifest.schema.json`, `schema/graph.schema.json`, `schema/index.schema.json`, and represented in code by `packages/core/src/types/bundle.ts`.
- Every active surface consumes or produces that bundle shape through `packages/core/src/serialization/bundle-serializer.ts`.
- Local CLI output: `packages/cli/src/index.ts`
- Local HTTP API: `packages/cli/src/server.ts`
- Static dashboard bundle export: `packages/cli/src/export.ts`
- React dashboard: `packages/web/src/main.tsx` and `packages/web/src/App.tsx`
- MCP server over stdio: `packages/mcp/src/server.ts`
- The active runtime store is a local filesystem directory resolved to `.paperparser-data/` by `packages/cli/src/store.ts` and `packages/mcp/src/store.ts`.
- Stored papers are materialized as `manifest.json`, `graph.json`, and `index.json` under `.paperparser-data/<paperId>/`, with `.paperparser-data/latest.json` tracking the default paper. This layout is implemented in `packages/cli/src/store.ts`.
- Uploaded API files are staged under `.paperparser-data/_uploads/<paperId>/` before analysis in `packages/cli/src/server.ts`.
- `packages/core/src/persistence/kuzu-store.ts` defines a graph-database persistence adapter and is covered by `packages/core/test/kuzu-store.test.ts`, but no current entry point in `packages/cli/src`, `packages/mcp/src`, or `packages/web/src` imports it.
- `dashboard/`, `tools/`, and `prompts/` remain in the repository as legacy or reference areas per `README.md` and `docs/architecture.md`.
## Pattern Overview
- `packages/core/src` owns parsing, bundle construction, serialization, validation, graph traversal, and query logic.
- `packages/cli/src`, `packages/mcp/src`, and `packages/web/src` are adapters around the same bundle contract rather than separate business-logic stacks.
- Data exchange between packages is file-backed JSON, not a shared service process or database.
## Layers
- Purpose: Define the stable bundle shape and type system used by every package.
- Location: `schema/`, `packages/core/src/types/`, `packages/core/src/serialization/`
- Contains: `PaperParserBundle`, node/edge enums, serialized snake_case JSON mappings, schema files, example bundles.
- Depends on: Local JSON schema files in `schema/`
- Used by: `packages/core/src/validation/`, `packages/cli/src/store.ts`, `packages/mcp/src/store.ts`, `packages/web/src/lib/data-source.ts`, `packages/web/src/lib/dashboard-model.ts`
- Purpose: Convert a document path into parsed mathematical objects plus diagnostics.
- Location: `packages/core/src/ingestion/`
- Contains: Input detection in `packages/core/src/ingestion/pipeline.ts`, Markdown parsing in `packages/core/src/ingestion/parsers/markdown-parser.ts`, LaTeX flattening in `packages/core/src/ingestion/flatten/latex-flattener.ts`, LaTeX parsing in `packages/core/src/ingestion/parsers/latex-parser.ts`, and bundle assembly in `packages/core/src/ingestion/bundle-builder.ts`
- Depends on: Node filesystem/path APIs plus core type definitions in `packages/core/src/types/`
- Used by: CLI analyze flow in `packages/cli/src/index.ts`, HTTP analyze flow in `packages/cli/src/server.ts`, and tests in `packages/core/test/`
- Purpose: Build an in-memory graph from a stored bundle and answer search/context/impact queries.
- Location: `packages/core/src/graph/`, `packages/core/src/search/`, `packages/core/src/services/`
- Contains: `MathKnowledgeGraph` in `packages/core/src/graph/knowledge-graph.ts`, keyword scoring in `packages/core/src/search/keyword-search.ts`, and `BundleQueryService` in `packages/core/src/services/bundle-query-service.ts`
- Depends on: Bundle graph and index data from `packages/core/src/types/bundle.ts`
- Used by: CLI read commands in `packages/cli/src/index.ts`, HTTP query endpoints in `packages/cli/src/server.ts`, and MCP tools in `packages/mcp/src/server.ts`
- Purpose: Enforce schema compliance and internal consistency before bundles are treated as valid outputs.
- Location: `packages/core/src/validation/`
- Contains: AJV-backed schema validation in `packages/core/src/validation/schema-validator.ts` and semantic checks in `packages/core/src/validation/consistency-checker.ts`
- Depends on: `schema/*.schema.json` and serialized bundle shapes from `packages/core/src/serialization/bundle-serializer.ts`
- Used by: CLI `validate` in `packages/cli/src/index.ts`, HTTP `/validate` in `packages/cli/src/server.ts`, MCP `validate_bundle` in `packages/mcp/src/server.ts`, and tests in `packages/core/test/validation.test.ts`
- Purpose: Bridge the core bundle model to the filesystem-backed paper store.
- Location: `packages/core/src/persistence/json-store.ts`, `packages/cli/src/store.ts`, `packages/mcp/src/store.ts`
- Contains: JSON read/write primitives in `packages/core/src/persistence/json-store.ts` and package-specific store helpers for paper ID resolution, listing, and latest-paper selection in `packages/cli/src/store.ts` and `packages/mcp/src/store.ts`
- Depends on: `BundleSerializer` from `packages/core/src/serialization/bundle-serializer.ts`
- Used by: CLI commands, HTTP routes, MCP tools/resources, and static export flow
- Purpose: Expose the same bundle and query capabilities through terminal, HTTP, MCP, and browser UI.
- Location: `packages/cli/src/`, `packages/mcp/src/`, `packages/web/src/`
- Contains: CLI command router in `packages/cli/src/index.ts`, HTTP request handler in `packages/cli/src/server.ts`, MCP JSON-RPC server in `packages/mcp/src/server.ts`, dashboard data loaders in `packages/web/src/lib/`, and React UI in `packages/web/src/components/`
- Depends on: `@paperparser/core`; `packages/cli` also depends on `@paperparser/mcp`
- Used by: End users and agent tooling
## Package Relationships
- Purpose: Shared implementation foundation.
- Examples: `packages/core/src/index.ts`, `packages/core/src/ingestion/pipeline.ts`, `packages/core/src/services/bundle-query-service.ts`
- Pattern: Pure library package; no top-level process entry point
- Purpose: User-facing process entry point for analysis, validation, querying, export, serving, and MCP startup.
- Examples: `packages/cli/src/index.ts`, `packages/cli/src/server.ts`, `packages/cli/src/export.ts`
- Pattern: Thin orchestration package over `@paperparser/core` and `@paperparser/mcp`
- Purpose: MCP-specific transport and resource/tool definitions over the stored bundle backend.
- Examples: `packages/mcp/src/server.ts`, `packages/mcp/src/store.ts`
- Pattern: Transport adapter; delegates bundle work to `@paperparser/core`
- Purpose: Render stored or exported bundle JSON in the browser.
- Examples: `packages/web/src/App.tsx`, `packages/web/src/lib/data-source.ts`, `packages/web/src/lib/dashboard-model.ts`
- Pattern: Read-only client over serialized bundle JSON plus optional upload/list calls to the CLI HTTP server
## Data Flow
- Persistent state is local filesystem state under `.paperparser-data/`, managed by `packages/cli/src/store.ts` and `packages/mcp/src/store.ts`.
- Query state is rebuilt in memory per request by `BundleQueryService` and `MathKnowledgeGraph` in `packages/core/src/services/bundle-query-service.ts` and `packages/core/src/graph/knowledge-graph.ts`.
- Browser UI state is local React component state in `packages/web/src/App.tsx` and `packages/web/src/components/proof-graph-page.tsx`; no global state library is present in `packages/web/src`.
## Key Abstractions
- Purpose: Canonical in-memory representation of a parsed paper bundle.
- Examples: `packages/core/src/types/bundle.ts`, `packages/core/src/serialization/bundle-serializer.ts`
- Pattern: One bundle object with three top-level parts: `manifest`, `graph`, and `index`
- Purpose: Model the ingestion pipeline from raw source path to validated bundle output.
- Examples: `packages/core/src/types/pipeline.ts`, `packages/core/src/ingestion/pipeline.ts`
- Pattern: Staged pipeline types rather than direct parser-to-JSON output
- Purpose: In-memory adjacency/index structure for node/edge traversal.
- Examples: `packages/core/src/graph/knowledge-graph.ts`
- Pattern: Mutable graph object built on top of bundle data for each query session
- Purpose: Package the search, context, and impact operations over a bundle.
- Examples: `packages/core/src/services/bundle-query-service.ts`
- Pattern: Service object that wraps graph creation and exposes read-only query methods
- Purpose: Runtime interchange format between CLI/API/MCP/web and on-disk storage.
- Examples: `packages/core/src/serialization/bundle-serializer.ts`, `packages/core/src/persistence/json-store.ts`, `packages/web/src/lib/data-source.ts`
- Pattern: `camelCase` domain model in TypeScript, `snake_case` persisted JSON at the contract boundary
## Entry Points
- Location: `packages/cli/src/index.ts`
- Triggers: `node packages/cli/dist/index.js ...` and workspace builds from root `package.json`
- Responsibilities: Parse commands, route analyze/read/export/serve/mcp flows, and map failures to exit code `1`
- Location: `packages/cli/src/server.ts`
- Triggers: `paperparser serve` via `runServe` in `packages/cli/src/index.ts`
- Responsibilities: Accept uploads or JSON analyze requests, expose stored bundle parts, and serve query/context/impact/validate endpoints
- Location: `packages/mcp/src/server.ts`
- Triggers: `paperparser mcp` via `runMcp` in `packages/cli/src/index.ts`
- Responsibilities: Expose bundle search/context/impact/validate operations and resource reads over JSON-RPC stdio
- Location: `packages/web/src/main.tsx`
- Triggers: Vite entry from `packages/web/index.html`
- Responsibilities: Mount `App`, choose static or API-backed data loading, and render overview/graph/explorer/innovation/unknowns pages
- Location: `packages/core/src/index.ts`
- Triggers: Imports from `@paperparser/core` in `packages/cli`, `packages/mcp`, `packages/web`, and tests
- Responsibilities: Re-export the domain surface so adapter packages do not reach into deep paths
## Error Handling
- `packages/core/src/ingestion/pipeline.ts`, `packages/core/src/validation/schema-validator.ts`, and `packages/core/src/validation/consistency-checker.ts` throw plain `Error` objects with actionable messages.
- `packages/cli/src/index.ts` catches command failures and writes the message to stderr before returning `1`.
- `packages/cli/src/server.ts` returns structured JSON errors for invalid requests (`400`, `404`, `415`) and wraps unexpected exceptions in a `500` JSON response.
- `packages/mcp/src/server.ts` converts failures into JSON-RPC error objects with code `-32000`.
- `packages/web/src/App.tsx` stores load/upload failures in React state and renders an error card instead of crashing the app shell.
## Cross-Cutting Concerns
- CLI output uses `console.log` and `console.error` through `defaultIo()` in `packages/cli/src/index.ts`.
- No dedicated logging abstraction or structured logger is present in `packages/core/src`, `packages/cli/src`, `packages/mcp/src`, or `packages/web/src`.
- Schema validation lives in `packages/core/src/validation/schema-validator.ts`.
- Semantic consistency checks live in `packages/core/src/validation/consistency-checker.ts`.
- The web client in `packages/web/src` does not run AJV validation; it assumes the stored or API-served JSON already matches the contract.
- `packages/cli/src/server.ts` exposes analyze, list, read, query, context, impact, and validate routes without authentication or authorization checks.
- `packages/mcp/src/server.ts` likewise exposes the local store without auth logic.
- The schema version is hard-coded as `0.2.0` across `packages/core/src/ingestion/bundle-builder.ts`, `packages/core/src/types/bundle.ts`, and the JSON schemas in `schema/`.
- `packages/core/src/validation/consistency-checker.ts` enforces schema-version agreement across bundle parts.
- No background job runner, queue, or worker process is present under `packages/`.
- No shared application service layer exists outside `@paperparser/core`; adapters call core modules directly.
- No server-side persistence backend beyond local JSON storage is wired into the active runtime path.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
