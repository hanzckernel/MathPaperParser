# Coding Conventions

**Analysis Date:** 2026-04-02

## Naming Patterns

**Files:**
- Use kebab-case file names for source and tests: `packages/core/src/ingestion/parsers/markdown-parser.ts`, `packages/cli/test/export-command.test.ts`, `packages/web/src/components/data-controls.tsx`.
- Package entrypoints are named `index.ts` or `main.tsx`: `packages/core/src/index.ts`, `packages/mcp/src/index.ts`, `packages/web/src/main.tsx`.
- React component files also stay kebab-case instead of PascalCase: `packages/web/src/components/dashboard-pages.tsx`, `packages/web/src/components/proof-graph-page.tsx`.

**Functions:**
- Use camelCase for functions and methods: `analyzeDocumentPath`, `resolveStorePath`, `writeBundleToStore`, `listApiPapers`.
- Verb-prefixed names are the dominant pattern. Reuse the existing verbs before inventing new ones:
  - `create*`: `createDocumentInput`, `createPaperParserMcpServer`
  - `read*` / `write*`: `readBundleFromStore`, `writeBundleToStore`
  - `parse*`: `parseAcademicMarkdown`, `parseLatexDocument`
  - `build*`: `buildBundleFromParsedDocument`, `buildDashboardModel`
  - `run*`: `runCli`, `runKeywordSearch`
  - `resolve*`: `resolveBundleSource`, `resolveStoredPaperId`

**Variables:**
- Use camelCase for locals and parameters: `dependentNodes`, `createdDirs`, `fetchMock`, `pendingPaperId`.
- Pluralize array and collection names: `papers`, `results`, `outgoingEdges`, `createdDirs`.
- Use `ALL_CAPS` for exported constants and enum-like value sets: `PAPERPARSER_CLI_NAME`, `PAPERPARSER_MCP_SERVER_NAME`, `SEARCH_MODES`, `KUZU_SCHEMA_STATEMENTS`.

**Types:**
- Use PascalCase for interfaces, classes, and named types: `PaperParserBundle`, `BundleDataControlsProps`, `PaperParserMcpServer`, `SerializedPaperParserBundle`.
- Define enum-like domains with string literal unions backed by `as const` arrays in `packages/core/src/types/*.ts`, for example `packages/core/src/types/node.ts`, `packages/core/src/types/edge.ts`, and `packages/core/src/types/pipeline.ts`.
- Keep branded or domain-specific primitive aliases when a raw string would be ambiguous, as in `NodeId` in `packages/core/src/types/node.ts`.

## Code Style

**Formatting:**
- No Prettier, Biome, or ESLint config files were detected at the repo root. Formatting is established by existing source, not by a checked-in formatter config.
- Match the current TypeScript style in `packages/cli/src/index.ts`, `packages/core/src/services/bundle-query-service.ts`, and `packages/web/src/App.tsx`:
  - 2-space indentation
  - single quotes
  - semicolons
  - trailing commas in multiline literals and calls
  - blank lines between import groups and major logical blocks
- Relative imports in `.ts` and `.tsx` files use explicit `.js` suffixes even in source form: `packages/core/src/index.ts`, `packages/web/src/main.tsx`.

**Linting:**
- Root `package.json` defines `npm run lint`, but it aliases `npm run typecheck`; there is no separate linter command.
- TypeScript is the effective quality gate. `tsconfig.base.json` enables:
  - `"strict": true`
  - `"noUncheckedIndexedAccess": true`
  - `"exactOptionalPropertyTypes": true`
  - `"useUnknownInCatchVariables": true`
  - `"isolatedModules": true`
  - `"verbatimModuleSyntax": true`
- No `any` usages were found under active source or test files in `packages/core`, `packages/cli`, `packages/mcp`, and `packages/web`.

## Type Safety

