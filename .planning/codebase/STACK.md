# Technology Stack

**Analysis Date:** 2026-04-02

## Languages

**Primary:**
- TypeScript 5.9.2 - active application and library code across `packages/core/src/**/*.ts`, `packages/cli/src/**/*.ts`, and `packages/mcp/src/**/*.ts`, configured in `package.json`.
- TSX / React JSX - browser UI code in `packages/web/src/App.tsx` and `packages/web/src/main.tsx`, compiled with `packages/web/tsconfig.json`.

**Secondary:**
- JavaScript + Svelte - legacy dashboard package in `dashboard/`, with its own `dashboard/package.json`; it is present in the repo but not part of the root `package.json` workspace list.
- Python - legacy utility scripts in `tools/*.py`; no `pyproject.toml`, `requirements.txt`, `poetry.lock`, or `uv.lock` was detected at the repo root.
- JSON Schema - runtime bundle contracts in `schema/manifest.schema.json`, `schema/graph.schema.json`, and `schema/index.schema.json`, loaded by `packages/core/src/validation/schema-validator.ts`.

## Runtime

**Environment:**
- Node.js v22.20.0 - verified in `README.md` and `docs/user_guide.md`; the CLI/API code also relies on modern Node Web APIs such as `Request`, `Response`, `FormData`, and `File` in `packages/cli/src/server.ts`.
- Browser runtime - required for the React dashboard in `packages/web/`.

**Package Manager:**
- npm 10.9.3 - declared in `package.json` as `packageManager` and repeated in `README.md`.
- Lockfile: `package-lock.json` present at the repository root.

## Workspace Topology

**Active npm workspace root:**
- `package.json` declares `workspaces: ["packages/*"]`.

**Active workspace packages:**
- `packages/core` - shared ingestion, validation, serialization, search, and persistence library.
- `packages/cli` - CLI entrypoint plus the local HTTP API server.
- `packages/mcp` - MCP server exposing the stored-paper/query surface over stdio.
- `packages/web` - React dashboard that reads static bundle JSON or calls the local API.

**Present but outside the active workspace topology:**
- `dashboard/` - legacy Svelte/Vite dashboard with its own package manifest in `dashboard/package.json`.
- `tools/` - legacy Python helper scripts.
- `schema/` - runtime JSON schemas plus examples, consumed by `packages/core/src/validation/schema-validator.ts`.
- `docs/` - operational and product documentation, including `docs/deployment_readiness.md` and `docs/user_guide.md`.

## Frameworks

**Core:**
- npm workspaces - monorepo package orchestration from the root `package.json`.
- TypeScript project references and composite builds - root `tsconfig.json` references `packages/core`, `packages/cli`, and `packages/mcp`; package-level compiler settings live in `packages/*/tsconfig.json`.
- React 19.1.1 - UI framework for `packages/web`, declared in `packages/web/package.json`.
- Vite 6.4.1 with `@vitejs/plugin-react` 4.7.0 - web build toolchain in `packages/web/package.json` and `packages/web/vite.config.ts`.
- Node built-in HTTP server - `createServer` from `node:http` in `packages/cli/src/index.ts`; there is no Express/Fastify/Koa dependency in the active workspace manifests.
- MCP over stdio - custom JSON-RPC framing in `packages/mcp/src/server.ts`.

**Testing:**
- Vitest 3.2.4 - root test runner configured in `vitest.config.ts` and invoked from the root `package.json`.

**Build/Dev:**
- AJV 8.17.1 + `ajv-formats` 3.0.1 - schema validation in `packages/core/src/validation/schema-validator.ts`.
- Kuzu 0.11.2 - graph database adapter in `packages/core/src/persistence/kuzu-store.ts`; it is exported and tested, but the current CLI/API/MCP flows read and write the JSON store instead of Kuzu.

## Key Dependencies

**Critical:**
- `typescript` `^5.9.2` - compiler and type system for all active workspace packages, declared in the root `package.json`.
- `vitest` `^3.2.4` - root test framework, configured in `vitest.config.ts`.
- `react` `^19.1.1` and `react-dom` `^19.1.1` - dashboard runtime in `packages/web/package.json`.
- `vite` `^6.4.1` and `@vitejs/plugin-react` `^4.7.0` - dashboard build pipeline in `packages/web/package.json`.
- `ajv` `^8.17.1` and `ajv-formats` `^3.0.1` - JSON schema enforcement against `schema/*.schema.json` from `packages/core/src/validation/schema-validator.ts`.

