# Codebase Concerns

**Analysis Date:** 2026-04-02

## Tech Debt

**Dual-stack product surface remains active in one repository:**
- Issue: The v2 TypeScript monorepo is the active path, but `README.md`, `docs/architecture.md`, `docs/prompt_protocol.md`, `docs/phase3_runbook.md`, `docs/phase4_runbook.md`, and `docs/phase5_runbook.md` still direct users through legacy Python helpers in `tools/`, the legacy Svelte app in `dashboard/`, and manual-review assets in `prompts/`.
- Files: `README.md`, `docs/architecture.md`, `docs/prompt_protocol.md`, `docs/phase3_runbook.md`, `docs/phase4_runbook.md`, `docs/phase5_runbook.md`, `tools/`, `dashboard/`, `prompts/`
- Impact: Future phases can easily target the wrong stack, duplicate functionality, or preserve old operational assumptions after the v2 cutover.
- Fix approach: Split docs into clearly labeled `v2` vs `legacy` tracks, move legacy runbooks behind a dedicated legacy index, and keep only the active TypeScript operator path in top-level docs.

**Kuzu persistence is exported but not wired into the active runtime:**
- Issue: `KuzuStore` is exported from `packages/core/src/index.ts`, the dependency is shipped in `packages/core/package.json`, and schema tables are defined in `packages/core/src/persistence/kuzu-schema.ts`, but the CLI/API/MCP runtime paths use JSON files through `packages/cli/src/store.ts`, `packages/mcp/src/store.ts`, and `packages/core/src/persistence/json-store.ts`.
- Files: `packages/core/src/index.ts`, `packages/core/src/persistence/kuzu-store.ts`, `packages/core/src/persistence/kuzu-schema.ts`, `packages/core/package.json`, `packages/cli/src/store.ts`, `packages/mcp/src/store.ts`, `packages/core/src/persistence/json-store.ts`
- Impact: The project pays the install and maintenance cost of a native graph-store dependency without getting production value from it, and future contributors can assume graph-backed capabilities that are not actually used.
- Fix approach: Either remove `kuzu` from the default runtime until it is the real backing store, or finish the integration and document which surfaces persist to Kuzu versus JSON.

**Kuzu schema shape and Kuzu write/read behavior are only partially implemented:**
- Issue: `packages/core/src/persistence/kuzu-schema.ts` defines `Section`, `Cluster`, `IN_SECTION`, and `MEMBER_OF`, but `packages/core/src/persistence/kuzu-store.ts` only writes `Paper`, `MathObject`, `BELONGS_TO`, and `MathRelation`. It also uses `bundle.manifest.paper.title` as the Kuzu primary key.
- Files: `packages/core/src/persistence/kuzu-schema.ts`, `packages/core/src/persistence/kuzu-store.ts`
- Impact: Graph queries built against section/cluster tables will fail or return incomplete data, and duplicate paper titles will collide at the database layer.
- Fix approach: Define a stable paper identifier distinct from title, populate all schema tables that are part of the contract, or delete unused schema elements until they are implemented.

## Known Bugs

**Nested LaTeX includes and asset paths are resolved from the entry root instead of the including file directory:**
- Symptoms: A nested `\input{...}` inside a subdirectory file can fail to resolve even when the relative path is valid from that file. The same root-based resolution is used for bibliography and graphics checks.
- Files: `packages/core/src/ingestion/flatten/latex-flattener.ts`, `packages/core/test/latex-flattener.test.ts`, `packages/core/test/ingestion-pipeline.test.ts`
- Trigger: A project where `main.tex` includes `sections/prelim.tex` and `sections/prelim.tex` includes `subdir/child.tex`, or references assets relative to `sections/`.
- Workaround: Keep includes and asset references rooted at the entry directory, or flatten the project externally before ingestion.

