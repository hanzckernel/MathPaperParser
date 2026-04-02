# Architecture Research: PaperParser

**Domain:** local-first TeX paper parsing and dependency exploration  
**Researched:** 2026-04-02  
**Confidence:** MEDIUM

## Recommended Architecture

PaperParser should stay a package-oriented monorepo with `@paperparser/core` as the only place that knows how to parse, validate, materialize, and query paper artifacts. The key architectural move for the next milestone is **not** a new backend or a new UI stack. It is a stronger separation between:

1. the **deterministic canonical artifact** that is trusted by default,
2. the **optional enrichment artifact** produced by agent inference,
3. the **graph view layer** that merges those artifacts for CLI/API/MCP/web consumers under explicit trust rules.

That shape fits the current repo well. It preserves the existing `manifest` / `graph` / `index` bundle as the baseline contract, keeps the filesystem as the source of truth for a local-first first milestone, and lets every surface expose the same dependency model without each adapter inventing its own merge logic. This also aligns with MCP's distinction between **resources** for structured context and **tools** for callable actions, with provenance modeled as first-class data rather than UI-only decoration ([MCP Resources](https://modelcontextprotocol.io/specification/2025-03-26/server/resources), [MCP Tools](https://modelcontextprotocol.io/specification/2025-03-26/server/tools), [PROV-Overview](https://www.w3.org/TR/prov-overview/), [PROV-DM](https://www.w3.org/TR/prov-dm/)).

## Target System Overview

```text
+------------------------+       +---------------------------+
| TeX entry file/project | ----> | TeX normalization layer   |
| main.tex, includes     |       | flatten, source map, IR   |
+------------------------+       +-------------+-------------+
                                                |
                                                v
                                   +------------+-------------+
                                   | Deterministic extraction |
                                   | objects, labels, edges   |
                                   +------------+-------------+
                                                |
                                                v
                                   +------------+-------------+
                                   | Canonical bundle         |
                                   | manifest / graph / index |
                                   +------------+-------------+
                                                |
                          +---------------------+----------------------+
                          |                                            |
                          v                                            v
              +-----------+-----------+                    +-----------+-----------+
              | Validation + snapshot |                    | Optional enrichment   |
              | schema, consistency   |                    | agent proposals       |
              | atomic local storage  |                    | confidence, evidence  |
              +-----------+-----------+                    +-----------+-----------+
                          |                                            |
                          +---------------------+----------------------+
                                                |
                                                v
                                   +------------+-------------+
                                   | Graph view/materializer  |
                                   | deterministic only       |
                                   | or deterministic + AI    |
                                   +------------+-------------+
                                                |
                 +------------------------------+------------------------------+
                 |                              |                              |
                 v                              v                              v
        +--------+--------+           +---------+---------+          +---------+---------+
        | CLI / HTTP API  |           | MCP resources     |          | Static export +   |
        | query/context   |           | raw artifacts     |          | React explorer     |
        | impact/validate |           | MCP tools         |          | local HTML         |
        +-----------------+           +-------------------+          +-------------------+
```

## What Should Stay Stable

