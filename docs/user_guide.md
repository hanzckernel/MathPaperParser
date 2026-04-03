# PaperParser User Guide

## 1. What PaperParser Does

PaperParser turns a math paper into a structured bundle with three JSON artifacts:

- `manifest.json` for paper metadata
- `graph.json` for the extracted mathematical objects and relations
- `index.json` for summaries, main results, innovation notes, unknowns, and search-oriented views

That bundle can then be used through:

- the CLI
- the HTTP API
- the React dashboard
- the MCP server

## 2. Current Alpha Scope

### Supported now

- academic Markdown files ending in `.md`
- LaTeX entry files ending in `.tex`
- LaTeX project directories that contain `main.tex`

### Not shipped in v2 alpha

- production-ready PDF ingestion

If you provide a PDF to the current TypeScript pipeline, it will fail with a clear "not implemented in alpha yet" error.

## 3. Prerequisites

Verified locally on March 11, 2026 with:

- Node `v22.20.0`
- npm `10.9.3`

Install dependencies from the repo root:

```bash
npm install
```

Build all workspaces:

```bash
npm run build
```

Recommended verification before real use:

```bash
npm test
npm run typecheck
```

## 4. Repository Layout

- `packages/core` - ingestion, schema validation, persistence, graph/query services
- `packages/cli` - command-line interface and HTTP server
- `packages/web` - React dashboard
- `packages/mcp` - MCP tools and resources
- `schema/` - public schema and examples
- `docs/` - architecture, schema, deployment, and workflow docs

Legacy reference material kept in the repo:

- `dashboard/`
- `tools/`
- `prompts/`

The default v2 workflow is the TypeScript monorepo under `packages/`.

## 5. The Local Store

By default, analyzed papers are stored in:

```text
.paperparser-data/
```

Each paper lives under:

```text
.paperparser-data/<paper-id>/
```

with:

- `manifest.json`
- `graph.json`
- `index.json`

The store also maintains:

```text
.paperparser-data/latest.json
```

to track the most recently analyzed paper.

Override the store path with:

```bash
--store /path/to/store
```

## 6. CLI Guide

The repo currently uses the built file directly:

```bash
node packages/cli/dist/index.js <command>
```

### Analyze a paper

Markdown example:

```bash
node packages/cli/dist/index.js analyze packages/core/test/fixtures/markdown/paper.md
```

LaTeX example:

```bash
node packages/cli/dist/index.js analyze packages/core/test/fixtures/latex/project/main.tex --paper fixture-latex
```

Analyze into a custom store:

```bash
node packages/cli/dist/index.js analyze ./papers/my-paper.tex --store ./tmp/paper-store --paper my-paper
```

### Check store status

```bash
node packages/cli/dist/index.js status
```

### List stored papers

Human-readable:

```bash
node packages/cli/dist/index.js list
```

JSON:

```bash
node packages/cli/dist/index.js list --json
```

### Validate a stored paper

```bash
node packages/cli/dist/index.js validate --paper latest
```

JSON output:

```bash
node packages/cli/dist/index.js validate --paper latest --json
```

### Query a stored paper

```bash
node packages/cli/dist/index.js query "compactness theorem" --paper latest
```

JSON output:

```bash
node packages/cli/dist/index.js query "compactness theorem" --paper latest --json
```

### Inspect context for a node

```bash
node packages/cli/dist/index.js context sec1::thm:thm-main --paper latest --json
```

### Inspect reverse impact for a node

```bash
node packages/cli/dist/index.js impact sec1::thm:thm-main --paper latest --json
```

### Export a static dashboard bundle

```bash
node packages/cli/dist/index.js export --paper latest --output ./out/paperparser-site
```

By default, export output goes to:

```text
exports/<paper-id>/
```

The exported site contains the built React app plus:

```text
data/manifest.json
data/graph.json
data/index.json
data/enrichment.json
```

`data/enrichment.json` is always present. If no enrichment sidecar exists in the store, the file contains explicit JSON `null`.

## 7. HTTP API Guide

Start the server:

```bash
node packages/cli/dist/index.js serve --host 127.0.0.1 --port 3000
```

Default behavior is intentionally local-first. The default host is `127.0.0.1`.

### Endpoints

List papers:

```text
GET /api/papers
```

Analyze by file upload:

```text
POST /api/papers
Content-Type: multipart/form-data
```

Analyze by server-side path:

```text
POST /api/papers
Content-Type: application/json
```

Body:

```json
{
  "inputPath": "packages/core/test/fixtures/markdown/paper.md",
  "paperId": "fixture-markdown"
}
```

Read bundle parts:

```text
GET /api/papers/:paperId/manifest
GET /api/papers/:paperId/graph
GET /api/papers/:paperId/index
```

Validate:

```text
GET /api/papers/:paperId/validate
```

