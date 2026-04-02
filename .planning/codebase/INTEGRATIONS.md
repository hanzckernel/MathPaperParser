# External Integrations

**Analysis Date:** 2026-04-02

## APIs & External Services

**Third-party SaaS / cloud APIs:**
- Not detected in the active workspace packages under `packages/`.
- No Stripe, Supabase, AWS SDK, OpenAI, Anthropic, OAuth, or generic HTTP client dependencies were found in `package.json`, `packages/*/package.json`, or active source imports under `packages/`.

**Local HTTP API surface:**
- PaperParser local API - local request/response surface for analyzing papers and reading stored bundle data.
  - Implementation: `packages/cli/src/server.ts` and `packages/cli/src/index.ts`
  - Transport: Node `http` server from `node:http`
  - Request formats: JSON and `multipart/form-data`
  - Auth: none detected

**MCP surface:**
- PaperParser MCP server - local stdio integration for agent clients.
  - Implementation: `packages/mcp/src/server.ts`
  - Transport: JSON-RPC over stdin/stdout with `Content-Length` framing
  - Auth: none detected

## Network Surfaces

**HTTP endpoints exposed by `packages/cli/src/server.ts`:**
- `GET /api/papers`
- `POST /api/papers`
- `GET /api/papers/:paperId/manifest`
- `GET /api/papers/:paperId/graph`
- `GET /api/papers/:paperId/index`
- `GET /api/papers/:paperId/validate`
- `GET /api/papers/:paperId/query?q=...`
- `GET /api/papers/:paperId/context/:nodeId`
- `GET /api/papers/:paperId/impact/:nodeId`

**HTTP request modes:**
- JSON ingest: `POST /api/papers` accepts `{ "inputPath": "...", "paperId": "..." }` and resolves the path on the server in `packages/cli/src/server.ts`.
- Multipart ingest: `POST /api/papers` accepts a `file` upload and optional `paperId`; the uploaded file is written to the local store in `packages/cli/src/server.ts`.

**Browser-side network consumers:**
- `packages/web/src/lib/api-client.ts` calls `POST /api/papers` and `GET /api/papers`.
- `packages/web/src/lib/data-source.ts` fetches either:
  - static files `manifest.json`, `graph.json`, and `index.json`, or
  - API endpoints under `/api/papers/:paperId/*`

**MCP tools exposed by `packages/mcp/src/server.ts`:**
- `query_math_objects`
- `get_context`
- `impact_analysis`
- `trace_proof_chain`
- `search_concepts`
- `validate_bundle`

**MCP resources exposed by `packages/mcp/src/server.ts`:**
- `paperparser://papers`
- `paperparser://papers/{paperId}/graph`
- `paperparser://papers/{paperId}/manifest`
- `paperparser://papers/{paperId}/enrichment`

## Data Storage

**Databases:**
- Primary runtime store: filesystem-backed JSON bundle store
  - Connection: CLI/MCP `--store` flag or default `.paperparser-data`, resolved in `packages/cli/src/store.ts` and `packages/mcp/src/store.ts`
  - Client: `JsonStore` in `packages/core/src/persistence/json-store.ts`
  - Shape: `.paperparser-data/<paper-id>/manifest.json`, `.paperparser-data/<paper-id>/graph.json`, `.paperparser-data/<paper-id>/index.json`, plus `.paperparser-data/latest.json`
- Secondary/optional persistence abstraction: Kuzu graph database
  - Connection: constructor argument to `new KuzuStore(databasePath)` in `packages/core/src/persistence/kuzu-store.ts`
  - Client: `KuzuStore`
  - Current status: exported and tested in `packages/core/test/kuzu-store.test.ts`, but not used by the current CLI/API/MCP flows, which all read from `JsonStore`

**File Storage:**
- Local filesystem only
  - Uploaded files are persisted under `.paperparser-data/_uploads/<paperId>/` in `packages/cli/src/server.ts`
  - Static exports are written to `exports/<paper-id>/` or a caller-provided `--output` path in `packages/cli/src/export.ts`

**Caching:**
- None detected in the active `packages/` source tree

## Filesystem Persistence

**Primary persisted artifacts:**
- `manifest.json`
- `graph.json`
- `index.json`
- `latest.json`

**Write paths in active code:**
- `packages/cli/src/store.ts` writes analyzed bundles and `latest.json`
- `packages/cli/src/export.ts` writes exported dashboard bundle data into `data/`
- `packages/cli/src/server.ts` writes uploaded source documents into `_uploads/`
- `packages/core/src/persistence/json-store.ts` is the shared low-level JSON read/write layer

## Authentication & Identity

**Auth Provider:**
- None
  - Implementation: no auth middleware, API keys, JWT libraries, session storage, or user model is present in the active workspace code

**Authorization:**
- None
  - `docs/deployment_readiness.md` explicitly states that all current API routes are open once the process is reachable

## Monitoring & Observability

**Error Tracking:**
- None detected

**Logs:**
- CLI-style stdout/stderr messages in `packages/cli/src/index.ts`
- MCP errors are returned as JSON-RPC error payloads in `packages/mcp/src/server.ts`
- No structured request logging, health endpoint, readiness endpoint, or metrics endpoint was found; `docs/deployment_readiness.md` calls this out as a missing production surface

## CI/CD & Deployment

**Hosting:**
- Local Node process - `node packages/cli/dist/index.js serve --host 127.0.0.1 --port 3000`
- MCP stdio process - `node packages/cli/dist/index.js mcp`
- Static export - `node packages/cli/dist/index.js export --paper <id> --output <path>`
- Repo guidance in `docs/deployment_readiness.md` limits supported usage to local development, internal demos, static exports, and trusted-network self-hosting

**CI Pipeline:**
- None detected in-repo
- `.github/workflows/` is absent

## Environment Configuration

**Required env vars:**
- Not detected
- Active configuration comes from CLI flags and URL parameters instead:
  - `--store`, `--host`, `--port` in `packages/cli/src/index.ts`
  - `?api=`, `?paper=`, and `?data=` in `packages/web/src/lib/data-source.ts`

**Secrets location:**
- Not applicable in current active workspace code
- No `.env*` files were detected in the repository root or first-level subdirectories

## Webhooks & Callbacks

**Incoming:**
- None
- The HTTP API in `packages/cli/src/server.ts` is a direct request/response surface, not a webhook receiver

**Outgoing:**
- Browser-side `fetch` requests from `packages/web/src/lib/api-client.ts` and `packages/web/src/lib/data-source.ts`
- No server-side outgoing HTTP callbacks or third-party webhook emitters were detected in the active `packages/` code

## Integration Constraints

**Current HTTP/API topology constraints:**
- The Node API server in `packages/cli/src/server.ts` does not serve the React bundle from `packages/web`
- API responses do not add CORS headers, which `docs/deployment_readiness.md` calls out as a current deployment limitation
- `POST /api/papers` JSON mode can instruct the server to read a filesystem path via `inputPath`; that is an active boundary in `packages/cli/src/server.ts`, not just documentation

**Current MCP topology constraints:**
- MCP depends on the same local store resolution logic used by the CLI and API in `packages/mcp/src/store.ts`
- The transport is local stdio only; no websocket or HTTP MCP transport is implemented in `packages/mcp/src/server.ts`

---

*Integration audit: 2026-04-02*