**MCP stdio framing is byte-counted on write but character-counted on read:**
- Symptoms: The MCP server can desynchronize request framing when incoming JSON-RPC payloads contain non-ASCII text.
- Files: `packages/mcp/src/server.ts`
- Trigger: Any MCP client request where `Content-Length` counts UTF-8 bytes but the server compares that length against a JavaScript string buffer created by `stdin.setEncoding('utf8')`.
- Workaround: Keep MCP payloads ASCII-only until the reader is rewritten around `Buffer` arithmetic.

**Uploaded files and stored bundles can be overwritten by identifier collisions:**
- Symptoms: Reusing a `paperId`, or uploading the same filename into the same `paperId`, replaces prior contents in place.
- Files: `packages/cli/src/server.ts`, `packages/cli/src/store.ts`
- Trigger: Repeated `POST /api/papers` calls with the same explicit `paperId`, or different inputs that slugify to the same identifier.
- Workaround: Use unique paper IDs manually and avoid concurrent writes to the same store.

## Security Considerations

**Remote file-read capability exists on the JSON ingest route:**
- Risk: `POST /api/papers` accepts `{"inputPath": ...}` and resolves that path on the server filesystem, which is safe for localhost tooling but unsafe for untrusted clients.
- Files: `packages/cli/src/server.ts`, `packages/cli/src/index.ts`, `docs/deployment_readiness.md`
- Current mitigation: `packages/cli/src/index.ts` defaults `serve` to `127.0.0.1`, and `docs/deployment_readiness.md` explicitly says not to expose the current server to the public internet.
- Recommendations: Remove the JSON path-ingest route from any shared deployment, or replace it with a tightly controlled allowlist plus authenticated upload-only ingestion.

**Upload and request handling are unbounded and memory-buffered:**
- Risk: `readBody(...)` buffers the full HTTP body, `request.formData()` materializes multipart content, and `persistUploadedFile(...)` calls `file.arrayBuffer()` before writing to disk. There are no request-size, upload-size, concurrency, or rate-limit checks.
- Files: `packages/cli/src/server.ts`, `docs/deployment_readiness.md`
- Current mitigation: None in code beyond the assumption of trusted-network or localhost use.
- Recommendations: Add size limits before buffering, switch uploads to streaming writes, add per-client rate limits, and reject unsupported media types before materialization.

**All API data routes are unauthenticated and error messages are reflected directly:**
- Risk: Any reachable client can list papers and read full bundle JSON, and server-thrown messages are returned in `500` responses, which can expose local file paths or implementation details.
- Files: `packages/cli/src/server.ts`, `docs/deployment_readiness.md`
- Current mitigation: None in code; the only operational mitigation is to keep the service on trusted networks.
- Recommendations: Add authentication/authorization before exposing the service outside localhost, and replace raw error reflection with structured server-side logging plus generic client-safe errors.

## Performance Bottlenecks

**Serving and MCP reads are built on synchronous filesystem I/O and whole-bundle JSON loads:**
- Problem: Listing papers, reading bundle parts, validation, query/context/impact endpoints, and MCP resource/tool calls all rely on `readFileSync`, `readdirSync`, `statSync`, and full JSON parsing.
- Files: `packages/cli/src/store.ts`, `packages/mcp/src/store.ts`, `packages/core/src/persistence/json-store.ts`, `packages/cli/src/server.ts`
- Cause: The storage layer is optimized for local simplicity, not concurrent serving. Each request blocks the event loop and reloads full bundle files.
- Improvement path: Move hot read paths to async I/O, cache parsed bundle metadata, and introduce a storage abstraction that can serve metadata without reloading entire graphs.

**Static export shells out to a full web build on every export request:**
- Problem: `exportStaticDashboard(...)` synchronously runs `npm run build --workspace @paperparser/web` every time a paper is exported.
- Files: `packages/cli/src/export.ts`, `packages/web/package.json`
- Cause: The export path couples runtime export to the development build toolchain instead of reusing a prebuilt asset bundle.
- Improvement path: Prebuild the web app once per release, copy immutable assets during export, and reserve full Vite builds for development or release packaging.

