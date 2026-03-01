# PaperParser — Development Plan

## What This Is

PaperParser is a **protocol + dashboard + prompt suite** for generating structured logical-dependency analyses of mathematical research papers. It is agent-native: the analysis is performed by an LLM agent following a defined protocol, producing machine-readable output that can be rendered as an interactive dashboard or a static Markdown report.

### Three components

| Component | Format | Purpose |
|-----------|--------|---------|
| **Schema Spec** | [docs/schema_spec.md](docs/schema_spec.md) | Defines 3 JSON files: `manifest.json`, `graph.json`, `index.json` |
| **Agent Protocol** | [docs/prompt_protocol.md](docs/prompt_protocol.md) | Step-by-step instructions for analyzing a paper and emitting the schema |
| **Dashboard Template** | [docs/dashboard_spec.md](docs/dashboard_spec.md) → `dashboard/` source | Svelte + Vite + D3 + KaTeX static site consuming the schema |
| **Prompt Suite** | [prompts/](prompts/) | Copy-paste prompts for webchat users (ChatGPT / Gemini) |

### How it works

```
Agent receives paper (LaTeX/PDF) → follows prompt protocol → emits 3 JSON files → dashboard renders them
                                                                                  OR
User pastes prompts into webchat → thinking model produces → static Markdown report with Mermaid.js graphs
```

### Two user classes

| Class | Tool | Output |
|-------|------|--------|
| **A: Agent users** (programmers) | Agent in their environment (Claude Code, etc.) | Interactive dashboard (Svelte + D3 + KaTeX) |
| **B: Webchat users** (non-technical) | Copy-paste prompts into ChatGPT/Gemini | Static Markdown report with Mermaid.js |

### Two analysis levels

| Level | Purpose | Scope |
|-------|---------|-------|
| **Bird's-eye** | Quick read — skeleton, main results, innovation | Main results only, section overview |
| **Frog's-eye** | Deep read — proof strategies, full dependency graph | All lemmas/theorems, proof decomposition |

---

## Architecture

```
parser-run/                         # Output produced by agent
├── manifest.json                   # Paper metadata, scope, producer info
├── graph.json                      # Nodes (math objects) + edges (dependencies)
├── index.json                      # Enrichment (clusters, strategies, unknowns)
└── dashboard/                      # Static site (copied from template + data)
    ├── index.html
    ├── assets/
    └── data/
        ├── manifest.json
        ├── graph.json
        └── index.json

dashboard/                          # Source code (this repo)
├── package.json
├── vite.config.js
├── src/
│   ├── App.svelte
│   ├── main.js
│   ├── pages/
│   │   ├── Overview.svelte         # Bird's-eye stats + bubble chart
│   │   ├── ProofGraph.svelte       # Force-directed dependency graph
│   │   ├── TheoremExplorer.svelte  # Section tree + proof strategies
│   │   ├── InnovationMap.svelte    # New vs. classical assessment
│   │   └── Unknowns.svelte        # Gaps and open questions
│   ├── components/
│   │   ├── ForceGraph.svelte       # D3 force-directed graph
│   │   ├── BubbleChart.svelte      # D3 section visualization
│   │   ├── SectionTree.svelte      # Paper section navigation
│   │   ├── DetailSidebar.svelte    # Node/edge detail + KaTeX
│   │   ├── MathRenderer.svelte     # KaTeX wrapper
│   │   ├── FilterBar.svelte
│   │   └── StatsBar.svelte
│   ├── stores/
│   │   ├── graph.js                # Math graph data store
│   │   └── ui.js                   # Navigation + filter state
│   └── lib/
│       ├── schema.js               # AJV validation
│       └── layout.js               # Section tree + graph layout
├── public/
│   └── mock/                       # Mock data for development
└── tests/

prompts/                            # Class B: webchat prompt suite
├── README.md                       # Usage instructions
├── 00_overview.md                  # Paper ingestion + skeleton
├── 01_bird_eye.md                  # Bird's-eye analysis
├── 02_dependency_graph.md          # Mermaid.js dependency graph
├── 03_frog_eye.md                  # Frog's-eye proof strategies
└── 04_assembly.md                  # Final report assembly
```

---

## Task Breakdown

### Phase 0: Foundation (Schema + Protocol + Mock Data)

