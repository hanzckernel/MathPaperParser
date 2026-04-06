# PaperParser v2 Alpha

PaperParser is a TypeScript monorepo for extracting a math-paper bundle from source documents and exploring it through a CLI, HTTP API, React dashboard, and MCP server.

Start here for a wiki-style walkthrough of the repo and docs:

- [Project wiki](docs/project_wiki.md)

## Status

As of March 11, 2026, the repo passes:

- `npm run build`
- `npm test`
- `npm run typecheck`

That makes the project usable for local development, static exports, internal alpha evaluation, and one real authenticated Cloud Run deployment path on GCP under active CI/CD hardening. It is **not ready for internet-facing production deployment yet** because rollout automation, deeper upload-throttling, and broader operational hardening are still in progress. The supported shared-deployment path keeps Cloud Run IAM authentication enabled by default. See [docs/deployment_readiness.md](docs/deployment_readiness.md) for the current blockers and the minimum release checklist.

## Supported Inputs

Alpha support today:

- `.md` academic Markdown
- `.tex` entry files
- LaTeX project directories with `main.tex`

Not ready yet:

- `.pdf` ingestion in the v2 TypeScript pipeline

## Quickstart

Verified on March 11, 2026 with Node `v22.20.0` and npm `10.9.3`.

Install dependencies and build everything:

```bash
npm install
npm run build
```

Run the full verification suite:

```bash
npm test
npm run typecheck
```

Run the accepted `v1.3` parse/render proof bundle:

```bash
npm run test:acceptance:v1.3
npm run typecheck
```

The earlier `v1.2` export/runtime proof bundle is still available when you specifically want the hardened static dashboard/export path:

```bash
npm run test:acceptance:v1.2
npm run typecheck
```

The `v1.4` Cloud Run deployment proof bundle is:

```bash
npm run test:acceptance:v1.4
npm run typecheck
```

Analyze a Markdown or LaTeX fixture into the default store `.paperparser-data/`:

```bash
node packages/cli/dist/index.js analyze packages/core/test/fixtures/markdown/paper.md
node packages/cli/dist/index.js analyze packages/core/test/fixtures/latex/project/main.tex --paper fixture-latex
```

Inspect the stored papers:

```bash
node packages/cli/dist/index.js status
node packages/cli/dist/index.js list
node packages/cli/dist/index.js query "main theorem" --paper latest
node packages/cli/dist/index.js context sec1::thm:thm-main --paper latest --json
node packages/cli/dist/index.js impact sec1::thm:thm-main --paper latest --json
```

Validate or export a stored paper:

```bash
node packages/cli/dist/index.js validate --paper latest
node packages/cli/dist/index.js export --paper latest --output ./out/paperparser-site
```

Run the API backend:

```bash
node packages/cli/dist/index.js serve --host 127.0.0.1 --port 3000
```

Bootstrap, build, and inspect the supported Cloud Run deployment path:

```bash
PAPERPARSER_PROJECT=paperparser-492322 PAPERPARSER_REGION=europe-west1 deploy/cloudrun/bootstrap.sh
PAPERPARSER_PROJECT=paperparser-492322 PAPERPARSER_REGION=europe-west1 deploy/cloudrun/build-image.sh
PAPERPARSER_PROJECT=paperparser-492322 PAPERPARSER_REGION=europe-west1 PAPERPARSER_SERVICE=paperparser deploy/cloudrun/service-metadata.sh
```

Deploy the supported shared Cloud Run service with IAM auth still enabled:

```bash
deploy/cloudrun/deploy.sh
```

The supported deployment path mounts a dedicated Cloud Storage bucket into `/var/paperparser/store`; use `/health` and `/ready` for Cloud Run-facing probes and see [deploy/cloudrun/RUNBOOK.md](deploy/cloudrun/RUNBOOK.md) for the full operator flow.

Run the MCP server on stdio:

```bash
node packages/cli/dist/index.js mcp
```

## Main Workflows

### CLI workflow

Use the CLI when you want a local-first pipeline:

1. Analyze a source document into `.paperparser-data/`
2. Validate or query the stored paper
3. Export a static dashboard bundle if needed

### Web dashboard workflow

The React app lives in `packages/web`.

- Static mode reads `./data/manifest.json`, `./data/graph.json`, `./data/index.json`, and `./data/enrichment.json`
- API mode reads from `?api=http://host:port&paper=<paper-id>`
- The supported Cloud Run deployment shape is a combined same-origin service: the CLI server serves the built dashboard shell and the browser binds to the same-origin API automatically
- The supported shared deployment access model is authenticated Cloud Run service access with explicit `roles/run.invoker` grants
- Upload and analyze flows require the `serve` API

Static exports are supported when served over HTTP. Opening the exported dashboard directly from `file://` is intentionally blocked; from the export directory, run `python3 -m http.server 8000` and open the printed local URL instead.

Statement-bearing dashboard views render through bundled MathJax with a small normalization pass for extracted fragments. Unsupported fragments fall back inline to raw source instead of breaking the page.

### MCP workflow

The MCP server exposes the same stored-paper backend to agent tooling over stdio.

## Repository Map

- `packages/core` - bundle types, validation, persistence, ingestion, search, query services
- `packages/cli` - CLI commands plus the HTTP API server
- `packages/web` - React dashboard
- `packages/mcp` - MCP tools and resources
- `schema/` - public bundle contract and examples
- `docs/` - user guide, deployment notes, schema, and architecture

Legacy reference material kept during beta preparation:

- `tools/`
- `dashboard/`
- `prompts/`

## Documentation

- [Comprehensive user guide](docs/user_guide.md)
- [Deployment readiness](docs/deployment_readiness.md)
- [Cloud Run shared-access notes](deploy/cloudrun/README.md)
- [Cloud Run operator runbook](deploy/cloudrun/RUNBOOK.md)
- [Cloud Run smoke proof](deploy/cloudrun/SMOKE.md)
- [Architecture](docs/architecture.md)
- [Schema spec](docs/schema_spec.md)
