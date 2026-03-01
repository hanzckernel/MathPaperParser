# PaperParser -- Dashboard Specification

## Stack

| Layer | Choice | Version |
|-------|--------|---------|
| Framework | Svelte | 5.x |
| Bundler | Vite | 6.x |
| Visualization | D3.js | 7.x |
| Math rendering | KaTeX | latest |
| Styling | Vanilla CSS (custom properties) | -- |
| Routing | Svelte client-side (hash-based) | -- |

**No server required.** The dashboard is a static site that reads JSON from a `data/` directory via `fetch()`.

---

## Design System

### Theme: Dark mode primary

```css
:root {
  --bg-primary: #0d1117;
  --bg-secondary: #161b22;
  --bg-surface: #21262d;
  --text-primary: #e6edf3;
  --text-secondary: #8b949e;
  --border: #30363d;
  --accent: #58a6ff;

  /* Math object colors (node kinds) */
  --kind-theorem: #58a6ff;      /* blue */
  --kind-definition: #3fb950;   /* green */
  --kind-lemma: #d29922;        /* amber */
  --kind-proposition: #a371f7;  /* purple */
  --kind-corollary: #79c0ff;    /* light blue */
  --kind-assumption: #f85149;   /* red */
  --kind-remark: #8b949e;       /* gray */
  --kind-example: #39c5bb;      /* teal */
  --kind-conjecture: #ff7b72;   /* salmon */
  --kind-notation: #c9d1d9;     /* light gray */
  --kind-external_dependency: #6e7681; /* dim gray */

  /* Evidence colors */
  --evidence-explicit: #58a6ff;
  --evidence-inferred: #d29922;
  --evidence-external: #6e7681;

  /* Novelty colors */
  --novelty-new: #3fb950;
  --novelty-classical: #8b949e;
  --novelty-extended: #d29922;
  --novelty-folklore: #6e7681;

  /* Difficulty colors (for attention badges) */
  --difficulty-high: #f85149;
  --difficulty-medium: #d29922;
  --difficulty-low: #8b949e;

  /* Calibration colors */
  --calibration-significant: #3fb950;
  --calibration-incremental: #d29922;
  --calibration-straightforward: #8b949e;

  /* Typography */
  --font-sans: 'Inter', -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Spacing */
  --gap-sm: 8px;
  --gap-md: 16px;
  --gap-lg: 24px;
  --gap-xl: 32px;

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
}
```

### Font loading

Include in `index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### KaTeX CSS

Include in `index.html`:
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.css"
      integrity="sha384-..."
      crossorigin="anonymous">
```

KaTeX is also installed as an npm dependency (`npm install katex`) so that Svelte components can import `katex.renderToString()` for inline rendering. The CSS link above provides the font and layout rules that KaTeX's HTML output requires.

### Typography rules

- Body text: `var(--font-sans)`, 14px, `var(--text-primary)`
- Secondary / captions: 12px, `var(--text-secondary)`
- Monospace (IDs, labels): `var(--font-mono)`, 13px
- Math statements: rendered via KaTeX; wrap in a container with `overflow-x: auto` and `max-width: 100%`

---

## Layout

```
+---------------------------------------------------------+
|  PaperParser    [paper title]    [schema v0.1]           |  <- Header (48px)
+----------+----------------------------------------------+
|          |                                              |
|  Nav     |              Page Content                    |
|  Bar     |                                              |
|  [*] Overview                                           |
|  [*] Proof Graph                                        |
|  [*] Theorem Explorer                                   |
|  [*] Innovation Map                                     |
|  [*] Unknowns                                           |
|          |                                              |
+----------+----------------------------------------------+
|  Analyzed by [agent] . [date] . [N] results             |  <- Footer (32px)
+---------------------------------------------------------+
```

### Dimensions

- **Header:** 48px fixed height. Left: "PaperParser" brand text (font-weight 700). Center: paper title from `manifest.json.paper.title`. Right: schema version badge (`v0.1`).
- **Nav bar:** 200px fixed width, collapsible to 48px (icon-only mode). Five page links with icons and labels. Active page highlighted with `var(--accent)` left border (3px).
- **Page content:** `flex-grow`, `min-width: 800px`, padding `var(--gap-lg)`.
- **Footer:** 32px fixed height. Text from `manifest.json.producer`: agent name, analysis date, total node count.
- **Minimum viewport:** 1024px. No mobile support needed.

### Routing

Hash-based client-side routing. URLs:

| Hash | Page |
|------|------|
| `#/` or `#/overview` | Overview |
| `#/proof-graph` | ProofGraph |
| `#/proof-graph?node={id}` | ProofGraph with node pre-selected |
| `#/proof-graph?section={id}` | ProofGraph filtered by section |
| `#/theorem-explorer` | TheoremExplorer |
| `#/theorem-explorer?node={id}` | TheoremExplorer with node selected |
| `#/innovation` | InnovationMap |
| `#/unknowns` | Unknowns |