**The graph page recomputes layout and filter results on every render and renders the entire graph in the DOM:**
- Problem: `GraphPage` rebuilds filtered node and edge lists, sorts nodes, recomputes layout positions, and sizes the SVG proportionally to the whole graph on each render.
- Files: `packages/web/src/components/proof-graph-page.tsx`, `packages/web/src/lib/dashboard-model.ts`
- Cause: The page is implemented as a single render-pass layout with no virtualization, no incremental layout, and no memoized large-data transforms.
- Improvement path: Memoize expensive transforms, paginate or virtualize side panels, and move large-graph rendering to a canvas/WebGL or worker-backed layout if papers get materially larger.

## Fragile Areas

**The ingestion stack is heavily heuristic and concentrated in a few large files:**
- Files: `packages/core/src/ingestion/parsers/latex-parser.ts`, `packages/core/src/ingestion/parsers/markdown-parser.ts`, `packages/core/src/ingestion/bundle-builder.ts`, `packages/core/src/serialization/bundle-serializer.ts`
- Why fragile: `latex-parser.ts` and `markdown-parser.ts` encode parsing with regexes and hand-rolled text rules rather than real LaTeX/Markdown/YAML parsers. The files are also among the largest source files in the active codebase, so changes can easily affect multiple concerns at once.
- Safe modification: Add narrowly scoped fixtures before changing parser rules, and isolate new syntax handling behind dedicated helpers instead of growing the main parser loops.
- Test coverage: `packages/core/test/markdown-parser.test.ts`, `packages/core/test/latex-flattener.test.ts`, and `packages/core/test/ingestion-pipeline.test.ts` cover one Markdown fixture and one LaTeX fixture, not a broad corpus of real-paper edge cases.

**Store semantics are single-user and non-transactional:**
- Files: `packages/cli/src/store.ts`, `packages/cli/src/server.ts`, `packages/mcp/src/store.ts`
- Why fragile: Bundles are written directly to final paths with `writeFileSync`, `latest.json` is rewritten in place, there is no temp-file swap or lock, and `_uploads/` is append-only with no cleanup path.
- Safe modification: Introduce atomic temp writes plus rename, versioned bundle directories, and explicit retention/cleanup rules before adding concurrency or long-running services.
- Test coverage: Existing tests in `packages/cli/test/analyze-command.test.ts` and `packages/cli/test/serve-app.test.ts` exercise happy paths only; they do not cover concurrent writers, partial writes, or duplicate IDs.

**The dashboard advertises a file type that the backend intentionally rejects:**
- Files: `packages/web/src/components/data-controls.tsx`, `packages/core/src/ingestion/pipeline.ts`, `docs/user_guide.md`
- Why fragile: The upload control accepts `.pdf`, but the ingestion pipeline throws `PDF ingestion is not implemented in alpha yet.` This is documented, but the UI still invites users into a failing path.
- Safe modification: Either hide `.pdf` uploads outside beta builds or gate the control behind a clearly disabled state with an explicit beta flag.
- Test coverage: Web tests confirm the control renders, but there is no end-to-end test covering the user-visible PDF failure path.

## Scaling Limits

**The current service boundary is local-first, not internet-scale:**
- Current capacity: `docs/deployment_readiness.md` only claims readiness for local development, internal demos, static exports, and controlled self-hosting on trusted networks.
- Limit: Public exposure breaks on unauthenticated routes, unbounded memory buffering, lack of health/readiness endpoints, and event-loop blocking file I/O.
- Scaling path: Add auth, streaming uploads, async storage access, health endpoints, request metrics, and a supported deployment topology before treating `serve` as a multi-user service.

**The bundle format scales by loading everything at once:**
- Current capacity: `manifest.json`, `graph.json`, and `index.json` are always read as whole files from disk through `packages/core/src/persistence/json-store.ts`.
- Limit: Large graphs will increase latency, memory pressure, and validation/query cost because there is no chunking or partial retrieval layer.
- Scaling path: Separate summary metadata from graph bodies, add indexed or database-backed reads for query-heavy operations, and stream large exports instead of materializing them repeatedly.

## Dependencies at Risk

