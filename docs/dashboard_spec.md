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
  --kind-external: #6e7681;     /* dim gray */

  /* Evidence colors */
  --evidence-explicit: #58a6ff;
  --evidence-inferred: #d29922;
  --evidence-external: #6e7681;

  /* Novelty colors */
  --novelty-new: #3fb950;
  --novelty-classical: #8b949e;
  --novelty-extended: #d29922;
  --novelty-folklore: #6e7681;

  /* Severity colors */
  --severity-high: #f85149;
  --severity-medium: #d29922;
  --severity-low: #8b949e;

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

```jsonc
{
  "schema_version": "0.1.0",
  "created_at": "2026-03-01T10:00:00Z",

  "paper": {
    "title": "On the Existence of Solutions to ...",
    "authors": ["A. Author", "B. Coauthor"],
    "arxiv_id": "2501.12345",               // optional
    "source_file": "paper.tex"              // or "paper.pdf"
  },

  "scope": {
    "sections_analyzed": ["1", "2", "3", "4", "5"],
    "exclude": []                            // sections skipped, if any
  },

  "producer": {
    "agent": "claude-opus-4-20250514",
    "schema_version": "0.1.0",
    "tools_used": [],
    "timestamp_start": "2026-03-01T10:00:00Z",
    "timestamp_end": "2026-03-01T10:05:00Z"
  }
}
```

### graph.json

```jsonc
{
  "nodes": [
    {
      "id": "thm_4_1",                        // unique stable ID
      "kind": "theorem",                      // enum: theorem | definition | lemma |
                                               //       proposition | corollary |
                                               //       assumption | remark | external
      "label": "Theorem 4.1",                 // display name
      "section": "4",                          // paper section number/ID
      "number": "4.1",                         // original numbering in paper
      "statement": "For every $\\epsilon > 0$, there exists...",  // LaTeX source
      "proof_status": "full",                  // full | sketch | omitted | none
      "novelty": "new",                        // new | classical | extended | folklore
      "is_main_result": true,                  // boolean
      "metadata": {}                           // optional extras
    }
  ],

  "edges": [
    {
      "source": "thm_4_1",                    // node ID (the result being proved)
      "target": "lem_3_2",                     // node ID (the dependency used)
      "kind": "uses",                          // uses | generalizes | specializes | equivalent
      "evidence": "explicit_ref",              // explicit_ref | inferred | external
      "detail": "Applied in proof of Thm 4.1, step 3",  // optional human-readable note
      "metadata": {}
    }
  ]
}
```

**Edge direction convention:** `source` --uses--> `target` means "source depends on target". In the force graph, arrows point from the result toward its dependencies.

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
| `external` | Result cited from another paper (not proved here) | `--kind-external` |

**Edge kind enum:**

| Kind | Description |
|------|-------------|
| `uses` | Logical dependency: source's proof uses target |
| `generalizes` | Source generalizes target |
| `specializes` | Source is a special case of target |
| `equivalent` | Bidirectional logical equivalence |

**Evidence enum:**

| Level | Meaning |
|-------|---------|
| `explicit_ref` | Paper explicitly cites this dependency (e.g., "by Lemma 3.2") |
| `inferred` | Agent inferred the dependency from proof structure |
| `external` | Dependency on a result from another paper |

### index.json