Navigation functions exposed in `stores/navigation.js`:
- `navigateTo(page)` -- change page
- `navigateToNode(nodeId)` -- go to ProofGraph, select + center on node
- `navigateToSection(sectionId)` -- go to ProofGraph filtered by section

---

## Data Schema (PaperParser v0.1)

The dashboard consumes three JSON files produced by the PaperParser analysis agent. These correspond to the Code Atlas triple (`manifest.json`, `graph.json`, `index.json`) but with fields adapted for mathematical paper analysis.

### manifest.json

The dashboard treats `/schema/*.schema.json` (and `docs/schema_spec.md`) as the single source of truth for JSON shape.

```jsonc
{
  "schema_version": "0.1.0",
  "created_at": "2026-03-01T10:00:00Z",

  "paper": {
    "title": "On the Existence of Solutions to ...",
    "authors": ["A. Author", "B. Coauthor"],
    "arxiv_id": "2501.12345v2",             // optional
    "doi": "10.1234/example.2026.1",        // optional
    "year": 2026,
    "subject_area": "Functional Analysis",
    "source_type": "latex",                 // "latex" | "pdf"
    "source_files": ["main.tex", "appendix.tex"],
    "version_note": "arXiv v2 (Jan 2026)"   // optional
  },

  "scope": {
    "sections_included": ["all"],           // or ["1","2","A"]
    "analysis_level": "both"                // "bird_eye" | "frog_eye" | "both"
  },

  "producer": {
    "agent": "claude-opus-4-20250514",
    "schema_version": "0.1.0",
    "timestamp_start": "2026-03-01T10:00:00Z",
    "timestamp_end": "2026-03-01T10:05:00Z"
  }
}
```

### graph.json

```jsonc
{
  "schema_version": "0.1.0",

  "nodes": [
    {
      "id": "sec4::thm:main",                // canonical ID: sec{N}::{kind_abbrev}:{slug}
      "kind": "theorem",
      "label": "Theorem 4.1 (Main convergence result)",
      "section": "4",
      "section_title": "Main Results",
      "number": "4.1",
      "latex_label": "thm:main",             // null if unavailable
      "statement": "Under Assumptions 1.1–1.3, the scheme $(x_n)$ converges ...",
      "proof_status": "full",                // full | sketch | deferred | external | not_applicable
      "is_main_result": true,
      "novelty": "new",                      // new | classical | extended | folklore
      "metadata": { "proof_length_lines": 120 }
    }
  ],

  "edges": [
    {
      "source": "sec4::thm:main",
      "target": "sec2::lem:key-estimate",
      "kind": "uses_in_proof",               // uses_in_proof | extends | generalizes | specializes | equivalent_to | cites_external
      "evidence": "explicit_ref",            // explicit_ref | inferred | external
      "detail": "Applied in Step 3 to bound iterate differences.",
      "metadata": { "proof_step": "step 3" }
    }
  ]
}
```

**Edge direction convention:** `source` --> `target` means "source depends on target". In the force graph, arrows point from the result toward its dependencies.

**Node kind enum:**

| Kind | Description | Color var |
|------|-------------|-----------|
| `theorem` | Theorem statement | `--kind-theorem` |
| `definition` | Definition | `--kind-definition` |
| `lemma` | Lemma | `--kind-lemma` |
| `proposition` | Proposition | `--kind-proposition` |
| `corollary` | Corollary | `--kind-corollary` |
| `assumption` | Standing assumption or axiom | `--kind-assumption` |
| `remark` | Remark or observation | `--kind-remark` |
| `example` | Example or worked-out special case | `--kind-example` |
| `conjecture` | Open problem / question / conjecture | `--kind-conjecture` |
| `notation` | Notation / symbol convention | `--kind-notation` |
| `external_dependency` | Result cited from another paper (not proved here) | `--kind-external_dependency` |

**Edge kind enum:**

| Kind | Description |
|------|-------------|
| `uses_in_proof` | Logical dependency: source's proof uses target |
| `extends` | Source extends target |
| `generalizes` | Source generalizes target |
| `specializes` | Source is a special case of target |
| `equivalent_to` | Bidirectional logical equivalence (store both directions) |
| `cites_external` | Source depends on an external result (target is an `external_dependency` node) |

**Evidence enum:**

| Level | Meaning |
|-------|---------|
| `explicit_ref` | Paper explicitly cites this dependency (e.g., "by Lemma 3.2") |
| `inferred` | Agent inferred the dependency from proof structure |
| `external` | Dependency on an external reference (book/paper) |

### index.json