**`kuzu` is a native dependency without a complete production role yet:**
- Risk: `packages/core/package.json` ships `kuzu`, but the main CLI/API/MCP path does not depend on it and the Kuzu model is only partially populated.
- Impact: Local setup inherits native dependency complexity, and future contributors can spend time debugging or extending a backend that is not on the critical path.
- Migration plan: Either make Kuzu the documented primary store with full schema coverage and runtime integration, or remove it from the default dependency set until graph-backed storage is a committed direction.

## Missing Critical Features

**PDF ingestion is still absent from the v2 pipeline:**
- Problem: The ingestion pipeline recognizes `.pdf` and immediately throws an explicit not-implemented error.
- Blocks: A complete end-to-end paper ingestion story for the file type most likely to matter in real deployments.
- Files: `packages/core/src/ingestion/pipeline.ts`, `packages/web/src/components/data-controls.tsx`, `README.md`, `docs/deployment_readiness.md`, `docs/user_guide.md`

**There is no production deployment package or CI surface in-repo:**
- Problem: No `.github/workflows/`, `Dockerfile`, `docker-compose.yml`, `docker-compose.yaml`, or `Procfile` were detected in the repository scan, and the API route table has no `/healthz` or `/readyz`.
- Blocks: Reproducible builds, health-checked deployments, and a documented operator path for upgrades or rollback.
- Files: `docs/deployment_readiness.md`, `packages/cli/src/server.ts`

**There is no configuration contract for externalized operations:**
- Problem: No `.env`, `.env.*`, or `*.env` files were detected, and no `process.env` or `import.meta.env` reads were detected under `packages/`.
- Blocks: A clear model for secrets, auth providers, deployment-time configuration, or environment-specific behavior.
- Files: `packages/`, `README.md`, `docs/`

## Test Coverage Gaps

**Relative-path LaTeX edge cases are untested:**
- What's not tested: Nested `\input{...}` resolution from included subdirectories, plus bibliography and graphics references relative to included files.
- Files: `packages/core/src/ingestion/flatten/latex-flattener.ts`, `packages/core/test/latex-flattener.test.ts`, `packages/core/test/ingestion-pipeline.test.ts`
- Risk: Real-world LaTeX projects can silently fail or emit missing-input warnings even when their directory structure is valid.
- Priority: High

**API hardening and storage-failure scenarios are untested:**
- What's not tested: Request-size limits, malformed multipart bodies, duplicate paper IDs, concurrent writes, partial write recovery, upload retention/cleanup, and public-network abuse cases.
- Files: `packages/cli/src/server.ts`, `packages/cli/src/store.ts`, `packages/cli/test/serve-app.test.ts`
- Risk: Production-facing bugs will surface only under load or adversarial input, not during the current happy-path suite.
- Priority: High

**MCP protocol edge cases are untested:**
- What's not tested: Non-ASCII framing, partial frame delivery, malformed `Content-Length` handling, and multiple back-to-back requests with multibyte payloads.
- Files: `packages/mcp/src/server.ts`, `packages/mcp/test/server.test.ts`
- Risk: Agent integrations can fail intermittently on real-world inputs even if the current ASCII fixture tests pass.
- Priority: High

**Dashboard scaling and deployment topology are untested:**
- What's not tested: Large-graph rendering behavior, browser/API cross-origin deployment, and the user-visible PDF upload failure path.
- Files: `packages/web/src/components/proof-graph-page.tsx`, `packages/web/src/App.tsx`, `packages/web/src/components/data-controls.tsx`, `packages/web/test/`
- Risk: UI regressions and deployment breakage are likely to appear only after larger datasets or real browser hosting are introduced.
- Priority: Medium

## Unknowns

- No benchmark, load-test, or soak-test artifacts were detected under `packages/*/test`, so current performance ceilings are undocumented.
- No secret-management or environment-contract files were detected in the repository scan, so the intended production configuration model is still unclear.
- The repository documents a future beta cutover away from legacy assets, but no single source of truth defines when `tools/`, `dashboard/`, and `prompts/` stop being operational dependencies versus reference material.

---

*Concerns audit: 2026-04-02*
