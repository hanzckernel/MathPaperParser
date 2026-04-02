# Phase 2: Canonical Objects & Deterministic Relations - Context

**Gathered:** 2026-04-02
**Status:** Ready for research

<domain>
## Phase Boundary

This phase upgrades the deterministic canonical artifact itself. Phase 1 proved that the representative TeX project at `ref/papers/long_nalini/arXiv-2502.12268v2/main.tex` can be ingested reliably with trustworthy front matter, persisted diagnostics, and stable reruns. Phase 2 now has to make that artifact semantically complete enough for later navigation work: first-class object coverage, stable object identity, source anchors, deterministic relations, provenance, and evidence.

This is not the phase for UI polish, agent enrichment, or cross-paper workflows. It is the phase where the contract of the canonical `manifest` / `graph` / `index` bundle becomes strong enough that the later explorer can trust it.

</domain>

<decisions>
## Implementation Decisions

### Artifact Contract
- Preserve the existing JSON bundle architecture (`manifest`, `graph`, `index`) as the canonical local-first artifact.
- Prefer additive schema evolution over replacement so Phase 1 acceptance and later UI/API consumers can be updated coherently.
- Treat deterministic parsing as the trusted baseline. Agent-inferred semantics remain deferred to Phase 4.

### Phase 1 Baseline To Preserve
- Keep `ref/papers/long_nalini/arXiv-2502.12268v2/main.tex` as the representative acceptance paper.
- Do not regress the Phase 1 guarantees: brace-aware title and author extraction, explicit diagnostics, `diagnostics.json` persistence, and stable gold-paper reruns.
- Existing `unresolved_reference` warnings on the gold paper are known context, not Phase 2 blockers by themselves, unless they prevent deterministic relation coverage.

### Canonical Scope For This Phase
- First-class deterministic objects must expand beyond theorem-like statements and `external_dependency` nodes to cover at least sections, proofs, equations, and citations per `OBJ-01`.
- Each extracted object must carry a stable ID plus a source anchor back to original TeX file and span.
- Deterministic relations must cover both explicit links (labels, refs, citations) and structural links (containment, proof attachment) with provenance and evidence.

### Likely Contract Tension
- Current edges overload `evidence` for provenance-like meaning (`explicit_ref`, `inferred`, `external`), but the roadmap now requires provenance values `explicit`, `structural`, and `agent_inferred` plus separate user-facing evidence. Phase 2 likely needs a schema-level cleanup here.
- Current node enums, stats, serializers, validation rules, web rendering, and MCP/store consumers all assume the older node/edge vocabulary. Any contract change must update those layers together rather than patching only the parser.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/core/src/types/node.ts` already has `filePath`, `startLine`, and `endLine` fields on `MathNode`, but current parsers do not populate them and current serializers do not round-trip them.
- `packages/core/src/types/edge.ts` and schema docs already support deterministic edges with `detail`, `metadata`, and optional `confidence`, so there is a place to attach evidence detail once provenance is modeled cleanly.
- `packages/core/src/serialization/bundle-serializer.ts`, `packages/core/src/validation/consistency-checker.ts`, schema JSON files, the web proof graph, MCP tests, and CLI/store paths already exercise the canonical bundle contract end-to-end.
- Phase 1 summaries in `.planning/phases/01-gold-paper-tex-ingestion-hardening/` capture the verified ingestion baseline and should be treated as required upstream context.

### Current Gaps
- `MATH_NODE_KINDS` currently only includes theorem-like nodes plus `external_dependency`; there are no first-class `section`, `proof`, `equation`, or `citation` objects yet.
- Current LaTeX and Markdown parsers mostly emit theorem-like statements and citation placeholder nodes, but they do not build a stable first-class object model for all Phase 2 requirements.
- Current serializers do not include source-anchor fields on nodes, so even though the TypeScript node model has them, the canonical stored artifact loses them.
- Current edge vocabulary has no explicit structural provenance field and no dedicated structural edge kinds for containment or proof-to-object attachment.

### Integration Points
- Core contract changes will touch `packages/core/src/types`, parser outputs, bundle building, serialization, validation, and graph stats.
- The web explorer in `packages/web/src/components/proof-graph-page.tsx` and related bundle-data tests already depend on current node and edge enums, so the UI will need compatibility updates during the same phase even if Phase 3 is where new views land.
- MCP and CLI validation paths rely on the serialized schema and consistency checker, so schema drift must stay synchronized across those surfaces.

</code_context>

<specifics>
## Specific Ideas

- Phase 2 likely needs a small, explicit source-anchor model that can survive serialization. The existing `filePath/startLine/endLine` fields on `MathNode` suggest the least disruptive route is to serialize those fields rather than invent a second anchor representation.
- For proofs, equations, and citations, the fastest route may be additive node kinds plus structural or explicit edges, not a parallel sidecar object registry.
- The gold paper still has 46 deterministic `unresolved_reference` warnings after Phase 1. That makes it a good acceptance target for verifying that Phase 2 differentiates between missing relations and still-unsupported constructs instead of silently dropping either.
- Because the proof graph UI already consumes generic nodes and edges, Phase 2 should prefer contract changes that can be rendered incrementally rather than inventing a second incompatible graph.

</specifics>

<deferred>
## Deferred Ideas

- Local HTML explorer workflows remain Phase 3, even though this phase will update the underlying bundle contract they consume.
- Agent-enriched relations and provenance filtering UX remain Phase 4.
- Cross-paper search, library management, and PDF ingestion remain out of scope.

</deferred>
