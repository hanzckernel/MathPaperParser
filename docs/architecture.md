# PaperParser v2 Migration Architecture

## Purpose

PaperParser is moving from a Python-tools plus Svelte prototype to a TypeScript monorepo modeled on GitNexus. The migration is additive: the current `tools/` and `dashboard/` directories remain the v1 reference implementation until the v2 pipeline, CLI, React dashboard, and MCP server reach feature parity.

## Target Workspace Layout

The v2 code lives under `packages/`:

- `packages/core` for shared types, graph logic, ingestion, persistence, validation, and search
- `packages/cli` for the `paperparser` command-line interface
- `packages/web` for the React dashboard
- `packages/mcp` for AI-agent tooling

Existing contract and reference assets stay in place:

- `schema/` remains the Stage 1 public bundle contract
- `docs/` continues to own architecture, schema, and protocol docs
- `prompts/` remains the prompt-suite workflow for the current generation
- `tools/` and `dashboard/` are preserved until v2 cutover

## Migration Guardrails

- Do not delete or rewrite `tools/` or `dashboard/` during Stage 1.
- Do not change `schema/*.schema.json` during Stage 1.
- Keep bundle compatibility with `0.1.0` examples while v2 is bootstrapped.
- Prefer small vertical slices: shared types first, then graph and validation, then ingestion, then user-facing layers.

## Batch 1 Outcome

Batch 1 establishes the root workspace, package skeletons, shared type contracts, and migration documentation. It does not replace the existing dashboard or Python tooling yet.