```jsonc
{
  "problem_statement": {
    "summary": "This paper studies the existence and regularity of solutions to...",
    "formal": "Given $X$ satisfying (A1)--(A3), does there exist...",  // LaTeX
    "context": "This is a long-standing open problem in..."
  },

  "main_results": [
    {
      "node_id": "thm_4_1",
      "summary": "Existence of weak solutions under minimal regularity assumptions",
      "significance": "Resolves the conjecture of Smith (2019) in dimension n >= 3"
    }
  ],

  "sections": [
    {
      "id": "1",
      "title": "Introduction",
      "summary": "Motivates the problem, states main results informally.",
      "members": ["thm_1_1"]                  // node IDs in this section
    }
  ],

  "proof_strategies": [
    {
      "node_id": "thm_4_1",
      "strategy": "Proof by contradiction using compactness + key estimate from Lemma 3.2",
      "key_steps": [
        "Assume negation: no solution in the given class",
        "Construct approximate solutions via Galerkin method",
        "Apply compactness (Lem 3.2) to extract convergent subsequence",
        "Derive contradiction with energy bound (Lem 3.5)"
      ],
      "noise_removed": "Routine epsilon-delta estimates and standard Sobolev embeddings"
    }
  ],

  "innovation_assessment": {
    "summary": "The paper introduces a genuinely new compactness argument...",
    "calibration": "significant",              // significant | incremental | straightforward
    "innovations": [
      {
        "claim": "Novel compactness criterion for degenerate operators",
        "calibration": "significant",
        "evidence_node": "lem_3_2",
        "detail": "Extends classical Aubin-Lions lemma to the degenerate setting"
      }
    ],
    "prior_work": [
      {
        "reference": "[12] Smith, 2019",
        "relation": "extends",                 // extends | improves | alternative | contradicts
        "target_node": "thm_4_1",
        "detail": "Smith proved the n=2 case; this paper handles n >= 3"
      }
    ]
  },

  "attention": [
    {
      "target": "lem_3_5",
      "reason": "Energy estimate with unclear constant dependence on dimension",
      "severity": "high"                       // high | medium | low
    }
  ],

  "unknowns": [
    {
      "id": "u1",
      "question": "Is the regularity assumption (A3) necessary, or an artifact of the proof method?",
      "scope": "paper",                        // proof_step | section | paper
      "severity": "important",                 // low | important | critical
      "related": ["thm_4_1", "asm_1"],
      "search_hint": "Check Smith 2019 Remark 3.4 for discussion of (A3)"
    }
  ],

  "stats": {
    "definitions": 8,
    "theorems": 3,
    "lemmas": 12,
    "propositions": 2,
    "corollaries": 4,
    "assumptions": 3,
    "remarks": 5,
    "external": 6,
    "edges": 67,
    "sections": 6,
    "evidence_breakdown": {
      "explicit_ref": 48,
      "inferred": 14,
      "external": 5
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

A horizontal row of stat cards. Each card shows a count and label. Data source: `index.json.stats`.

Cards displayed (in order):
1. Definitions -- count = `stats.definitions`
2. Theorems -- count = `stats.theorems`
3. Lemmas -- count = `stats.lemmas`
4. Propositions -- count = `stats.propositions`
5. Corollaries -- count = `stats.corollaries`
6. Edges -- count = `stats.edges`
7. Sections -- count = `stats.sections`

Each card: `var(--bg-surface)` background, `var(--radius-md)` corners, `var(--gap-md)` padding. Count in 24px font-weight 600, label in 12px `var(--text-secondary)`. Cards colored by corresponding `--kind-*` variable for the node type (e.g., theorem card has `--kind-theorem` accent). Edges and Sections cards use `var(--accent)`.

#### Problem Statement Card

Left column, 50% width. Data source: `index.json.problem_statement`.

- **Header:** "Problem Statement" with subtle icon
- **Summary:** `problem_statement.summary` in body text
- **Formal statement:** `problem_statement.formal` rendered via KaTeX in a highlighted block (`var(--bg-secondary)` background, `var(--border)` left border 3px)
- **Context:** `problem_statement.context` in `var(--text-secondary)`

#### Innovation Assessment Card

Right column, 50% width. Data source: `index.json.innovation_assessment`.

- **Header:** "Innovation Assessment" with calibration badge
- **Calibration badge:** colored pill next to header
  - `significant` -- `var(--calibration-significant)` background, white text
  - `incremental` -- `var(--calibration-incremental)` background, dark text
  - `straightforward` -- `var(--calibration-straightforward)` background, dark text
- **Summary:** `innovation_assessment.summary` in body text
- **Innovation count:** e.g., "3 innovation claims" as a subtitle
- **Link:** "See details -->" navigates to `#/innovation`

#### BubbleChart (Section Map)

D3 packed circle layout (`d3.pack()`). Data source: `index.json.sections`.

