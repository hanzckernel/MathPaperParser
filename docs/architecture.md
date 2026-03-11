# PaperParser v2 Alpha Architecture

## Purpose

PaperParser now ships a TypeScript v2 alpha for TeX and Markdown ingestion. The migration remains additive: `tools/`, `dashboard/`, and `prompts/` stay in the repo as legacy reference material while beta work focuses on robust PDF ingestion.

## Target Workspace Layout

The v2 code lives under `packages/`:

- `packages/core` for shared types, graph logic, ingestion, persistence, validation, and search
- `packages/cli` for the `paperparser` command-line interface
- `packages/web` for the React dashboard
- `packages/mcp` for AI-agent tooling

Existing contract and reference assets stay in place:

- `schema/` remains the public bundle contract at `0.2.0`
- `docs/` continues to own architecture, schema, and protocol docs
- `prompts/` remains a legacy manual-review workflow
- `tools/` and `dashboard/` are preserved as v1 references until beta cutover

## Migration Guardrails

- Do not delete or rewrite `tools/` or `dashboard/` during beta preparation.
- Keep the bundle contract stable at `0.2.0` through the PDF beta unless a later breaking change is explicitly approved.
- Keep TeX and Markdown on the same CLI/API/MCP surface used for beta PDF work.
- Prefer vertical slices that preserve end-to-end parity across CLI, serve, web, and MCP.

## Alpha Status

- `packages/core` owns ingestion, validation, persistence, and query services
- `packages/cli` owns analyze/export/serve/mcp entry points
- `packages/web` is the default dashboard for alpha
- `packages/mcp` exposes stored-paper tools/resources for agents