```jsonc
{
  "schema_version": "0.1.0",

  "problem_statement": {
    "question": "Under what conditions ... ?",
    "motivation": "Why the question matters ...",
    "context": "How this relates to prior work ..."
  },

  "innovation_assessment": {
    "summary": "One-paragraph summary of what is new (or not).",
    "main_innovations": [
      {
        "description": "Key new idea / technique ...",
        "calibration": "significant",        // significant | incremental | straightforward_extension
        "related_nodes": ["sec3::lem:key-estimate"]
      }
    ],
    "prior_work_comparison": "Explicit comparison to the most relevant prior work ..."
  },

  "clusters": [
    {
      "id": "cluster:preliminaries",
      "label": "Preliminaries and Setup",
      "section": "2",
      "members": ["sec2::def:banach-space", "sec2::lem:key-estimate"],
      "description": "Background definitions and the key estimate."
    }
  ],

  "main_results": [
    {
      "node_id": "sec4::thm:main",
      "headline": "Iterative schemes converge at rate $O(n^{-\\beta})$ under asymptotic contractivity.",
      "significance": "Removes a uniform convexity hypothesis while achieving an optimal rate bound."
    }
  ],

  "proof_strategies": [
    {
      "target_node": "sec4::thm:main",
      "strategy_summary": "High-level proof strategy summary ...",
      "key_steps": [
        {
          "step": 1,
          "description": "Establish boundedness of iterates under standing assumptions.",
          "uses": ["sec1::asm:boundedness"]
        }
      ],
      "noise_removed": "Routine epsilon–delta estimates and standard embeddings."
    }
  ],

  "summaries": [
    {
      "section": "1",
      "section_title": "Introduction",
      "summary": "Motivates the problem and states the main results."
    }
  ],

  "attention": {
    "high_dependency_nodes": [
      {
        "node_id": "sec2::lem:key-estimate",
        "in_degree": 5,
        "out_degree": 2,
        "note": "Central lemma used by many later results."
      }
    ],
    "demanding_proofs": [
      {
        "node_id": "sec4::thm:main",
        "reason": "Longest and most technically layered proof in the paper.",
        "estimated_difficulty": "high"
      }
    ]
  },

  "unknowns": [
    {
      "id": "unknown:1",
      "description": "Is the regularity assumption (A3) necessary, or an artifact of the proof method?",
      "search_hint": "Check Smith 2019 Remark 3.4 for discussion of (A3).",
      "scope": "paper",                      // proof_step | section | paper
      "related_nodes": ["sec4::thm:main", "sec1::asm:rate-exponent"]
    }
  ],

  "notation_index": [
    {
      "symbol": "$T$",
      "meaning": "Iteration operator $T: X \\to X$.",
      "introduced_in": "sec1::asm:operator"
    }
  ],

  "stats": {
    "node_counts": {
      "definition": 8,
      "theorem": 3,
      "lemma": 12,
      "proposition": 2,
      "corollary": 4,
      "assumption": 3,
      "remark": 5,
      "example": 0,
      "conjecture": 0,
      "notation": 4,
      "external_dependency": 6,
      "total": 47
    },
    "edge_counts": {
      "uses_in_proof": 67,
      "extends": 0,
      "generalizes": 0,
      "specializes": 0,
      "equivalent_to": 0,
      "cites_external": 5,
      "total": 72
    },
    "evidence_breakdown": {
      "explicit_ref": 48,
      "inferred": 14,
      "external": 10
    }
  }
}
```

---

## Page Specifications

### 1. Overview

**Purpose:** Bird's-eye view. What is this paper about? What matters?

**Layout:**
```
+----------------------------------------------+
|  Stats Row                                   |
|  [8 defs] [3 thms] [12 lems] [2 props]      |
|  [4 cors] [67 edges] [6 sections]            |
+----------------------+-----------------------+
|  Problem             |  Innovation            |
|  Statement           |  Assessment            |
|  Card                |  Card                  |
+----------------------+-----------------------+
|  Section Map (BubbleChart)                   |
|  + Main Results list                         |
|  + Top Attention items                       |
+----------------------------------------------+
```

**Components:**

#### StatsBar

A horizontal row of stat cards. Each card shows a count and label. Data source: `index.json.stats` (plus a derived section count from `graph.json.nodes`).

Cards displayed (in order):
1. Definitions -- count = `stats.node_counts.definition`
2. Theorems -- count = `stats.node_counts.theorem`
3. Lemmas -- count = `stats.node_counts.lemma`
4. Propositions -- count = `stats.node_counts.proposition`
5. Corollaries -- count = `stats.node_counts.corollary`
6. Edges -- count = `stats.edge_counts.total`
7. Sections -- count = number of unique `node.section` values in `graph.json.nodes` excluding `"0"`

Each card: `var(--bg-surface)` background, `var(--radius-md)` corners, `var(--gap-md)` padding. Count in 24px font-weight 600, label in 12px `var(--text-secondary)`. Cards colored by corresponding `--kind-*` variable for the node type (e.g., theorem card has `--kind-theorem` accent). Edges and Sections cards use `var(--accent)`.

#### Problem Statement Card

Left column, 50% width. Data source: `index.json.problem_statement`.