Search:

```text
GET /api/papers/:paperId/query?q=compact
```

Context:

```text
GET /api/papers/:paperId/context/:nodeId
```

Impact:

```text
GET /api/papers/:paperId/impact/:nodeId
```

### Example with `curl`

Upload a Markdown paper:

```bash
curl -X POST http://127.0.0.1:3000/api/papers \
  -F "paperId=demo-markdown" \
  -F "file=@packages/core/test/fixtures/markdown/paper.md"
```

List papers:

```bash
curl http://127.0.0.1:3000/api/papers
```

Query the latest uploaded paper by id:

```bash
curl "http://127.0.0.1:3000/api/papers/demo-markdown/query?q=theorem"
```

## 8. React Dashboard Guide

The current web app lives in `packages/web`.

### Static mode

Build a static export first:

```bash
node packages/cli/dist/index.js export --paper latest --output ./out/paperparser-site
```

Then serve the exported directory with any static file server.

Do **not** open the exported dashboard directly from `file://`. Static exports are supported over HTTP only because the dashboard loads JSON data via `fetch()`.

Example:

```bash
cd ./out/paperparser-site
python3 -m http.server 8000
```

The dashboard will read:

- `./data/manifest.json`
- `./data/graph.json`
- `./data/index.json`
- `./data/enrichment.json`

Statement-bearing reading surfaces render through bundled MathJax after a small normalization pass that repairs common extracted fragments such as hard line breaks and simple package-dependent references. If a fragment still cannot be normalized safely, the dashboard shows an inline raw-source fallback block instead of breaking the page.

### API mode

If the API server is running, the dashboard can load from it by URL parameters:

```text
?api=http://127.0.0.1:3000&paper=fixture-latex
```

If `paper` is omitted, the app falls back to `latest`.

### Upload flow

The upload controls in the React app send a multipart request to `POST /api/papers`.

Practical note:

- `.md` and `.tex` are the alpha path
- `.pdf` remains visible in the UI as a beta target and is not a working v2 alpha ingestion path

## 9. MCP Guide

Start the MCP server on stdio:

```bash
node packages/cli/dist/index.js mcp
```

The MCP server reads from the same store as the CLI and API. If you want a non-default store, pass `--store`.

Example:

```bash
node packages/cli/dist/index.js mcp --store ./tmp/paper-store
```

## 10. Recommended Workflows

### Fastest local workflow

1. `npm run build`
2. `node packages/cli/dist/index.js analyze <input>`
3. `node packages/cli/dist/index.js export --paper latest --output ./out/site`
4. `cd ./out/site && python3 -m http.server 8000`
5. Open the printed local URL in your browser

### Accepted v1.2 proof workflow

Run the focused regression bundle for the hardened export/dashboard path:

```bash
npm run test:acceptance:v1.2
npm run typecheck
```

### API-backed workflow

1. `npm run build`
2. `node packages/cli/dist/index.js serve --host 127.0.0.1 --port 3000`
3. Upload a paper through the API or dashboard
4. Point the dashboard at `?api=http://127.0.0.1:3000`

### Agent workflow

1. Analyze a paper into the store
2. Start `node packages/cli/dist/index.js mcp`
3. Connect an MCP client to query the same stored bundle

## 11. Troubleshooting

### "Unsupported document input"

Cause:

- the file extension is not recognized by the v2 pipeline

Fix:

- use `.md`
- use `.tex`
- use a LaTeX project directory

### "PDF ingestion is not implemented in alpha yet."

Cause:

- PDF is still a beta target for the v2 TypeScript pipeline

Fix:

- use Markdown or LaTeX for the v2 alpha flow

### "No stored paper found"

Cause:

- the store does not contain `latest.json`
- the requested `paperId` does not exist

Fix:

1. run `analyze` first
2. run `list --json` to inspect available paper ids

### Export fails because the web app is missing

Cause:

- dependencies were not installed
- the workspace build has not completed cleanly

Fix:

```bash
npm install
npm run build
```

### Dashboard cannot load API data

Check:

1. the API server is actually running
2. the `api` query parameter points at the correct base URL
3. the requested `paper` id exists
4. your deployment topology is same-origin or explicitly configured for browser access

### Static export opened from `file://`

Cause:

- static exports are supported over HTTP, not direct file loading

Fix:

```bash
cd ./out/paperparser-site
python3 -m http.server 8000
```

## 12. Deployment Guidance

For the current state of the project:

- use static exports for the safest sharing model
- use `serve` only on trusted networks
- do not expose the current API server directly to the public internet

Read [deployment_readiness.md](deployment_readiness.md) before planning a shared deployment.

## 13. Related Docs

- [Deployment readiness](deployment_readiness.md)
- [Architecture](architecture.md)
- [Schema spec](schema_spec.md)
