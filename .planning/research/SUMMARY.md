# Project Research Summary

**Project:** PaperParser
**Domain:** Local-first TeX math-paper dependency parsing and exploration
**Researched:** 2026-04-02
**Confidence:** MEDIUM

## Executive Summary

PaperParser is not a greenfield parser project. It is already a working TypeScript monorepo with a CLI, HTTP API, React dashboard, MCP server, and a schema-validated `manifest` / `graph` / `index` bundle. The research is consistent on the main product move: keep that brownfield shape, but make the TeX path trustworthy enough that one mathematician can inspect a heavy paper through theorem-, proof-, equation-, and citation-level dependencies instead of raw source files. The right v1 is a deterministic, source-linked dependency artifact first and a local explorer second, not a platform rewrite or a "smart" graph built primarily by an LLM.

The strongest technical recommendation is to replace the current regex-first TeX extraction path with an AST-first pipeline in `packages/core`, using the [`@unified-latex/*`](https://github.com/siefkenj/unified-latex) family for parsing/traversal, while keeping [JSON Schema](https://json-schema.org/specification) plus [AJV](https://ajv.js.org/) as the only canonical contract. Architecture research points to a clear separation: deterministic parse output stays canonical, optional enrichment is stored as a sidecar keyed to a specific run, and every surface consumes a shared graph materialization layer instead of re-implementing merge logic. For the explorer, the current React/Vite shell is sufficient; add [`@xyflow/react`](https://reactflow.dev/api-reference/react-flow) only for the dependency graph view if the current static SVG breaks down on the target paper.

The main risks are domain-specific rather than infrastructural: TeX presentation does not automatically yield semantic structure, notation is ambiguous even inside one paper, proofs often omit implicit dependencies, and users will not trust any graph that cannot explain each edge. The roadmap therefore needs to stay narrow: harden ingestion on one gold paper, separate relation types and evidence at the schema level, ship an edge-explaining deterministic explorer, and only then add opt-in agent proposals. The mistakes to avoid are equally clear: no PDF detour, no graph database in the critical path, no generic `depends_on`, no manual graph editing as a substitute for parser fixes, and no agent output mutating the canonical graph.

## Key Findings

### Recommended Stack

PaperParser should stay on its verified repo baseline: Node 22, TypeScript 5.9, npm workspaces, the existing workspace/package boundaries, and the current React/Vite web app. The stack change that matters is inside `packages/core`: move TeX parsing to a real AST pipeline, preserve the current JSON bundle as the single source of truth, and layer optional enrichment behind a thin provider adapter rather than an orchestration framework. This is a brownfield upgrade, not a technology reset.

**Core technologies:**
- Node 22 + TypeScript 5.9 + npm workspaces: keep the current monorepo runtime/build baseline because all active packages already depend on it.
- [`@unified-latex/*`](https://github.com/siefkenj/unified-latex): primary deterministic TeX AST parser/traversal stack for environments, labels, refs, citations, and source positions.
- [JSON Schema](https://json-schema.org/specification) + [AJV](https://ajv.js.org/): preserve one canonical artifact contract across CLI, web, export, and MCP.
- React + Vite: keep the existing local/static explorer shell; do not introduce a new frontend framework.
- [`@xyflow/react`](https://reactflow.dev/api-reference/react-flow): add only for the dependency graph canvas if the target paper outgrows the current custom graph rendering.
- [`openai`](https://github.com/openai/openai-node): optional direct SDK for second-pass semantic proposals, behind a PaperParser-owned interface and never in the deterministic path.

**What to avoid in the stack:**
- Regex-first TeX parsing as the main parser.
- Kuzu/Neo4j or any graph DB as canonical storage for this milestone.
- LangChain/LlamaIndex style agent frameworks for a single optional enrichment pass.
- Zod or another second schema system as a parallel source of truth.

### Expected Features

The v1 product is a single-paper dependency explorer for mathematicians, not a general literature platform. Adjacent tools such as [TheoremSearch](https://theoremsearch.com/), [ResearchRabbit](https://learn.researchrabbit.ai/en/articles/12454564-how-do-i-see-citations-and-references-in-the-new-researchrabbit), [Litmaps](https://docs.litmaps.com/en/articles/9057179-create-a-litmap), and [Semantic Scholar](https://www.semanticscholar.org/product/tutorials) reinforce the expectation that graph navigation only becomes useful when objects are typed, edges are explainable, and users can filter/search aggressively.

**Must have (v1 now):**
- Deterministic extraction of sections, theorems, lemmas, corollaries, definitions, propositions, proofs, equations, and citations.
- Stable object IDs plus source anchors for every extracted object.
- Object detail view with label/title, type, section breadcrumb, statement/context, and source location.
- Direct dependency and reverse-dependency inspection.
- Edge explanation with provenance and evidence for every visible edge.
- Basic search by label/title/name plus filtering by object type, section, and provenance.

**Should have after the deterministic base is useful (v1.x):**
- Provenance-layer toggles for `explicit`, `structural`, and `agent_inferred` relations.
- Optional second-pass semantic edge proposals with confidence and supporting evidence.
- Outline-plus-graph navigation for large papers.

**Defer (v2+ or separate milestone):**
- PDF ingestion or OCR recovery.
- Cross-paper discovery, multi-paper library mode, or author/citation-network exploration.
- Collaboration, public sharing, sync, alerts, or reference-manager replacement.
- Semantic theorem search over a corpus.
- Manual graph editing UI.

### Architecture Approach

The architecture work points to one stable rule: `@paperparser/core` should remain the only package that knows how to parse, validate, persist, materialize, and query paper artifacts. The main additions are a TeX normalization/source-map stage, a structural IR before graph decisions, deterministic relation builders with evidence, immutable run storage, and a shared `GraphViewService` that overlays optional enrichments once for every downstream consumer. This aligns with local-first storage guidance from [Ink & Switch](https://www.inkandswitch.com/essay/local-first/), provenance modeling from [W3C PROV](https://www.w3.org/TR/prov-overview/), and MCP's resource/tool split for exposing raw artifacts separately from derived operations ([Resources](https://modelcontextprotocol.io/specification/2025-03-26/server/resources), [Tools](https://modelcontextprotocol.io/specification/2025-03-26/server/tools)).

**Major components:**
1. TeX normalization: resolve includes, macros, and source spans into a normalized stream plus source map.
2. Structural IR + deterministic extraction: identify theorem-like objects, proofs, equations, citations, labels, and explicit/structural relations before any enrichment.
3. Provenance-aware bundle builder: emit the canonical `manifest` / `graph` / `index` bundle with stable IDs and evidence-bearing edges.
4. Immutable store + run promotion: persist run snapshots, keep `current/` for compatibility, and treat enrichment as a separate sidecar tied to `baseRunId`.
5. `GraphViewService`: merge deterministic data and optional enrichment under explicit trust filters for CLI/API/MCP/web parity.
6. Thin delivery adapters: keep CLI, HTTP API, MCP, and React as presentation/transport layers only.

### Critical Pitfalls

1. **Treating TeX layout as semantic structure** — inventory per-paper macros/environments first, preserve source spans, and accept paper-specific bindings for v1 instead of pretending generic parsing is enough ([LaTeXML](https://dlmf.nist.gov/LaTeXML/manual.pdf), [plasTeX](https://plastex.github.io/plastex/plastex/sec-packages.html)).
2. **Using unstable notation as identity** — key nodes by stable object identity plus scope/source location, not by symbols like `G` or `f`, because intra-document notation is ambiguous ([Grounding of Formulae](https://aclanthology.org/2020.sdp-1.16/), [Intra-document Disambiguation](https://aclanthology.org/2024.lrec-main.1522/)).
3. **Flattening all relations into one `depends_on` edge** — require explicit relation type, provenance, and evidence at the schema level so explicit refs, structural containment, and AI suggestions never collapse into one trust level ([NaturalProofs](https://openreview.net/forum?id=Jvxa8adr3iY)).
4. **Shipping a graph without edge evidence** — make evidence mandatory for explicit/structural edges and expose it in the explorer; otherwise users still need to grep TeX and the graph is not a research tool.
5. **Letting agent enrichment overwrite the base parse** — keep deterministic output byte-stable across reruns and store model proposals as opt-in sidecars with model/version/prompt metadata ([Math LLM grounding](https://aclanthology.org/2024.mathnlp-1.1/)).
6. **Declaring success without a gold-paper contract** — pick one representative heavy paper now and turn it into the acceptance fixture with must-have objects, must-have edges, must-not-have edges, unresolved refs, and parser-warning expectations ([arXMLiv](https://kwarc.info/projects/arXMLiv/)).

## Implications for Roadmap

Based on the research, the roadmap should be organized around trust boundaries and artifact dependencies, not around UI surfaces.

### Phase 1: Gold-Paper Ingestion Hardening
**Rationale:** Nothing downstream is reliable until one heavy paper parses deterministically with source spans, include handling, and theorem/proof boundaries.
**Delivers:** `@unified-latex/*`-backed TeX normalization, macro/environment inventory, source-map output, and bounded parser warnings on the target paper.
**Addresses:** deterministic typed extraction prerequisites from `FEATURES.md`.
**Avoids:** the failure mode where TeX layout is mistaken for semantics.

### Phase 2: Canonical Object and Provenance Schema
**Rationale:** Search, graphing, evidence, and enrichment all depend on stable IDs, explicit relation types, and a strict evidence contract.
**Delivers:** schema evolution for stable node/edge IDs, `explicit` vs `structural` provenance, source anchors, `runId`/`paperId`, and immutable run storage.
**Uses:** existing JSON Schema + AJV contract rather than a second schema system.
**Avoids:** notation collisions, mixed trust levels, and generic `depends_on` edges.

### Phase 3: Deterministic Dependency Explorer
**Rationale:** The first user value is answering "what does this theorem depend on, and why?" on the deterministic graph alone.
**Delivers:** shared `GraphViewService`, dependency/reverse-dependency queries, edge explanation APIs, and a local explorer with search, filters, detail view, and evidence-first navigation.
**Implements:** the core materialization/query architecture and the minimum useful web experience.
**Avoids:** shipping a graph UI that looks good but cannot justify edges.

### Phase 4: Optional Agent Enrichment
**Rationale:** Semantic completion is useful only after the deterministic baseline is already inspectable and trusted.
**Delivers:** separate enrichment artifact, provider adapter, candidate-edge schema, evidence/confidence validation, CLI/UI opt-in controls, and provenance-layer toggles.
**Uses:** direct SDK integration behind a PaperParser interface, not a framework-heavy agent stack.
**Avoids:** non-deterministic base artifacts and invisible AI mutations.

### Phase 5: Gold-Paper Evaluation and Regression Gate
**Rationale:** The milestone succeeds when one fixed paper is measurably useful, not when demos "look better."
**Delivers:** gold-paper acceptance fixture, object/edge regression checks, parser-warning reports, explorer usability checks, and a freeze point before broader corpus ambitions.
**Addresses:** the project’s stated success bar from `.planning/PROJECT.md`.
**Avoids:** heuristic churn without a stable definition of done.

### Phase Ordering Rationale

- Phase 1 must come first because typed extraction, stable IDs, and evidence all depend on reliable normalization and source spans.
- Phase 2 comes before UI work because the explorer should consume a trustworthy contract, not force the schema indirectly.
- Phase 3 should ship before any AI overlay because the deterministic graph itself is the milestone’s core product value.
- Phase 4 is intentionally late because semantic dependency completion is probabilistic and must remain reviewable.
- Phase 5 is a dedicated gate, not a cleanup task, because the project explicitly succeeds on one representative heavy paper rather than broad format coverage.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** paper-specific TeX macro/package handling is the highest implementation uncertainty, especially around theorem declarations and source mapping.
- **Phase 4:** model prompting, evidence extraction, and acceptance thresholds for math-specific semantic edges need tighter evaluation design before coding.

Phases with standard enough patterns to skip a separate research phase:
- **Phase 2:** schema evolution, immutable JSON snapshots, and provenance contracts are already well framed by the existing repo and cited standards.
- **Phase 3:** shared materialization/query services plus a React/Vite local explorer are straightforward once the deterministic artifact is stable.
- **Phase 5:** regression gating is mostly product discipline on the chosen gold paper, not an open technical unknown.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Strong brownfield fit: current repo baseline is clear, and the main recommendations come from official/primary docs plus repo reality. |
| Features | MEDIUM | The v1 boundaries are coherent, but differentiator priority is partly inferred from adjacent literature tools rather than direct user studies for PaperParser. |
| Architecture | MEDIUM | The package boundaries and trust model are well supported, but exact implementation details still depend on the gold paper’s TeX shape. |
| Pitfalls | HIGH | TeX/notation/provenance risks are strongly supported by domain literature and closely match the project’s stated trust requirements. |

**Overall confidence:** MEDIUM

### Gaps to Address

- **Gold paper not yet formalized:** select the representative heavy paper now and define the acceptance artifact before implementation starts.
- **Schema delta not yet specified:** decide the minimum contract additions for stable IDs, source anchors, provenance, and run metadata before parallel work begins.
- **`@xyflow/react` may be optional:** validate the existing explorer against the gold paper before committing to a graph-canvas dependency.
- **Enrichment ontology still open:** define the first small set of allowed inferred edge kinds before building prompts or UI toggles.
- **Paper-specific config policy is unresolved:** decide where macro/environment bindings live so one-paper hardening does not become hidden parser debt.

## Sources

### Primary (HIGH confidence)
- [.planning/PROJECT.md](../PROJECT.md) — product scope, first-user workflow, and milestone constraints
- [README.md](../../README.md) — current brownfield repo surfaces and verified runtime baseline
- [Unified LaTeX](https://github.com/siefkenj/unified-latex) — deterministic TeX AST strategy
- [JSON Schema Specification](https://json-schema.org/specification) — canonical contract guidance
- [AJV documentation](https://ajv.js.org/) — runtime schema validation
- [Vite static deploy guide](https://vite.dev/guide/static-deploy.html) — static-export model for the explorer
- [MCP Resources](https://modelcontextprotocol.io/specification/2025-03-26/server/resources) — raw artifact exposure
- [MCP Tools](https://modelcontextprotocol.io/specification/2025-03-26/server/tools) — derived query operations
- [W3C PROV-Overview](https://www.w3.org/TR/prov-overview/) — provenance model for edge evidence and enrichment audits

### Secondary (MEDIUM confidence)
- [TheoremSearch](https://theoremsearch.com/) — theorem-level access as a real user expectation
- [ResearchRabbit citations/references](https://learn.researchrabbit.ai/en/articles/12454564-how-do-i-see-citations-and-references-in-the-new-researchrabbit) — graph navigation and inspection expectations
- [Litmaps create a Litmap](https://docs.litmaps.com/en/articles/9057179-create-a-litmap) — graph scoping/filtering patterns
- [Semantic Scholar tutorials](https://www.semanticscholar.org/product/tutorials) — evidence/explanation expectations for relation views
- [Local-first software](https://www.inkandswitch.com/essay/local-first/) — local snapshot persistence rationale

### Tertiary (LOW confidence for direct implementation detail, high value for risk framing)
- [LaTeXML manual](https://dlmf.nist.gov/LaTeXML/manual.pdf) — TeX semantics/paper-specific bindings risk
- [plasTeX package handling](https://plastex.github.io/plastex/plastex/sec-packages.html) — macro/package handling risk
- [NaturalProofs](https://openreview.net/forum?id=Jvxa8adr3iY) — proof dependency ambiguity and evidence requirements
- [Towards Grounding of Formulae](https://aclanthology.org/2020.sdp-1.16/) — notation ambiguity inside documents
- [What Is Needed for Intra-document Disambiguation of Math Identifiers?](https://aclanthology.org/2024.lrec-main.1522/) — scope-aware symbol grounding
- [An Approach to Co-reference Resolution and Formula Grounding for Mathematical Identifiers Using Large Language Models](https://aclanthology.org/2024.mathnlp-1.1/) — limits and promise of enrichment

---
*Research completed: 2026-04-02*
*Ready for roadmap: yes*