**Expectations:**
- Prefer explicit interfaces and named return types for public surfaces. Representative files: `packages/core/src/types/bundle.ts`, `packages/web/src/lib/dashboard-model.ts`, `packages/mcp/src/server.ts`.
- Use `import type` or inline `type` specifiers for type-only imports, as in `packages/core/src/services/bundle-query-service.ts` and `packages/core/src/validation/schema-validator.ts`.
- Use `as const` and `satisfies` to keep literal types stable instead of widening values. Examples: `packages/core/src/ingestion/parsers/markdown-parser.ts`, `packages/cli/src/store.ts`.
- Keep serialized and runtime shapes separate at boundaries. The current split is:
  - runtime domain types in `packages/core/src/types/*.ts`
  - serialized JSON-facing types in `packages/core/src/serialization/bundle-serializer.ts`

## Import Organization

**Order:**
1. Node built-ins from the `node:` namespace, for example `node:fs`, `node:path`, `node:http`
2. External or workspace packages, for example `react`, `vitest`, `@paperparser/core`, `@paperparser/mcp`
3. Local relative imports with `.js` suffix

**Path Aliases:**
- Runtime code depends on sibling workspaces through package names, not direct cross-package relative paths:
  - `@paperparser/core` in `packages/cli/src/index.ts`, `packages/web/src/lib/data-source.ts`, `packages/mcp/src/server.ts`
  - `@paperparser/mcp` in `packages/cli/src/index.ts`
- `vitest.config.ts` defines aliases for `@paperparser/core` and `@paperparser/mcp` test resolution.
- No repo-wide `@/` alias or `paths` mapping was detected in `tsconfig.base.json`.

## Error Handling

**Patterns:**
- Throw `Error` with a concrete message when invariants fail or an input is unsupported:
  - `packages/core/src/ingestion/pipeline.ts`
  - `packages/core/src/validation/schema-validator.ts`
  - `packages/core/src/graph/knowledge-graph.ts`
  - `packages/mcp/src/server.ts`
- At process and request boundaries, catch unknown errors and normalize them with `error instanceof Error ? error.message : String(error)`:
  - `packages/cli/src/index.ts`
  - `packages/cli/src/server.ts`
  - `packages/mcp/src/server.ts`
- Silent `catch { return undefined; }` is used only for optional state reads such as `latest.json` in `packages/cli/src/store.ts` and `packages/mcp/src/store.ts`. Do not extend that pattern into parsing, validation, or transport code.
- Fail-fast error branches are preferred over nullable returns in core logic. `BundleQueryService.requireNode()` in `packages/core/src/services/bundle-query-service.ts` is the representative pattern.

## Logging

**Framework:** `console` only

**Patterns:**
- Core packages do not log internally; they return typed data or throw errors.
- CLI output is routed through injectable IO in `packages/cli/src/index.ts`:
  - default runtime path uses `console.log` and `console.error`
  - tests pass custom `stdout` and `stderr` callbacks to capture output
- No structured logger, log levels, or request logging middleware were detected in `packages/cli/src/server.ts` or `packages/mcp/src/server.ts`.

## Comments

**When to Comment:**
- Comments are rare. Preserve that style by commenting only when the runtime behavior is non-obvious or interoperability-driven.
- The clearest example is the AJV CommonJS/NodeNext interoperability note in `packages/core/src/validation/schema-validator.ts`.
- No `TODO`, `FIXME`, `HACK`, or `XXX` markers were found under active `packages/**` source.

**JSDoc/TSDoc:**
- JSDoc/TSDoc is not part of the current TypeScript package style. Public functions and classes in `packages/core/src`, `packages/cli/src`, `packages/mcp/src`, and `packages/web/src` generally ship without docblocks.
- `AGENT_WORKFLOW.md` asks contributors to document public contracts, but that requirement is not yet reflected consistently in the checked-in TypeScript source. If adding new public APIs, keep documentation short and colocated rather than introducing verbose block comments.

## Function Design

**Size:**
- Small helpers are common, but a few orchestration files are already large:
  - `packages/core/src/ingestion/parsers/latex-parser.ts`
  - `packages/core/src/serialization/bundle-serializer.ts`
  - `packages/mcp/src/server.ts`
  - `packages/web/src/App.tsx`
