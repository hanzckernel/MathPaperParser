# PaperParser

## What This Is

PaperParser is a local-first parser and exploration tool for mathematicians working with research papers. The existing codebase already parses academic Markdown and LaTeX into a structured bundle and exposes that bundle through a CLI, HTTP API, React dashboard, and MCP server; the current project focus is to make the TeX path strong enough for a mathematician to navigate a heavy paper through an explicit dependency structure rather than raw source files.

## Core Value

A mathematician can feed in a TeX paper and get a trustworthy dependency artifact that makes the logical structure of the paper easier to navigate.

## Requirements

### Validated

- ✓ Parse academic Markdown and LaTeX inputs into a canonical `manifest` / `graph` / `index` bundle — existing in `packages/core/src/ingestion/` and exercised through `packages/cli/src/index.ts`
- ✓ Persist parsed papers locally and expose them through CLI status/list/query/context/impact flows — existing in `packages/cli/src/store.ts` and `packages/cli/src/index.ts`
- ✓ Validate stored bundles against JSON schema and consistency checks — existing in `packages/core/src/validation/`
- ✓ Export a static dashboard bundle and render it in a React explorer — existing in `packages/cli/src/export.ts` and `packages/web/src/`
- ✓ Expose the stored-paper/query surface through a local MCP server — existing in `packages/mcp/src/server.ts`

### Active

- [ ] Parse TeX papers into a dependency-oriented artifact that captures sections, theorems, lemmas, corollaries, definitions, propositions, proofs, equations, and citations with source-linked structure.
- [ ] Produce a deterministic canonical JSON artifact as the source of truth for TeX parsing output.
- [ ] Distinguish relation provenance so explicit, structural, and agent-inferred edges are stored separately and can be trusted differently.
- [ ] Add an optional second-pass agent enrichment flow that proposes semantic dependencies with confidence and supporting evidence.
- [ ] Provide a local interactive HTML explorer for one mathematician to inspect an object's dependencies and understand why each edge exists.
- [ ] Make the first milestone succeed on one representative heavy TeX paper rather than broad corpus coverage.

### Out of Scope

- PDF ingestion in this milestone — the current TypeScript pipeline explicitly does not implement it, and it would distract from the TeX dependency-graph goal.
- Multi-user collaboration or hosted sharing — current success is local-first use by one mathematician.
- Production internet deployment — the current server remains local/trusted-network only, and deployment hardening is a separate project.
- Perfect semantic understanding of mathematical arguments — agent inference is allowed as enrichment, not treated as unquestionable ground truth.
- Broad paper-format generalization across many TeX styles in the first milestone — success is one representative heavy paper parsed well.

## Context

The repository is a TypeScript monorepo with active workspace packages in `packages/core`, `packages/cli`, `packages/mcp`, and `packages/web`. The current architecture already centers on a stable bundle contract defined by `schema/manifest.schema.json`, `schema/graph.schema.json`, and `schema/index.schema.json`, with local filesystem persistence under `.paperparser-data/`.

This project is brownfield, not greenfield. Existing parsing/query/export infrastructure is real and should be reused instead of replaced, but the current codebase still carries legacy surfaces in `dashboard/`, `tools/`, and `prompts/`, and the TeX parser currently emphasizes extraction over mathematically meaningful dependency navigation.

The product direction for the next milestone is inspired by GitNexus: keep a machine-readable canonical graph artifact first, then layer a human exploration surface on top. For this domain, that means the deterministic parser must establish a reliable baseline, and agent reasoning should appear as a separate optional enrichment pass with provenance, confidence, and evidence.

The first user is a mathematician working locally on a heavy TeX paper. The most important user actions in the first useful explorer are:
- inspect an object and see its dependencies
- inspect an edge and understand why the relation exists
- optionally search by label or title

## Constraints

- **Tech Stack**: Stay within the existing TypeScript monorepo and reuse the current `manifest` / `graph` / `index` bundle contract unless a phase explicitly evolves that contract — the codebase already has working CLI, API, dashboard, and MCP adapters around it.
- **Input Scope**: Focus this milestone on TeX only — narrowing scope is necessary to make dependency parsing trustworthy.
- **Trust Model**: Deterministic parse output is the baseline artifact; agent-inferred semantic edges must be optional and explicitly marked with provenance, confidence, and evidence — otherwise the graph becomes hard to trust and debug.
- **User Mode**: Optimize for a single local mathematician, not collaborative or internet-facing workflows — this keeps the first milestone productively narrow.
- **Success Bar**: One representative heavy paper parsed well is sufficient for v1 — broad paper coverage is a later expansion problem.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Keep the canonical output as machine-readable JSON instead of Markdown or HTML-only output | The parser result needs to be queryable, comparable, and reusable across CLI/API/MCP/dashboard surfaces | — Pending |
| Generate a local interactive HTML explorer on top of the canonical artifact | The user needs human-friendly navigation, but the UI should not be the source of truth | — Pending |
| Treat agent semantic inference as an optional second pass | Separating deterministic parsing from probabilistic enrichment preserves trust, debuggability, and testability | — Pending |
| Track relation provenance as `explicit`, `structural`, or `agent_inferred` | Mixed-confidence edges need different handling in both storage and UI | — Pending |
| Optimize the first milestone for one representative heavy TeX paper | Narrowing the acceptance bar keeps the phase realistic and measurable | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `$gsd-transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `$gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check -> still the right priority?
3. Audit Out of Scope -> reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-02 after initialization*