- **Header:** "Problem Statement" with subtle icon
- **Question:** `problem_statement.question` in body text (KaTeX inline supported)
- **Motivation:** `problem_statement.motivation` in `var(--text-secondary)`
- **Context:** `problem_statement.context` in `var(--text-secondary)`

#### Innovation Assessment Card

Right column, 50% width. Data source: `index.json.innovation_assessment`.

- **Header:** "Innovation Assessment"
- **Summary:** `innovation_assessment.summary` in body text
- **Innovation count:** e.g., "3 innovations" as a subtitle (from `innovation_assessment.main_innovations.length`)
- **Link:** "See details -->" navigates to `#/innovation`

#### BubbleChart (Section Map)

D3 packed circle layout (`d3.pack()`). Data source: section groups derived from `graph.json.nodes` (optionally enriched with titles from `index.json.summaries`).

- Each section is a bubble
- **Size:** proportional to the number of nodes with `node.section === sectionId`
- **Color:** determined by the dominant node kind among nodes in that section
- **Label:** section title (from `index.json.summaries` where `summaries[].section === sectionId`, fallback to sectionId)
- **Click:** `navigateToSection(sectionId)` -- navigates to ProofGraph filtered by that section
- **Hover tooltip:** section title, member count, dominant kind

Minimum bubble size: 40px diameter (so small sections remain clickable).

#### Main Results List

Below the BubbleChart. Data source: `index.json.main_results`.

Each item is a horizontal card:
- Left: colored dot using the node's `--kind-*` color
- **Label:** node label (e.g., "Theorem 4.1") in font-weight 600
- **Headline:** `main_results[].headline`
- **Significance:** `main_results[].significance` in `var(--text-secondary)`
- **Click:** `navigateToNode(main_results[].node_id)`

#### Top Attention Items

Below Main Results. Show a short combined list derived from `index.json.attention`:
- Top 2 `attention.high_dependency_nodes`
- Top 1 `attention.demanding_proofs`

Each item:
- Badge: either "High dependency" or difficulty badge (`low`/`medium`/`high`)
- Target label (resolve node_id in `graph.json.nodes`)
- Note/reason text (truncated to 2 lines)
- Click: `navigateToNode(node_id)`

---

### 2. ProofGraph (Dependency Graph)

**Purpose:** Interactive exploration of logical dependencies between mathematical objects.

**Layout:**
```
+------------------------------------------------+
|  FilterBar                                     |
|  [Kind v] [Section v] [Evidence v] [search]    |
|  [Toggle: Bird-eye / Frog-eye]                 |
+----------------------------+-------------------+
|                            |                   |
|  Force-Directed Graph      |  Detail Sidebar   |
|  (ForceGraph)              |  (DetailSidebar)  |
|                            |                   |
|                            |  Thm 4.1 (Main)   |
|                            |  Statement: ...   |
|                            |  [KaTeX rendered] |
|                            |  Proof status:full|
|                            |  Novelty: new     |
|                            |                   |
|                            |  Uses (out):      |
|                            |  -> Lem 3.2       |
|                            |  -> Def 2.1       |
|                            |                   |
|                            |  Used by (in):    |
|                            |  <- Cor 5.1       |
+----------------------------+-------------------+
```

#### FilterBar

Positioned above the graph area. Horizontal flex layout.

**Kind multi-select:**
- Options: `theorem`, `definition`, `lemma`, `proposition`, `corollary`, `assumption`, `remark`, `example`, `conjecture`, `notation`, `external_dependency`
- Each option shows a colored dot matching `--kind-*`
- Default: all selected
- Behavior: hide nodes whose `kind` is not selected; hide edges connected to hidden nodes

**Section dropdown:**
- Options: "All sections" + each section derived from `graph.json.nodes` (unique `node.section` values excluding `"0"`). Display labels use the best available title:
  - Prefer `index.json.summaries[].section_title` where `summaries[].section === sectionId`
  - Fallback to `graph.json.nodes[0].section_title` for that section (if present)
  - Fallback to raw sectionId
- Default: "All sections"
- Behavior: show only nodes whose `section` matches; show edges between visible nodes

**Evidence multi-select:**
- Options: `explicit_ref`, `inferred`, `external`
- Each option shows a colored dot matching `--evidence-*`
- Default: all selected
- Behavior: hide edges whose `evidence` is not selected. Nodes with no remaining visible edges are dimmed (opacity 0.3) but not removed

**Search input:**
- Text input with magnifying glass icon
- Behavior: filter nodes by substring match on `label`, `number`, or `statement`. Non-matching nodes dimmed to opacity 0.15. Matching nodes highlighted with a glow effect (`box-shadow: 0 0 8px var(--accent)`)
- Debounced: 200ms