- New logic should be split into focused helpers before adding more branches to those files.

**Parameters:**
- Use positional parameters for simple pure helpers such as `resolveStoredPaperId(storePath, explicitPaperId)` in `packages/cli/src/store.ts`.
- Use typed options objects when the callsite needs optional or environment-dependent inputs:
  - `exportStaticDashboard(options)` in `packages/cli/src/export.ts`
  - `createPaperParserRequestHandler(options)` in `packages/cli/src/server.ts`
  - `uploadSourceDocument(baseUrl, options, fetchImpl)` in `packages/web/src/lib/api-client.ts`

**Return Values:**
- CLI commands return numeric exit codes from `runCli()` and helper subcommands in `packages/cli/src/index.ts`.
- Service and parsing layers return typed objects or arrays, not `{ ok, error }` unions.
- Async boundaries return `Promise<T>` explicitly. Mixed sync/async behavior is guarded against, for example the async-parser rejection in `packages/core/src/ingestion/pipeline.ts`.

## Module Design

**Exports:**
- Each active package has a narrow public entrypoint:
  - `packages/core/src/index.ts`
  - `packages/mcp/src/index.ts`
  - `packages/web/src/main.tsx` for app bootstrap
- Internal helpers usually stay file-local; exported symbols are the main class/function/type for a module.

**Barrel Files:**
- Barrel exports are used at package boundaries, not throughout every folder.
- `packages/core/src/index.ts` is the main shared barrel consumed by `packages/cli`, `packages/mcp`, and `packages/web`.
- Keep new cross-package dependencies flowing through workspace entrypoints instead of importing sibling package internals directly.

## Package Organization

**Pattern:**
- `packages/core` contains domain types, parsing, validation, persistence, search, and serialization.
- `packages/cli` wraps core services in CLI commands, store helpers, HTTP handlers, and export logic.
- `packages/mcp` exposes the stored-paper surface over MCP and reuses `@paperparser/core`.
- `packages/web` contains React UI and thin browser-facing data helpers.
- Tests live in sibling `test/` directories, not inside `src/`.

**Practical Rule:**
- Put reusable domain logic in `packages/core/src`.
- Keep `packages/cli/src`, `packages/mcp/src`, and `packages/web/src` thin and oriented around transport, IO, or presentation concerns.

## Docs Expectations

**Observed State:**
- Current behavior is explained more through README and docs than through inline API comments.
- The main contributor-facing references for workflow and quality are `AGENTS.md`, `AGENT_WORKFLOW.md`, and `README.md`.

**Working Convention:**
- When behavior changes, update the nearest user-facing or operator doc rather than relying on source comments alone:
  - `README.md` for high-level workflows and commands
  - `docs/user_guide.md` for user procedures
  - `docs/deployment_readiness.md` for operational limitations

## Repo Workflow Conventions

**Expected Local Checks:**
- The repo-level verification commands documented in `README.md` and `docs/deployment_readiness.md` are:
  - `npm run build`
  - `npm test`
  - `npm run typecheck`
- Because `npm run lint` is only an alias for typechecking, contributors should treat the three commands above as the real pre-merge baseline.

**Package Manager and Workspace Flow:**
- Use the npm workspace root defined in `package.json`.
- Active packages are `packages/core`, `packages/cli`, `packages/web`, and `packages/mcp`.
- Package-level `test` scripts are not defined; tests are run from the repo root through `vitest.config.ts`.

**Process Rules From Project Instructions:**
- `AGENT_WORKFLOW.md` requires searching existing code and dependencies before adding new code or libraries.
- `AGENT_WORKFLOW.md` also prefers atomic changes, explicit error handling, and strict TypeScript over convenience shortcuts.
- `docs/deployment_readiness.md` states that no `.github/workflows/` CI is currently shipped for the v2 monorepo, so local verification is the effective workflow gate today.

---

*Convention analysis: 2026-04-02*