#### Task 0.1 — Schema specification
- **Input:** Plan (this doc) + code_atlas reference (`ref/code_atlas/docs/schema_spec.md`)
- **Output:** `docs/schema_spec.md`
- **Status:** ✅ Complete

#### Task 0.2 — Agent protocol
- **Input:** Plan + code_atlas reference (`ref/code_atlas/docs/prompt_protocol.md`)
- **Output:** `docs/prompt_protocol.md`
- **Status:** ✅ Complete

#### Task 0.3 — Dashboard specification
- **Input:** Plan + code_atlas reference (`ref/code_atlas/docs/dashboard_spec.md`)
- **Output:** `docs/dashboard_spec.md`
- **Status:** ✅ Complete

#### Task 0.4 — JSON Schema definitions
- **Input:** `docs/schema_spec.md`
- **Output:** `schema/manifest.schema.json`, `schema/graph.schema.json`, `schema/index.schema.json`
- **Acceptance:** Schemas validate the example JSON in the spec doc
- **Status:** ✅ Complete

#### Task 0.5 — Mock dataset
- **Output:** `schema/examples/` with realistic data modeling a short functional analysis paper (~30 nodes, ~60 edges, 6 sections)
- **Acceptance:** Mock data passes schema validation
- **Status:** ✅ Complete

#### Task 0.6 — Prompt suite (Class B)
- **Output:** `prompts/` with 5 prompts + README
- **Target models:** GPT 5.2 extended thinking (primary), Gemini 3.1 Pro (secondary)
- **Acceptance:** Prompts produce correct Mermaid.js graphs and navigable reports
- **Status:** ✅ Complete

---

### Phase 1: Dashboard Scaffold (Class A)

#### Task 1.1 — Initialize Svelte + Vite project
- **Output:** `dashboard/` with working `npm run dev`
- **Stack:** Svelte 5, Vite 6, D3.js v7, KaTeX
- **Acceptance:** Dev server starts, renders placeholder page

#### Task 1.2 — Data loading + stores
- **Output:** `stores/graph.js`, `stores/ui.js`, `lib/schema.js`
- **Acceptance:** Stores load mock data, expose reactive state for nodes/edges/clusters/strategies/filters

#### Task 1.3 — Navigation shell
- **Output:** `App.svelte` with sidebar nav between 5 pages
- **Acceptance:** Tab/route switching between Overview, ProofGraph, TheoremExplorer, InnovationMap, Unknowns. Dark theme.

---

### Phase 2: Dashboard Pages (Class A)

#### Task 2.1 — Overview page
- **Spec:** [docs/dashboard_spec.md § Overview](docs/dashboard_spec.md)
- **Components:** `StatsBar`, `BubbleChart`, problem statement card, innovation assessment card, main results list
- **Acceptance:** Displays all stats. Sections are clickable → navigates to ProofGraph filtered by section.

#### Task 2.2 — ProofGraph page
- **Spec:** [docs/dashboard_spec.md § ProofGraph](docs/dashboard_spec.md)
- **Components:** `ForceGraph`, `DetailSidebar`, `FilterBar`
- **Interactions:**
  - Filter by: kind, section, evidence type
  - Bird-eye / Frog-eye toggle
  - Click node → sidebar shows statement (KaTeX), proof status, novelty, incoming/outgoing edges
  - Click edge → sidebar shows source, target, kind, evidence, detail
  - Search bar to find nodes by label
- **Acceptance:** Force graph renders all nodes/edges. Filters work. KaTeX renders math. Bird/frog toggle works.

#### Task 2.3 — TheoremExplorer page
- **Spec:** [docs/dashboard_spec.md § TheoremExplorer](docs/dashboard_spec.md)
- **Components:** `SectionTree`, detail panel with proof strategy cards
- **Acceptance:** Tree renders from section structure. Proof strategies display correctly. KaTeX works.

#### Task 2.4 — InnovationMap page
- **Components:** Innovation summary card, innovation items with calibration badges, prior work comparison table, attention items
- **Acceptance:** Calibration badges colored correctly. Prior work table populated.

#### Task 2.5 — Unknowns page
- **Components:** Filterable table with scope, severity, related nodes, search hints
- **Acceptance:** Filters work. Links navigate to ProofGraph.

---