**Bird-eye / Frog-eye toggle:**
- Two-state toggle button, default: Frog-eye
- **Bird-eye mode:** show only nodes where `is_main_result === true` plus their direct dependencies (1-hop neighbors). All other nodes hidden. This gives a high-level view of the paper's key results
- **Frog-eye mode:** show all nodes (subject to other active filters). Full detail view
- Switching modes re-runs the force simulation with a gentle alpha restart (0.3)

#### ForceGraph (D3 force simulation)

Rendered in an SVG element that fills the available space (page content width minus sidebar).

**Nodes:**
- Shape: circles
- **Size:** radius = `clamp(8, 4 + (in_degree + out_degree) * 2, 30)` pixels. Nodes with more connections appear larger
- **Color:** fill color from `--kind-*` CSS variable matching `node.kind`
- **Stroke:** 1.5px `var(--border)` by default. Main results (`is_main_result === true`) get a double ring: inner stroke 2px `var(--bg-primary)`, outer stroke 2px of the kind color. This creates a distinctive "star/ring" marker
- **Opacity:** 1.0 for active nodes, 0.15 for dimmed (filtered out by search), 0.3 for dimmed (no visible edges after evidence filter)

**Node labels:**
- Always shown for nodes where `is_main_result === true`: positioned below the node, `var(--font-mono)` 11px, `var(--text-primary)`
- For other nodes: shown on hover only (via a tooltip `<g>` element that appears on `mouseenter`)
- Label text: `node.label` (e.g., "Thm 4.1")

**Edges:**
- Shape: lines with arrowhead markers (`marker-end`). Arrow points from source to target (source depends on target, arrow points toward the dependency)
- **Color:** stroke color from `--evidence-*` matching `edge.evidence`
  - `explicit_ref`: `var(--evidence-explicit)` (blue)
  - `inferred`: `var(--evidence-inferred)` (amber)
  - `external`: `var(--evidence-external)` (dim gray)
- **Opacity:** 0.6 default, 1.0 when either endpoint is hovered or selected
- **Stroke width:** 1.5px default, 2.5px when highlighted

**Interactions:**
- **Zoom + pan:** D3 zoom behavior on the SVG container. Zoom range: 0.1x to 5x
- **Drag nodes:** D3 drag behavior. Dragged node is fixed (`fx`, `fy`) while dragging; released on `dragend` (set `fx = fy = null`)
- **Hover node:** enlarge node by 1.5x, show label tooltip, highlight all connected edges (raise opacity to 1.0, increase stroke width)
- **Click node:** select node, populate DetailSidebar. Selected node gets a pulsing glow animation. Connected nodes are subtly highlighted (border glow)
- **Click edge:** select edge, show edge info in DetailSidebar
- **Click background:** deselect current selection, clear DetailSidebar

**Force simulation parameters:**
```javascript
d3.forceSimulation(nodes)
  .force('link', d3.forceLink(edges).id(d => d.id).distance(80))
  .force('charge', d3.forceManyBody().strength(-200))
  .force('center', d3.forceCenter(width / 2, height / 2))
  .force('collision', d3.forceCollide().radius(d => nodeRadius(d) + 4))
  .alpha(0.8)
  .alphaDecay(0.02);
```

**On filter change:** re-compute visible nodes/edges from the full dataset, restart simulation with `alpha(0.3)`. Preserve positions of nodes that remain visible.

#### DetailSidebar

Fixed width: 280px. Right side of the ProofGraph page. Scrollable if content overflows.

**Empty state:** "Click a node or edge to see details" in `var(--text-secondary)`, centered.

**Node view:**
- **Header:** `node.label` in 18px font-weight 600
- **Kind badge:** colored pill using `--kind-*`, text is the kind name capitalized
- **Main result indicator:** if `is_main_result`, show a gold star icon + "Main Result" text
- **Section:** "Section `node.section`"
- **Number:** `node.number` (original paper numbering)
- **Statement:** `node.statement` rendered via KaTeX. Wrapped in a scrollable container with `var(--bg-secondary)` background, `var(--gap-md)` padding, `var(--radius-sm)` corners
- **Proof status badge:** colored text
  - `full`: green "Full proof"
  - `sketch`: amber "Proof sketch"
  - `deferred`: purple "Proof deferred"
  - `external`: gray "External proof"
  - `not_applicable`: gray "Not applicable" (definitions, assumptions, notation, etc.)
- **Novelty badge:** colored pill
  - `new`: `var(--novelty-new)` "New"
  - `classical`: `var(--novelty-classical)` "Classical"
  - `extended`: `var(--novelty-extended)` "Extended"
  - `folklore`: `var(--novelty-folklore)` "Folklore"
- **Uses (outgoing edges):** list heading, then each outgoing edge as a clickable row:
  - Arrow icon (-->), target node label, evidence badge
  - Click: select + center on target node in the graph
- **Used by (incoming edges):** list heading, then each incoming edge as a clickable row:
  - Arrow icon (<--), source node label, evidence badge
  - Click: select + center on source node in the graph