| Stable element | Why it should remain |
|----------------|----------------------|
| Monorepo split of `core`, `cli`, `mcp`, and `web` | The current package boundaries are already correct: domain logic in `core`, thin delivery adapters elsewhere. |
| Three-part deterministic bundle (`manifest`, `graph`, `index`) | This is the current contract used by CLI, API, MCP, and web. Keep it as the baseline artifact every other surface can trust. |
| Filesystem-first local storage | The first milestone is local-first for one heavy paper. JSON artifacts on disk remain the simplest authoritative store, consistent with local-first principles ([Local-first software](https://www.inkandswitch.com/essay/local-first/)). |
| Static HTML export via Vite | Vite's production output is a static `dist` artifact, which is exactly the right deployment model for local HTML exploration ([Vite static deploy guide](https://vite.dev/guide/static-deploy.html)). |
| Shared validation at the contract boundary | JSON Schema should remain the compatibility line, and the current JSON Schema 2020-12 split between core and validation maps cleanly onto PaperParser's schema plus consistency checks ([JSON Schema specification](https://json-schema.org/specification)). |
| Deterministic parser as default behavior | Every surface must remain useful with zero model access. The user should be able to trust baseline results even if enrichment is never run. |

## What Should Change

| Change | Recommendation | Reason |
|--------|----------------|--------|
| TeX ingestion shape | Insert a TeX normalization + source-map stage before node/edge extraction. | The repo currently jumps too quickly from flattened text to extracted objects. A stronger dependency graph needs stable source anchors first. |
| Relation modeling | Split deterministic relations into `explicit` and `structural`; keep `agent_inferred` out of the canonical deterministic graph. | Trust boundaries must be visible in storage, query results, and UI. |
| Enrichment persistence | Store agent output as a separate sidecar artifact, not as silent mutations to `graph.json`. | This keeps the deterministic bundle reproducible and diffable. |
| Store layout | Add immutable run snapshots and atomic promotion of the current run. | The current top-level overwrite model is too fragile for provenance and comparison. |
| Query architecture | Introduce a shared `GraphViewService` that overlays deterministic and enrichment artifacts once. | CLI, API, MCP, and web should not each invent their own merge/filter policy. |
| Explorer model | Make the HTML explorer edge-first as well as node-first. | The milestone goal is dependency navigation with "why this edge exists", not only object browsing. |
| MCP shape | Expose raw artifacts as resources and derived operations as tools; add resource templates for node and edge evidence. | This follows the MCP model directly and makes agent consumers more predictable ([MCP Resources](https://modelcontextprotocol.io/specification/2025-03-26/server/resources), [MCP Tools](https://modelcontextprotocol.io/specification/2025-03-26/server/tools)). |
| Storage backend ambition | Keep Kuzu out of the critical path this milestone. | The current native graph path is incomplete and would add risk without helping the first-user workflow. |

## Component Boundaries

| Component | Responsibility | Communicates with | Recommended repo area |
|-----------|----------------|-------------------|-----------------------|
| TeX normalization | Resolve includes, track file-local paths, preserve source spans, build normalized TeX stream and source map. | Deterministic extraction, provenance builder | `packages/core/src/ingestion/tex-normalize/` |
| TeX structural IR | Capture sections, theorem-like environments, proofs, equations, citations, labels, and references before graph decisions. | Deterministic extraction | `packages/core/src/ingestion/tex-ir/` |
| Deterministic extraction | Produce canonical nodes and deterministic edges from the IR. | Bundle builder, provenance builder | `packages/core/src/ingestion/deterministic/` |
| Provenance builder | Attach source evidence, derivation activity, and extractor identity to nodes and deterministic edges. | Bundle builder, validators, explorer | `packages/core/src/provenance/` |
| Canonical bundle builder | Emit the trusted `manifest`, `graph`, and `index` artifact. | Store adapter, validators, query layer | existing `packages/core/src/ingestion/` and `packages/core/src/types/` |
| Enrichment runner | Propose optional inferred edges from the canonical bundle plus selected source snippets. | Enrichment store, graph view layer | `packages/core/src/enrichment/` |
| Graph view/materializer | Build a queryable graph view from one deterministic bundle plus zero or more enrichment packs under explicit filters. | Query services, API, MCP, web export | `packages/core/src/materialization/` |
| Query services | Search, context, impact, dependency trace, edge evidence lookup. | CLI, HTTP API, MCP, exported web data | existing `packages/core/src/services/` |
| Store adapter | Persist immutable runs, expose current pointers, load raw artifacts and materialized views. | CLI, HTTP API, MCP, export | `packages/core/src/persistence/` plus thin adapter helpers |
| Delivery adapters | Transport only: command parsing, HTTP routing, MCP framing, React presentation. | Query services, store adapter | existing `packages/cli`, `packages/mcp`, `packages/web` |

## Recommended Project Structure

This should be a **gradual refactor**, not a package rewrite. Preserve the public barrels and add new modules behind them.

```text
packages/core/src/
  contract/              # schema-facing types and serializers
  ingestion/
    tex-normalize/       # include resolution, source map, normalized text
    tex-ir/              # sections, environments, references, citations
    deterministic/       # node extraction and deterministic relation builders
    bundle-builder.ts    # canonical manifest/graph/index assembly
  provenance/            # evidence spans, derivation metadata, activity records
  enrichment/            # candidate generation, model runner adapters, normalization
  materialization/       # GraphViewService, overlay logic, trust filters
  services/              # search/context/impact/edge explanation APIs
  persistence/           # JSON snapshot store, run pointers, later optional adapters
  validation/            # schema + semantic validators

packages/cli/src/
  index.ts               # commands only
  server.ts              # HTTP only
  export.ts              # static export only
  store.ts               # thin wrapper around core persistence APIs

packages/mcp/src/
  server.ts              # MCP transport only
  store.ts               # thin wrapper or removable once shared store API exists

packages/web/src/
  lib/
    data-source.ts       # loads raw artifacts and selected view options
    dashboard-model.ts   # view-model building only
  components/            # presentation only
```

## Canonical Data Model

### 1. Deterministic canonical bundle

The existing `manifest` / `graph` / `index` contract remains the trusted baseline. It should evolve, but only in ways that preserve "deterministic bundle is useful on its own."

Recommended additions:

- Stable `paperId` and `runId` metadata in the manifest.
- Stable per-node source anchors: `filePath`, `startLine`, `endLine`, and local source identifiers.
- Deterministic edge provenance fields that distinguish:
  - `explicit`: directly supported by textual reference, label, citation, or theorem/proof reference.
  - `structural`: derived mechanically from document structure, proof block nesting, section scope, or equation environment placement.
- Edge identifiers stable enough to diff across reruns.

Recommended rule: **`graph.json` contains only deterministic edges.** It may record whether each deterministic edge is explicit or structural, but it should not silently absorb model proposals.

### 2. Optional enrichment sidecar

Add a separate artifact, for example `enrichment.json` or `enrichments/<enrichmentId>.json`, with enough metadata to audit and re-run.

Recommended shape:

```ts
interface EnrichmentPack {
  enrichmentId: string;
  paperId: string;
  baseRunId: string;
  createdAt: string;
  producer: {
    kind: 'agent';
    model: string;
    promptVersion: string;
  };
  proposals: Array<{
    edgeId: string;
    source: string;
    target: string;
    kind: 'uses_in_proof' | 'extends' | 'generalizes' | 'specializes' | 'equivalent_to';
    provenance: 'agent_inferred';
    confidence: number;
    rationale: string;
    evidence: Array<{
      filePath: string;
      startLine: number;
      endLine: number;
      excerpt: string;
    }>;
  }>;
}
```

That design follows PROV's core idea that provenance should identify the **entity**, the **activity** that produced it, and the **agent** responsible for that activity; it also matches PROV's notion that bundles themselves can have provenance ([PROV-Overview](https://www.w3.org/TR/prov-overview/), [PROV-DM](https://www.w3.org/TR/prov-dm/)).

### 3. Shared graph view

Every read surface should consume a `GraphView`, not raw files directly.

```ts
interface GraphViewOptions {
  includeAgentInferred: boolean;
  minConfidence?: number;
  requireEvidence?: boolean;
}
```

`GraphViewService` should:

- load one deterministic bundle,
- load zero or more enrichment packs,
- filter proposals by confidence and evidence policy,
- merge them into a view with explicit provenance labels,
- return both merged edges and source artifacts for explanation.

This gives one place to answer "what is in scope for this query?" across CLI, API, MCP, and the local explorer.

## Local Store Layout

For the next milestone, keep JSON files as the source of truth, but stop overwriting the only copy.

Recommended layout:

```text
.paperparser-data/
  latest.json
  <paperId>/
    current.json
    current/
      manifest.json
      graph.json
      index.json
    runs/
      <runId>/
        manifest.json
        graph.json
        index.json
        provenance.json
    enrichments/
      <enrichmentId>.json
```

Rules:

- `current/` is the latest promoted deterministic run for backwards compatibility.
- `runs/<runId>/` is immutable.
- enrichment packs point to a specific `baseRunId`.
- writes happen in a temp directory and are promoted with atomic rename.
- static export reads from a chosen run plus optional enrichment selection.

Do **not** make Kuzu the primary store in this milestone. If a graph database becomes useful later, it should be a derived index over the canonical JSON artifacts, not the new source of truth.

## Data Flow

### Deterministic analyze flow

1. CLI or HTTP ingest resolves an input path.
2. TeX normalization resolves includes and emits normalized text plus a source map.
3. TeX IR extraction produces section/environment/reference objects.
4. Deterministic extractors build nodes and deterministic edges.
5. Provenance builder attaches evidence spans and derivation metadata.
6. Bundle builder emits canonical `manifest`, `graph`, and `index`.
7. Validation runs before storage promotion.
8. Store writes an immutable run, then updates `current/`.

### Enrichment flow

1. User explicitly invokes enrichment for a chosen paper/run.
2. Candidate selection chooses high-value node pairs or proof gaps from the deterministic bundle.
3. The model sees bounded context: node statements, nearby proof text, citations, and source spans.
4. The enrichment runner normalizes model output into typed proposals.
5. Validation rejects proposals missing evidence or confidence.
6. The enrichment pack is stored separately and never mutates the deterministic run.

### Query flow

1. CLI/API/MCP/web resolves `paperId`, and optionally `runId` and enrichment selection.
2. Store loads the deterministic run plus zero or more enrichment packs.
3. `GraphViewService` materializes the requested trust-filtered view.
4. Query services compute search, context, impact, trace, and edge explanations from that view.
5. Each adapter formats the result for its transport only.

### Static HTML exploration flow

1. Export copies the prebuilt Vite app and writes selected artifact files beside it.
2. The browser loads deterministic bundle data by default.
3. If enrichment data is present, the UI offers an explicit toggle and confidence filter.
4. Explorer panels show, for every edge: provenance kind, confidence, rationale, and source-linked evidence.

Vite remains the right fit because the project needs a static output directory rather than a mandatory server process ([Vite static deploy guide](https://vite.dev/guide/static-deploy.html)).

## Surface Design Guidance

### CLI and HTTP API

- Keep commands and routes thin.
- Add run-aware reads before adding new user-visible commands.
- Expose both raw artifacts and derived query endpoints.
- Default all read paths to deterministic-only unless the caller opts into enrichment.

### MCP

Follow MCP literally:

- **Resources** for raw artifacts:
  - paper listing
  - deterministic manifest
  - deterministic graph
  - deterministic index
  - enrichment packs
  - node and edge evidence resources via templates
- **Tools** for derived operations:
  - search
  - context
  - impact
  - dependency trace
  - edge explanation
  - validation

This matches the protocol's split between application-provided context and model-invoked actions ([MCP Resources](https://modelcontextprotocol.io/specification/2025-03-26/server/resources), [MCP Tools](https://modelcontextprotocol.io/specification/2025-03-26/server/tools)).

### Local HTML explorer

The local explorer should optimize for one mathematician investigating one difficult paper:

- node page: statement, proof status, section, incoming/outgoing dependencies
- edge page: why this relation exists, evidence snippets, provenance, confidence
- graph filters: deterministic only, structural only, inferred overlay
- search: label, theorem number, title, citation label

The UI should not recompute graph semantics independently. It should render a view already materialized by core logic or exported as stable JSON.

## Recommended Build Order

1. **Stable IDs and source anchors**
   Deterministic parsing is not trustworthy until nodes and source spans are stable across reruns.
2. **TeX normalization and structural IR**
   Build the intermediate representation before changing query surfaces.
3. **Deterministic dependency extraction**
   Produce explicit and structural edges with evidence.
4. **Schema and store evolution**
   Add `runId`, provenance fields, immutable run layout, and validators.
5. **Graph view/materialization layer**
   Make every surface consume one shared merge/filter policy.
6. **Explorer upgrade on deterministic data**
   Ship the edge-centric local HTML workflow before any agent overlay.
7. **Optional enrichment pass**
   Add the sidecar artifact, CLI/API invocation, and UI toggle after the deterministic workflow is already useful.
8. **MCP refinement**
   Add richer resources and edge explanation tools once the underlying artifacts are stable.

## Anti-Patterns To Avoid

### 1. Letting model output rewrite the canonical graph

What goes wrong: a rerun can silently change "ground truth" and make bugs impossible to reproduce.  
Instead: keep deterministic output canonical and store agent proposals as auditable sidecars.

### 2. Merging enrichment separately in each adapter

What goes wrong: CLI, API, MCP, and web disagree about what the graph contains.  
Instead: centralize merge and trust policy in `GraphViewService`.

### 3. Using a graph database as the primary source of truth now

What goes wrong: storage complexity outruns the single-user local-first milestone and conflicts with the current repo reality.  
Instead: keep JSON snapshots authoritative and treat any future DB as a derived read index.

### 4. Keying runs or papers by unstable titles

What goes wrong: collisions and confusing diffs.  
Instead: use explicit `paperId`, `runId`, stable node IDs, and deterministic edge IDs.

## Scalability Notes

| Concern | This milestone | Later expansion path |
|---------|----------------|----------------------|
| Storage | JSON snapshots on local disk are sufficient for one heavy paper. | Add metadata indexes or a derived DB only after multi-paper query latency is a proven problem. |
| Query cost | In-memory graph materialization per request is acceptable. | Cache materialized views per run when repeated reads become noticeable. |
| Web rendering | Precomputed view JSON and focused subgraph exploration are enough. | Add worker-backed layout or canvas rendering only if large graphs actually break the browser. |
| Enrichment cost | Manual opt-in per run is the right default. | Add background queues only after multiple papers and repeated enrichment are real workflows. |

## Sources

- [Model Context Protocol: Resources](https://modelcontextprotocol.io/specification/2025-03-26/server/resources) - primary guidance for raw artifact exposure, resource templates, and resource update semantics.
- [Model Context Protocol: Tools](https://modelcontextprotocol.io/specification/2025-03-26/server/tools) - primary guidance for derived query operations and model-invoked actions.
- [W3C PROV-Overview](https://www.w3.org/TR/prov-overview/) - provenance concepts for trust, reproducibility, derivation, versioning, and provenance of provenance.
- [W3C PROV-DM](https://www.w3.org/TR/prov-dm/) - conceptual model for bundles, derivations, and explicit activity/agent attribution.
- [JSON Schema Specification](https://json-schema.org/specification) - current 2020-12 contract baseline for schema/core validation separation.
- [Vite: Deploying a Static Site](https://vite.dev/guide/static-deploy.html) - validates continuing the static-export-first web delivery model.
- [Local-first software: You own your data, in spite of the cloud](https://www.inkandswitch.com/essay/local-first/) - informs the recommendation to keep local snapshots authoritative for the first milestone.

---
*Architecture research for PaperParser, focused on deterministic TeX dependency parsing with optional inferred overlays.*