**Infrastructure:**
- `@paperparser/core` - local workspace dependency consumed by `packages/cli`, `packages/mcp`, and `packages/web`, declared as `file:../core` in each package manifest.
- `@paperparser/mcp` - local workspace dependency consumed by `packages/cli`, declared as `file:../mcp` in `packages/cli/package.json`.
- `kuzu` `^0.11.2` - optional graph persistence layer implemented in `packages/core/src/persistence/kuzu-store.ts` and covered by `packages/core/test/kuzu-store.test.ts`.
- `@types/node`, `@types/react`, `@types/react-dom` - type packages declared in the root and `packages/web/package.json`.

## Command Surface

**Repository-level install/build/test/typecheck commands:**
```bash
npm install
npm run build
npm test
npm run typecheck
npm run lint
```

- `npm run build` in the root `package.json` delegates to `npm run build --workspaces --if-present`.
- `npm test` runs `vitest run --config vitest.config.ts`.
- `npm run typecheck` delegates to `npm run typecheck --workspaces --if-present`.
- `npm run lint` is currently an alias for `npm run typecheck`; no separate ESLint/Biome/Prettier command is configured.

**Package-level build/typecheck commands:**
- `packages/core/package.json`: `npm run build --workspace @paperparser/core`, `npm run typecheck --workspace @paperparser/core`
- `packages/cli/package.json`: `npm run build --workspace @paperparser/cli`, `npm run typecheck --workspace @paperparser/cli`
- `packages/mcp/package.json`: `npm run build --workspace @paperparser/mcp`, `npm run typecheck --workspace @paperparser/mcp`
- `packages/web/package.json`: `npm run build --workspace @paperparser/web`, `npm run typecheck --workspace @paperparser/web`

**Operational commands documented in current repo docs:**
```bash
node packages/cli/dist/index.js analyze packages/core/test/fixtures/markdown/paper.md
node packages/cli/dist/index.js serve --host 127.0.0.1 --port 3000
node packages/cli/dist/index.js mcp
node packages/cli/dist/index.js export --paper latest --output ./out/paperparser-site
```

These commands are documented in `README.md` and `docs/user_guide.md`.

## Configuration

**Environment:**
- No `.env*` files were detected in the repository root or first-level subdirectories.
- No `process.env.*` reads were detected in the active `packages/` source tree.
- Runtime configuration is flag- and path-based rather than env-based:
  - CLI/API flags `--store`, `--host`, and `--port` are parsed in `packages/cli/src/index.ts`.
  - Web bundle source selection uses URL params `?api=`, `?paper=`, and `?data=` in `packages/web/src/lib/data-source.ts`.
- Schema validation defaults to `resolve(process.cwd(), "schema")` in `packages/core/src/validation/schema-validator.ts`, so `schema/` is an active runtime dependency, not just reference documentation.

**Build:**
- Root build/test config lives in `package.json`, `tsconfig.base.json`, `tsconfig.json`, and `vitest.config.ts`.
- Package build config lives in `packages/core/tsconfig.json`, `packages/cli/tsconfig.json`, `packages/mcp/tsconfig.json`, `packages/web/tsconfig.json`, and `packages/web/vite.config.ts`.
- No ESLint, Prettier, Biome, Ruff, `.nvmrc`, or `.python-version` files were detected.

## Platform Requirements

**Development:**
- Node 22.20.0 and npm 10.9.3 are the only explicitly documented prerequisites in `README.md` and `docs/user_guide.md`.
- Root build output goes to `packages/*/dist` for `core`, `cli`, and `mcp`; `packages/web` builds with Vite and can be exported via `packages/cli/src/export.ts`.
- The default local persistence target is `.paperparser-data/`, resolved by `packages/cli/src/store.ts` and `packages/mcp/src/store.ts`.

**Production:**
- `docs/deployment_readiness.md` explicitly limits the current stack to local development, internal demos, static exports, and trusted-network self-hosting.
- Production packaging artifacts are not detected: no `.github/workflows/`, `Dockerfile`, `docker-compose*.yml`, or `Procfile` exists at the repo root.
- Deployment topology is not finalized in code: the Node API server in `packages/cli/src/server.ts` does not also serve the React bundle from `packages/web`.

---

*Stack analysis: 2026-04-02*