**Edge view:**
- **Header:** "Edge" in 16px font-weight 600
- **Source:** clickable node label (click to select source)
- **Arrow:** "--[kind]-->" with the edge kind as text (e.g., "--uses-->")
- **Target:** clickable node label (click to select target)
- **Evidence badge:** colored pill using `--evidence-*`
- **Detail text:** `edge.detail` if present, in `var(--text-secondary)`

---

### 3. TheoremExplorer

**Purpose:** Navigate the paper's logical content by section structure, with proof strategy details.

**Layout:**
```
+---------------------+--------------------------+
|                     |                          |
|  Section Tree       |  Detail Panel            |
|  (SectionTree)      |                          |
|                     |  Theorem 4.1             |
|  > 1. Intro         |  [statement in KaTeX]    |
|  > 2. Prelims       |                          |
|    Def 2.1          |  Proof Strategy:         |
|    Def 2.2          |  "Contradiction using    |
|  > 3. Key Est       |   compactness + key      |
|    Lem 3.1          |   estimate"              |
|    Lem 3.2 *        |                          |
|  > 4. Main          |  Key Steps:              |
|    Thm 4.1 *        |  1. Assume negation      |
|  > 5. Apps          |  2. Apply compactness    |
|    Cor 5.1          |  3. Derive contradiction |
|                     |                          |
|                     |  Noise Removed:          |
|                     |  "Routine estimates"     |
+---------------------+--------------------------+
```

#### SectionTree (left panel, 280px)

A collapsible tree built from `graph.json.nodes` grouped by `node.section`, with narrative summaries from `index.json.summaries`.

**Structure:**
- Top-level items: sections derived from unique `node.section` values in `graph.json.nodes` (excluding `"0"`), ordered by natural section order
- Each section expands to show its member nodes (those with `node.section === sectionId`)
- Nodes within a section are ordered by `node.number` (natural sort: "2.1" before "2.10")

**Section row:**
- Expand/collapse chevron icon (> / v)
- Section number and title: e.g., "3. Key Estimates"
- Member count badge: "(5)" in `var(--text-secondary)`
- Click section row: expand/collapse children, and populate Detail Panel with section view

**Node row (child of section):**
- Indent: 24px
- Kind icon: small colored circle (8px) using `--kind-*` for the node's kind
- Label: `node.label` (e.g., "Lem 3.2")
- Main result marker: if `is_main_result`, append a star (*) character in `var(--accent)` color
- Click: populate Detail Panel with node view

**Active/selected state:** highlighted background `var(--bg-surface)`, left border 3px `var(--accent)`.

#### Detail Panel (right, fills remaining width)

**Empty state:** "Select a section or result from the tree" in `var(--text-secondary)`, centered.

**Section view** (when a section row is clicked):
- **Header:** "Section {id}: {title}" in 20px font-weight 600
- **Summary:** resolve from `index.json.summaries` where `summaries[].section === sectionId` and display `summaries[].summary` (empty-state text if missing)
- **Results list:** all member nodes listed as cards:
  - Kind icon (colored circle) + label + kind badge
  - `node.statement` rendered via KaTeX (first 2 lines, expandable)
  - Click card: switch Detail Panel to node view for that node

**Node view** (when a node row is clicked):
- **Header:** `node.label` in 20px font-weight 600, with kind badge and novelty badge
- **Statement:** `node.statement` rendered via KaTeX in a highlighted block (same styling as DetailSidebar)
- **Proof Strategy card** (if `index.json.proof_strategies` has an entry with matching `target_node`):
  - Card with `var(--bg-secondary)` background, `var(--radius-md)` corners
  - **Header:** "Proof Strategy"
  - **Strategy text:** `proof_strategies[].strategy_summary`
  - **Key steps:** ordered list of `proof_strategies[].key_steps[]` (each step shows `step`, `description`, and the `uses[]` dependencies as clickable chips)
  - **Noise removed:** if present, a subtle de-emphasized block: "Noise removed: {text}" in `var(--text-secondary)` italic
- **Dependency list:**
  - **Uses:** outgoing edges, each as "-> {target label} ({evidence})"
  - **Used by:** incoming edges, each as "<- {source label} ({evidence})"
  - Click any dependency: `navigateToNode(dep_id)` (navigates to ProofGraph, centers on that node)
- **Proof status** and **Novelty** badges (same rendering as DetailSidebar)
- **"View in graph" link:** `navigateToNode(node.id)` -- navigates to ProofGraph page

---

### 4. InnovationMap

**Purpose:** What is genuinely new in this paper? Honest, calibrated assessment.

