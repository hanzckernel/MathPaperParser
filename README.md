# PaperParser v2 Alpha

PaperParser is a TypeScript monorepo for extracting a math-paper bundle from source documents and exploring it through a CLI, API, React dashboard, and MCP server.

**Alpha scope**
- Robust `.tex` and `.md` ingestion
- Shared bundle contract at schema `0.2.0`
- CLI for analyze/query/context/impact/validate/export/serve/mcp
- React dashboard that loads static exports or the `serve` API
- MCP tools/resources over the same stored-paper backend

**Beta scope**
- Robust `.pdf` ingestion on the same contract and product surfaces

## Quickstart

Install and build:

```bash
npm install
npm run build
```

Analyze a tracked Markdown or LaTeX fixture into the default store `.paperparser-data/`:

```bash
node packages/cli/dist/index.js analyze packages/core/test/fixtures/markdown/paper.md
node packages/cli/dist/index.js analyze packages/core/test/fixtures/latex/project/main.tex --paper fixture-latex
```

Inspect stored papers:

```bash
node packages/cli/dist/index.js list
node packages/cli/dist/index.js status
node packages/cli/dist/index.js query "main theorem" --paper latest
node packages/cli/dist/index.js context sec1::thm:thm-main --paper latest --json
node packages/cli/dist/index.js impact sec1::thm:thm-main --paper latest --json
```

Validate or export a stored paper:

```bash
node packages/cli/dist/index.js validate --paper latest
node packages/cli/dist/index.js export --paper latest --output ./out/paperparser-site
```

Run the API backend for uploads, queries, and the dashboard:

```bash
node packages/cli/dist/index.js serve --host 127.0.0.1 --port 3000
```

Run the MCP server on stdio:

```bash
node packages/cli/dist/index.js mcp
```

## Data Outputs

Each analyzed paper is stored under `.paperparser-data/<paper-id>/` with:

- `manifest.json`
- `graph.json`
- `index.json`

The `export` command writes those same files to `data/` inside a static dashboard bundle.

## Web App

The React app lives in `packages/web`.

- Static export mode reads `./data/{manifest,graph,index}.json`
- API mode reads `?api=http://host:port&paper=<paper-id>`
- `.tex` and `.md` upload/analyze flows go through `serve`
- `.pdf` is visible in the UI but remains a beta ingestion target

## Repo Map

- `packages/core` — bundle types, validation, persistence, ingestion, search, query services
- `packages/cli` — `paperparser` command surface and HTTP backend
- `packages/web` — React dashboard
- `packages/mcp` — MCP tools/resources over stored papers
- `schema/` — public bundle contract and examples
- `docs/` — architecture, schema, and protocol references

## Legacy Reference Material

The following paths remain in the repo as reference implementations while beta work continues:

- `tools/` — legacy Python helpers
- `dashboard/` — legacy Svelte dashboard
- `prompts/` — prompt-suite workflow for older manual review flows

They are no longer the default TeX/Markdown workflow in v2 alpha.