- Each section is a bubble
- **Size:** proportional to `section.members.length` (number of nodes in section)
- **Color:** determined by the dominant node kind among `section.members`. Look up each member's `kind` in `graph.json.nodes`, find the most frequent kind, and use its `--kind-*` color variable
- **Label:** `section.title` centered in bubble. Truncate if too long; full title on hover tooltip
- **Click:** `navigateToSection(section.id)` -- navigates to ProofGraph filtered by that section
- **Hover tooltip:** section title, member count, dominant kind

Minimum bubble size: 40px diameter (so small sections remain clickable).

#### Main Results List

Below the BubbleChart. Data source: `index.json.main_results`.

Each item is a horizontal card:
- Left: colored dot using the node's `--kind-*` color
- **Label:** node label (e.g., "Theorem 4.1") in font-weight 600
- **Summary:** `main_results[].summary`
- **Significance:** `main_results[].significance` in `var(--text-secondary)`
- **Click:** `navigateToNode(main_results[].node_id)`

#### Top Attention Items

Below Main Results. Show the first 3 items from `index.json.attention`, sorted by severity (high first).

Each item:
- Severity badge: colored pill (`--severity-high` / `--severity-medium` / `--severity-low`)
- Target label (look up node in `graph.json` to get label)
- Reason text (truncated to 2 lines)
- Click: `navigateToNode(attention[].target)`

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
- Options: `theorem`, `definition`, `lemma`, `proposition`, `corollary`, `assumption`, `remark`, `external`
- Each option shows a colored dot matching `--kind-*`
- Default: all selected
- Behavior: hide nodes whose `kind` is not selected; hide edges connected to hidden nodes

**Section dropdown:**
- Options: "All sections" + each section from `index.json.sections`
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
  - `omitted`: red "Proof omitted"
  - `none`: gray "No proof" (for definitions, assumptions)
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

A collapsible tree built from `index.json.sections` and `graph.json.nodes`.

**Structure:**
- Top-level items: sections from `index.json.sections`, ordered by `section.id`
- Each section expands to show its member nodes (from `section.members`, resolved against `graph.json.nodes`)
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
- **Summary:** `section.summary` in body text
- **Results list:** all member nodes listed as cards:
  - Kind icon (colored circle) + label + kind badge
  - `node.statement` rendered via KaTeX (first 2 lines, expandable)
  - Click card: switch Detail Panel to node view for that node