**Layout:**
```
+----------------------------------------------+
|  Innovation Summary Card                     |
|  [2-3 sentence honest assessment]            |
|  [SIGNIFICANT] badge                         |
+----------------------------------------------+
|  Innovation Items (card list)                |
|  +------------------------------------------+|
|  | [SIGNIFICANT] Novel compactness criterion ||
|  | "Extends classical Aubin-Lions lemma..."  ||
|  | Related: Lem 3.2, Thm 4.1                 ||
|  +------------------------------------------+|
|  +------------------------------------------+|
|  | [INCREMENTAL] Improved regularity bound   ||
|  | "Sharpens constant in Smith's estimate"   ||
|  | Related: Thm 4.1                          ||
|  +------------------------------------------+|
+----------------------------------------------+
|  Prior Work Comparison (text)                |
+----------------------------------------------+
|  Attention Items (dependency + difficulty)   |
+----------------------------------------------+
```

#### Innovation Summary Card

Full-width card at top. Data source: `index.json.innovation_assessment`.

- **Header:** "Innovation Assessment" in 20px font-weight 600
- **Overall calibration badge:** derived from `innovation_assessment.main_innovations[].calibration` by precedence `significant` > `incremental` > `straightforward_extension` (omit if there are no innovations)
- **Summary text:** `innovation_assessment.summary`
- Background: `var(--bg-surface)`, border-left 4px using the derived overall calibration color (fallback: `var(--accent)`)

#### Innovation Items (card list)

Each item from `index.json.innovation_assessment.main_innovations`. Displayed as vertical card list.

**Card content:**
- **Calibration badge:** colored pill
  - `significant`: `var(--calibration-significant)`, text "SIGNIFICANT"
  - `incremental`: `var(--calibration-incremental)`, text "INCREMENTAL"
  - `straightforward_extension`: `var(--calibration-straightforward)`, text "STRAIGHTFORWARD EXTENSION"
- **Description:** `main_innovations[].description` in body text
- **Related nodes:** render `main_innovations[].related_nodes` as clickable chips; click runs `navigateToNode(nodeId)`

Card background: `var(--bg-surface)`. Border-left: 3px using the item's calibration color.

#### Prior Work Comparison

Data source: `index.json.innovation_assessment.prior_work_comparison`.

Render as a full-width text block under a "Prior Work Comparison" header.

#### Attention Items

Below the prior work comparison. Show `index.json.attention.high_dependency_nodes` and `index.json.attention.demanding_proofs`.

**Card content** (same design as Overview attention cards but full-width):
- Badge:
  - For `high_dependency_nodes`: "High dependency"
  - For `demanding_proofs`: difficulty badge using `estimated_difficulty` (`low`/`medium`/`high`) colored by `--difficulty-*`
- Target label: resolved from `graph.json.nodes`
- Note/reason text: full text (not truncated)
- Click: `navigateToNode(node_id)`

---

### 5. Unknowns

**Purpose:** Surface gaps in understanding. What could not be determined?

**Layout:** Filterable table with controls above.

**Filters (horizontal bar above table):**

1. **Scope dropdown:**
   - Options: "All scopes", `proof_step`, `section`, `paper`
   - Default: "All scopes"
   - Behavior: filter rows where `unknowns[].scope` matches selection

**Table columns:**

| Column | Width | Source | Rendering |
|--------|-------|--------|-----------|
| Unknown | 45% | `unknowns[].description` | Body text, word-wrap |
| Scope | 10% | `unknowns[].scope` | Badge: `proof_step` = blue, `section` = amber, `paper` = purple |
| Related | 20% | `unknowns[].related_nodes[]` | Comma-separated clickable node labels. Resolve each ID against `graph.json.nodes` to get the display label |
| Search Hint | 25% | `unknowns[].search_hint` | `var(--text-secondary)` italic text. Provides guidance on where to look for answers |

**Interactions:**
- Click a related node label: `navigateToNode(nodeId)` -- navigates to ProofGraph, selects + centers on that node
- Sort: click column header to sort. Default sort: scope, then id
- Empty state (no unknowns match filters): "No unknowns match the current filters" centered in `var(--text-secondary)`

**Table styling:**
- Header row: `var(--bg-surface)`, font-weight 600, 12px uppercase
- Body rows: alternating `var(--bg-primary)` / `var(--bg-secondary)`
- Row hover: `var(--bg-surface)` background
- Border: 1px `var(--border)` between rows

---

## Data Loading

The dashboard loads data client-side from the `./data/` directory relative to `index.html`:

```javascript
// In stores/data.js (Svelte store)

async function loadData() {
  const [manifest, graph, index] = await Promise.all([
    fetch('./data/manifest.json').then(r => r.json()),
    fetch('./data/graph.json').then(r => r.json()),
    fetch('./data/index.json').then(r => r.json()),
  ]);

  return { manifest, graph, index };
}
```

Data files are expected at `dashboard/data/` (development) or `dist/data/` (production) relative to `index.html`. The analysis agent copies them there after generation.

### Derived data (computed once on load)

The store should pre-compute and expose these derived structures:

```javascript
// Node lookup map: id -> node object
const nodeMap = new Map(graph.nodes.map(n => [n.id, n]));

// Adjacency lists
const outEdges = new Map();  // nodeId -> [edges where source === nodeId]
const inEdges = new Map();   // nodeId -> [edges where target === nodeId]

// Section -> nodes mapping (derived from graph.nodes)
const sectionNodes = new Map();  // sectionId -> [node objects]

// Main results set
const mainResultIds = new Set(graph.nodes.filter(n => n.is_main_result).map(n => n.id));

// Proof strategy lookup
const proofStrategyMap = new Map(index.proof_strategies.map(ps => [ps.target_node, ps]));
```

These derived structures avoid repeated lookups during rendering.

---

## Interactions Summary

| Action | Source Page | Result |
|--------|------------|--------|
| Click section bubble (Overview) | Overview | Navigate to ProofGraph, filter by that section |
| Click main result (Overview) | Overview | Navigate to ProofGraph, select + center on that node |
| Click attention item (Overview) | Overview | Navigate to ProofGraph, select that node |
| Click "See details" on Innovation card (Overview) | Overview | Navigate to InnovationMap |
| Change Kind filter (ProofGraph) | ProofGraph | Show/hide nodes by kind, re-run simulation |
| Change Section filter (ProofGraph) | ProofGraph | Show/hide nodes by section, re-run simulation |
| Change Evidence filter (ProofGraph) | ProofGraph | Show/hide edges by evidence type |
| Toggle Bird-eye / Frog-eye (ProofGraph) | ProofGraph | Switch between main-results-only and all-nodes view |
| Type in search box (ProofGraph) | ProofGraph | Highlight matching nodes, dim non-matching |
| Click node (ProofGraph) | ProofGraph | Select node, show details in sidebar |
| Click edge (ProofGraph) | ProofGraph | Select edge, show edge info in sidebar |
| Hover node (ProofGraph) | ProofGraph | Enlarge node, show label, highlight connected edges |
| Click dependency in sidebar (ProofGraph) | ProofGraph | Select + center on that node in graph |
| Click section row (TheoremExplorer) | TheoremExplorer | Expand section, show section summary in detail panel |
| Click node row (TheoremExplorer) | TheoremExplorer | Show node details + proof strategy in detail panel |
| Click dependency in detail panel (TheoremExplorer) | TheoremExplorer | Navigate to ProofGraph, select that node |
| Click "View in graph" (TheoremExplorer) | TheoremExplorer | Navigate to ProofGraph, select that node |
| Click related node (InnovationMap) | InnovationMap | Navigate to ProofGraph, select that node |
| Click attention item (InnovationMap) | InnovationMap | Navigate to ProofGraph, select that node |
| Change scope filter (Unknowns) | Unknowns | Filter table rows by scope |
| Click related node (Unknowns) | Unknowns | Navigate to ProofGraph, select that node |
| Click column header (Unknowns) | Unknowns | Sort table by that column |

---

## Component File Structure

```
dashboard/
  src/
    App.svelte              # Root: layout shell, router, data loading
    components/
      Header.svelte         # Top bar: brand, paper title, schema version
      NavBar.svelte         # Left nav with page links + collapse toggle
      Footer.svelte         # Bottom bar: agent, date, count
      StatsBar.svelte       # Stat card row (used in Overview)
      BubbleChart.svelte    # D3 packed circle section map
      ForceGraph.svelte     # D3 force-directed dependency graph
      FilterBar.svelte      # ProofGraph filter controls
      DetailSidebar.svelte  # ProofGraph right panel (node/edge details)
      SectionTree.svelte    # TheoremExplorer left tree
      KatexBlock.svelte     # Reusable KaTeX rendering wrapper
      Badge.svelte          # Reusable colored badge/pill component
      Card.svelte           # Reusable card container
    pages/
      Overview.svelte
      ProofGraph.svelte
      TheoremExplorer.svelte
      InnovationMap.svelte
      Unknowns.svelte
    stores/
      data.js               # Fetch + store manifest, graph, index
      navigation.js         # Hash-based routing + navigation helpers
    lib/
      katex.js              # KaTeX rendering utility functions
      colors.js             # Node kind -> CSS var mapping
      graph-utils.js        # Adjacency list builders, filtering logic
  public/
    mock/                   # Mock data for development
      manifest.json
      graph.json
      index.json
  index.html
  vite.config.js
  package.json
```

---

## Build Output

`npm run build` produces a `dist/` directory:

```
dist/
  index.html              # Main entry point
  assets/
    index-[hash].js       # Svelte app bundle
    index-[hash].css      # Styles
  data/                   # Empty -- agent injects data here after build
```

Opening `dist/index.html` must work without a server (all paths relative, data loaded via `fetch()` from `./data/`).

> **Note:** For local `file://` protocol, `fetch()` may be blocked by CORS. Use one of these fallback commands to serve locally:
> ```bash
> python -m http.server -d dist 8080
> # or
> npx serve dist
> ```