### Phase 3: Agent Integration + Real Data

#### Task 3.1 — Agent skill/protocol test
- Run the protocol (`docs/prompt_protocol.md`) against a real paper provided by user
- Validate output against schemas
- Load into dashboard, verify all pages render

#### Task 3.2 — Agent-driven refinement
- Agent can update graph.json/index.json after initial analysis
- Dashboard hot-reloads on data change

#### Task 3.3 — Cross-validation
- Compare prompt suite output (Class B) vs. dashboard output (Class A) for the same paper
- Ensure agreement on structure and dependencies

---

### Phase 4: Polish + Testing

#### Task 4.1 — Visual polish
- Dark theme with math-object accent colors
- Smooth transitions between pages
- Responsive for ≥1024px width
- KaTeX rendering edge cases (complex formulas, display math)

#### Task 4.2 — Build + export
- `npm run build` → `dist/` folder
- Agent copies `dist/` into `parser-run/dashboard/`, injects data files
- Opening `dist/index.html` works without a server

#### Task 4.3 — End-to-end validation
- Test against 3 papers of varying complexity
- Both pipelines (dashboard + prompt suite)
- Schema validation passes for all outputs

---

## Reference Documents

| Doc | What it contains |
|-----|-----------------|
| [docs/schema_spec.md](docs/schema_spec.md) | Full JSON schema definitions with field types, enums, validation rules |
| [docs/prompt_protocol.md](docs/prompt_protocol.md) | Step-by-step agent instructions for paper analysis |
| [docs/dashboard_spec.md](docs/dashboard_spec.md) | Component-level specs, interactions, visual design |
| [prompts/README.md](prompts/README.md) | Prompt suite usage instructions for webchat users |

---

## Key Constraints

1. **Zero runtime dependencies** — the dashboard is a static site. No server, no database.
2. **Tool-agnostic ingestion** — the protocol works with any agent (Claude, GPT, Gemini). Only the output JSON shape is contractual.
3. **Evidence tagging** — every edge carries `evidence: "explicit_ref" | "inferred" | "external"`.
4. **Honest innovation assessment** — calibrated language required. No sugarcoating.
5. **Unknowns visible** — unresolved items are surfaced with search hints, not hidden.
6. **Math-first** — designed for math papers, not generic scientific papers. LaTeX-aware parsing, proof strategy decomposition, notation tracking.
7. **Forward-compatible prompts** — prompt suite targets GPT 5.2 extended thinking and Gemini 3.1 Pro.

---

## Pitfalls & Mitigations

| # | Pitfall | Mitigation |
|---|---------|------------|
| 1 | Cryptic papers — well-known techniques not stated | Agent web-searches; protocol mandates "search before guessing" |
| 2 | Implicit dependencies — Lemma A uses Lemma B without citing | Two-pass extraction: explicit refs then inferred from proof reading |
| 3 | External references — "by [15, Thm 3.2]" | `external_dependency` nodes; agent fetches cited results |
| 4 | Notation drift — same symbol, different meanings | Notation index built during parsing; conflicts flagged as attention |
| 5 | Proof by reference — "follows from [12]" | Agent identifies what's borrowed; flags as unknown if unclear |
| 6 | Appendix disconnect — key proofs in appendix | Section tree treats appendix as first-class |
| 7 | Scattered assumptions — stated once, used silently later | Dedicated assumption nodes; agent tracks invocations |
| 8 | Multi-paper dependency chains | External dependency subgraph; traces one level deep |
| 9 | LaTeX parsing edge cases — custom macros, \input | Parser resolves includes first, expands \newtheorem |
| 10 | Ambiguous numbering | Node IDs use \label as canonical, fall back to section-relative |
| 11 | Proof sketches vs. full proofs | proof_status field: full, sketch, deferred, external |
| 12 | PDF-only papers | PDF fallback pipeline; reduced accuracy flagged in manifest |
| 13 | Overclaiming innovation | Protocol mandates honest calibration with comparison to prior work |
| 14 | Circular dependencies | Graph supports cycles; dashboard highlights them |
| 15 | Long proofs | Agent identifies sub-steps, creates intermediate nodes |
| 16 | Non-English papers | Agent detects language; flags limitation if needed |
| 17 | Pre-print vs. published differences | Manifest records version (arXiv ID + version) |