**Node view** (when a node row is clicked):
- **Header:** `node.label` in 20px font-weight 600, with kind badge and novelty badge
- **Statement:** `node.statement` rendered via KaTeX in a highlighted block (same styling as DetailSidebar)
- **Proof Strategy card** (if `index.json.proof_strategies` has an entry with matching `node_id`):
  - Card with `var(--bg-secondary)` background, `var(--radius-md)` corners
  - **Header:** "Proof Strategy"
  - **Strategy text:** `proof_strategies[].strategy`
  - **Key steps:** ordered list of `proof_strategies[].key_steps[]`
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
|  | Evidence: Lem 3.2          [View ->]      ||
|  +------------------------------------------+|
|  +------------------------------------------+|
|  | [INCREMENTAL] Improved regularity bound   ||
|  | "Sharpens constant in Smith's estimate"   ||
|  | Evidence: Thm 4.1          [View ->]      ||
|  +------------------------------------------+|
+----------------------------------------------+
|  Prior Work Comparison (table)               |
|  [12] Smith 2019 -> extends -> Thm 4.1      |
|  [7]  Jones 2020 -> improves -> Lem 3.2     |
+----------------------------------------------+
|  Attention Items (high-severity first)       |
|  Cards sorted by severity                    |
+----------------------------------------------+
```

#### Innovation Summary Card

Full-width card at top. Data source: `index.json.innovation_assessment`.

- **Header:** "Innovation Assessment" in 20px font-weight 600
- **Calibration badge:** (same as Overview card) next to header
- **Summary text:** `innovation_assessment.summary`
- Background: `var(--bg-surface)`, border-left 4px using the calibration color

#### Innovation Items (card list)

Each item from `index.json.innovation_assessment.innovations`. Displayed as vertical card list.

**Card content:**
- **Calibration badge:** colored pill
  - `significant`: `var(--calibration-significant)`, text "SIGNIFICANT"
  - `incremental`: `var(--calibration-incremental)`, text "INCREMENTAL"
  - `straightforward`: `var(--calibration-straightforward)`, text "STRAIGHTFORWARD"
- **Claim text:** `innovations[].claim` in font-weight 600
- **Detail:** `innovations[].detail` in body text
- **Evidence link:** "Evidence: {node label}" -- resolve `innovations[].evidence_node` against `graph.json.nodes` to get label. Clickable: `navigateToNode(evidence_node)`
- **"View -->" button:** same as evidence link navigation

Card background: `var(--bg-surface)`. Border-left: 3px using the item's calibration color.

#### Prior Work Comparison Table

Data source: `index.json.innovation_assessment.prior_work`.

| Column | Width | Content |
|--------|-------|---------|
| Reference | 30% | `prior_work[].reference` (e.g., "[12] Smith, 2019") |
| Relation | 15% | `prior_work[].relation` as a colored badge: `extends` = blue, `improves` = green, `alternative` = amber, `contradicts` = red |
| Target | 25% | Target node label (resolved from `prior_work[].target_node`), clickable |
| Detail | 30% | `prior_work[].detail` |

Click target node: `navigateToNode(target_node)`.

Table styling: `var(--bg-surface)` header row, alternating row backgrounds `var(--bg-primary)` / `var(--bg-secondary)`.

#### Attention Items

Below the prior work table. Shows ALL items from `index.json.attention`, sorted by severity (high -> medium -> low).

**Card content** (same design as Overview attention cards but full-width):
- Severity badge: colored pill
- Target label: resolved from `graph.json.nodes`
- Reason text: full text (not truncated)
- Click: `navigateToNode(attention[].target)`

---

### 5. Unknowns

**Purpose:** Surface gaps in understanding. What could not be determined?

**Layout:** Filterable table with controls above.

**Filters (horizontal bar above table):**

1. **Scope dropdown:**
   - Options: "All scopes", `proof_step`, `section`, `paper`
   - Default: "All scopes"
   - Behavior: filter rows where `unknowns[].scope` matches selection

2. **Severity dropdown:**
   - Options: "All severities", `critical`, `important`, `low`
   - Default: "All severities"
   - Behavior: filter rows where `unknowns[].severity` matches selection

**Table columns:**

| Column | Width | Source | Rendering |
|--------|-------|--------|-----------|
| Question | 40% | `unknowns[].question` | Body text, word-wrap |
| Scope | 10% | `unknowns[].scope` | Badge: `proof_step` = blue, `section` = amber, `paper` = purple |
| Severity | 10% | `unknowns[].severity` | Colored badge: `critical` = `var(--severity-high)`, `important` = `var(--severity-medium)`, `low` = `var(--severity-low)` |
| Related | 20% | `unknowns[].related[]` | Comma-separated clickable node labels. Resolve each ID against `graph.json.nodes` to get the display label |
| Search Hint | 20% | `unknowns[].search_hint` | `var(--text-secondary)` italic text. Provides guidance on where to look for answers |

**Interactions:**
- Click a related node label: `navigateToNode(nodeId)` -- navigates to ProofGraph, selects + centers on that node
- Sort: click column header to sort. Default sort: severity descending (critical first), then scope
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

// Section -> nodes mapping (from index.sections)
const sectionNodes = new Map();  // sectionId -> [node objects]

// Main results set
const mainResultIds = new Set(graph.nodes.filter(n => n.is_main_result).map(n => n.id));

// Proof strategy lookup
const proofStrategyMap = new Map(index.proof_strategies.map(ps => [ps.node_id, ps]));
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
| Click evidence node (InnovationMap) | InnovationMap | Navigate to ProofGraph, select that node |
| Click prior work target (InnovationMap) | InnovationMap | Navigate to ProofGraph, select that node |
| Click attention item (InnovationMap) | InnovationMap | Navigate to ProofGraph, select that node |
| Change scope filter (Unknowns) | Unknowns | Filter table rows by scope |
| Change severity filter (Unknowns) | Unknowns | Filter table rows by severity |
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
