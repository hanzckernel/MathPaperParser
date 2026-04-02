# Phase 04 Research

## Findings

1. The repo already has the right storage seam.
   - `packages/cli/src/store.ts` persists `diagnostics.json` as a sidecar without mutating the canonical bundle.
   - Reusing that pattern for `enrichment.json` keeps the trust boundary obvious.

2. The repo does not have an external model stack today.
   - There is no existing OpenAI, Anthropic, or generic provider integration in the packages.
   - A phase-appropriate implementation therefore needs a provider adapter with a built-in local backend so the feature is runnable and testable now.

3. The explorer already knows how to explain edges.
   - `GraphPage` can inspect `kind`, `provenance`, `evidence`, `detail`, and metadata.
   - Phase 4 therefore only needs to add merged enrichment loading plus provenance-level visibility controls.

4. MCP already exposes an enrichment resource name but not a real enrichment artifact.
   - `paperparser://papers/{paperId}/enrichment` currently returns `index.json`.
   - Making that resource real is a compatibility improvement, not a new concept.

## Recommendation

Implement Phase 4 in two plans:

1. Contract + storage + generation
   - add a typed and schema-validated `enrichment.json` sidecar
   - add a provider adapter with an honest built-in local heuristic reviewer
   - add an opt-in `paperparser enrich` command
   - expose the sidecar through store, export, serve, and MCP

2. Explorer review integration
   - load the optional enrichment sidecar in static and API modes
   - merge deterministic and enrichment edges in the dashboard model
   - replace evidence-only graph filtering with provenance toggles that default to deterministic-only
   - show confidence/provider/review metadata in the existing edge explanation surface

This is enough to satisfy EXPL-04, ENRICH-01, ENRICH-02, and ENRICH-03 without introducing hidden model dependencies or mutating the canonical graph.
