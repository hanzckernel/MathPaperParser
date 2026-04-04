# PaperParser Project Wiki

This page is the shortest route through the repo.

If you are new here, start with the questions below rather than opening files at random.

## What PaperParser Is

PaperParser turns a math paper into a deterministic bundle of structured artifacts:

- `manifest.json`
- `graph.json`
- `index.json`

That bundle can then be used through:

- the CLI
- the HTTP API
- the React dashboard
- the MCP server

For the release-oriented summary and quickstart commands, go back to [README.md](../README.md).

## Choose Your Path

### I want to understand the product

Start with:

- [README.md](../README.md)
- [docs/user_guide.md](docs/user_guide.md)

Use this path if you want to understand what the tool does, what inputs it supports, and what the main local workflows look like.

### I want to work on the codebase

Start with:

- [docs/architecture.md](docs/architecture.md)
- [README.md](../README.md)

Then use the package map below to jump into the right workspace.

### I want to deploy or operate it

Start with:

- [docs/deployment_readiness.md](docs/deployment_readiness.md)
- [deploy/cloudrun/README.md](../deploy/cloudrun/README.md)
- [deploy/cloudrun/RUNBOOK.md](../deploy/cloudrun/RUNBOOK.md)
- [deploy/cloudrun/SMOKE.md](../deploy/cloudrun/SMOKE.md)

This is the correct path for Cloud Run packaging, shared-access configuration, persistence setup, smoke verification, and rollback.

### I want to inspect the data contract

Start with:

- [docs/schema_spec.md](docs/schema_spec.md)
- [schema/](../schema)

## Package Map

The active v2 code lives under `packages/`:

- `packages/core` — ingestion, validation, persistence, graph logic, query/search
- `packages/cli` — `paperparser` command, HTTP API server, export and deployment entrypoints
- `packages/web` — React dashboard for static exports and API-backed browsing
- `packages/mcp` — MCP tools/resources for agent workflows

Supporting directories:

- `docs/` — architecture, user guide, deployment, schema, and workflow docs
- `schema/` — public bundle contract
- `ref/` — fixtures and reference runs

Legacy reference material still present during v2 work:

- `tools/`
- `dashboard/`
- `prompts/`

## Common Workflows

### Local analysis and inspection

1. Analyze a paper with the CLI.
2. Validate, query, or inspect impact/context.
3. Export a static dashboard if needed.

Primary docs:

- [README.md](../README.md)
- [docs/user_guide.md](docs/user_guide.md)

### Shared deployment on Cloud Run

1. Build and push the container image.
2. Deploy the combined service.
3. Grant explicit invoker access.
4. Mount the Cloud Storage bucket at the store path.
5. Verify health/readiness and smoke checks.

Primary docs:

- [deploy/cloudrun/RUNBOOK.md](../deploy/cloudrun/RUNBOOK.md)
- [deploy/cloudrun/SMOKE.md](../deploy/cloudrun/SMOKE.md)

## Current State

Today the project is strong on:

- deterministic TeX/Markdown bundle generation
- local inspection via CLI, dashboard, and MCP
- Cloud Run packaging and bounded shared deployment hardening

Still explicitly limited:

- production-ready PDF ingestion
- broader browser-side math compatibility outside the current normalization boundary
- a long-term high-write deployment storage architecture beyond the current mounted-bucket bridge

For the current deployment caveats, read [docs/deployment_readiness.md](docs/deployment_readiness.md).

## Doc Index

- Product and quickstart: [README.md](../README.md)
- User workflows: [docs/user_guide.md](docs/user_guide.md)
- Architecture and package layout: [docs/architecture.md](docs/architecture.md)
- Deployment status: [docs/deployment_readiness.md](docs/deployment_readiness.md)
- Cloud Run shared access: [deploy/cloudrun/README.md](../deploy/cloudrun/README.md)
- Cloud Run operations: [deploy/cloudrun/RUNBOOK.md](../deploy/cloudrun/RUNBOOK.md)
- Cloud Run smoke proof: [deploy/cloudrun/SMOKE.md](../deploy/cloudrun/SMOKE.md)
- Schema contract: [docs/schema_spec.md](docs/schema_spec.md)
