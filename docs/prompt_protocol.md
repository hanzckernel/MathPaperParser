# PaperParser Agent Protocol

> **schema_version:** 0.1.0
> **Adapted from:** Code Atlas codebase-analysis protocol
> **Domain:** Mathematical paper analysis

---

## 1. Purpose

This document is the complete instruction set for an agent tasked with analyzing
a mathematical research paper and producing a **PaperParser bundle** -- a
machine-readable, human-browsable representation of the paper's logical
structure, dependencies, and key insights.

The bundle enables:
- Rapid comprehension of a paper's architecture (definitions, theorems, proofs,
  and how they connect).
- Honest assessment of novelty and technical contribution.
- Interactive exploration via a static dashboard.

The agent MUST follow every step in order. Skipping a step is permitted ONLY when
the user explicitly requests it via the optional focus/skip input.

---

## 2. Input

| # | Input | Required | Notes |
|---|-------|----------|-------|
| 1 | **LaTeX source files** (`.tex`, `.sty`, `.bib`) | Preferred | One or more files; agent resolves `\input`/`\include` trees. |
| 2 | **PDF file** | Fallback | Used when LaTeX is unavailable. Accuracy may be reduced. |
| 3 | **Focus / skip directives** | Optional | E.g. "focus on Sections 3-5", "skip appendix B". |
| 4 | **Analysis level** | Optional | `bird_eye` (high-level structure only), `frog_eye` (detailed proof-level), or `both` (default). |

### Input validation

Before proceeding the agent MUST check:

1. At least one of (1) or (2) is provided.
2. If LaTeX source is provided, verify that the main `.tex` file compiles
   conceptually (i.e., all `\input`/`\include` targets are present).
3. If PDF is provided, confirm text is extractable (not a scanned image without
   OCR). If text extraction fails, abort with a clear error.

---

## 3. Output

```
parser-run/
  manifest.json          # Paper metadata and run configuration
  graph.json             # Nodes (objects) and edges (dependencies)
  index.json             # Enrichment: summaries, strategies, unknowns, stats
  dashboard/
    index.html           # Static single-page dashboard
    data/
      manifest.json      # Symlink or copy
      graph.json         # Symlink or copy
      index.json         # Symlink or copy
    assets/              # CSS, JS for the dashboard
```

All three JSON files MUST validate against the PaperParser JSON schemas
(see `/schemas/` directory if available, otherwise follow the structures
defined in this protocol).

---

## 4. Step-by-Step Protocol

### Step 1: Paper Ingestion

**Goal:** Parse the raw paper into a normalized internal representation and emit
`manifest.json`.

#### 1a. LaTeX path (preferred)

1. **Resolve file tree.** Starting from the main `.tex` file, recursively expand
   every `\input{...}` and `\include{...}` directive to produce a single
   logical document. Record the original file boundaries for provenance.

2. **Expand `\newtheorem` declarations.** Scan the preamble (everything before
   `\begin{document}`) for:
   ```latex
   \newtheorem{<env>}{<printed_name>}[<counter>]
   \newtheorem{<env>}[<shared_counter>]{<printed_name>}
   \newtheorem*{<env>}{<printed_name>}
   ```
   Build a mapping: `env_name -> kind` (e.g., `thm -> theorem`,
   `lem -> lemma`, `defn -> definition`). This mapping is essential for
   Step 2.

3. **Extract preamble notation macros.** Collect every `\newcommand`,
   `\renewcommand`, `\DeclareMathOperator`, and `\def` that defines
   mathematical notation. Store as a list of `{command, expansion, description}`
   for use in the notation index (Step 4i).

4. **Identify `\label` definitions.** Build a map of `label -> location`
   (section number, environment type, environment number). This is the primary
   cross-reference table for edge extraction (Step 3).

5. **Detect metadata:**
   - **Title:** from `\title{...}`.
   - **Authors:** from `\author{...}`. Parse multiple authors separated by
     `\and`, commas, or `\author` blocks.
   - **arXiv ID:** from `\arxiv{...}`, comments, or the filename pattern.
   - **Subject area (MSC codes):** from `\subjclass{...}` or
     `\keywords{...}`.
   - **Abstract:** from `\begin{abstract}...\end{abstract}`.
   - **Section structure:** from `\section`, `\subsection`, `\subsubsection`,
     `\appendix`. Record section numbers and titles.

#### 1b. PDF fallback

1. **Extract structured text** using a PDF text extraction tool.
2. **Attempt to reconstruct section structure** from font sizes, numbering
   patterns, and known formatting conventions (e.g., "1. Introduction",
   "Theorem 3.2").
3. **Flag reduced accuracy.** In the emitted `manifest.json`, set:
   ```json
   "source_type": "pdf",
   "accuracy_warning": "Parsed from PDF; labels, cross-references, and custom environments may be incomplete or inaccurate."
   ```
4. For all subsequent steps, note that `\label`/`\ref` information will be
   unavailable. The agent must rely entirely on Pass 2 (inferred) and
   textual cues ("by Theorem 3.2") for dependency extraction.

#### 1c. Emit `manifest.json`

```json
{
  "schema_version": "0.1.0",
  "title": "...",
  "authors": ["..."],
  "arxiv_id": "...",
  "subject_area": ["..."],
  "abstract": "...",
  "source_type": "latex" | "pdf",
  "accuracy_warning": null | "...",
  "sections": [
    {
      "number": "1",
      "title": "Introduction",
      "level": 1
    },
    {
      "number": "1.1",
      "title": "Main Results",
      "level": 2
    }
  ],
  "analysis_level": "both" | "bird_eye" | "frog_eye",
  "focus_sections": null | ["3", "4", "5"],
  "skip_sections": null | ["B"],
  "newtheorem_map": {
    "thm": "theorem",
    "lem": "lemma",
    "defn": "definition"
  },
  "run_timestamp": "2026-01-15T10:30:00Z"
}
```

**Validation:** Every field except `arxiv_id`, `accuracy_warning`,
`focus_sections`, and `skip_sections` MUST be non-null.

---

### Step 2: Object Extraction --> Nodes

**Goal:** Identify every mathematical object in the paper and represent it as a
node in `graph.json`.

#### 2a. Environment scanning

For each section (respecting focus/skip directives), scan for:

**Standard environments:**
| Environment | Kind |
|---|---|
| `\begin{theorem}` | `theorem` |
| `\begin{lemma}` | `lemma` |
| `\begin{definition}` | `definition` |
| `\begin{proposition}` | `proposition` |
| `\begin{corollary}` | `corollary` |
| `\begin{assumption}` | `assumption` |
| `\begin{remark}` | `remark` |
| `\begin{example}` | `example` |
| `\begin{conjecture}` | `conjecture` |
| `\begin{notation}` | `notation` |
| `\begin{proof}` | (attached to parent) |

**Custom environments:** Any environment name that appears in the
`newtheorem_map` from Step 1. Map it to its canonical kind.

**Key equations:** Equations with `\label` that are referenced elsewhere (via
`\eqref` or `\ref`). These become nodes of kind `equation`.

**Informal objects:** Paragraphs that introduce important concepts without
formal environments (e.g., "We say that X is Y if..."). These should be
captured as kind `definition_informal` only if they introduce notation or
concepts used later.

#### 2b. Per-object extraction

For EACH identified object, extract:

| Field | Description | Required |
|---|---|---|
| `id` | Unique node ID (see convention below) | Yes |
| `kind` | One of the kinds listed above | Yes |
| `label` | LaTeX `\label` value, if present | No |
| `number` | Displayed number (e.g., "3.5") | Yes (if numbered) |
| `name` | Named result (e.g., "Hahn-Banach Theorem") | No |
| `statement` | Full statement text (LaTeX preserved) | Yes |
| `section` | Section number where it appears | Yes |
| `proof` | Full proof text, if `\begin{proof}...\end{proof}` follows | No |
| `proof_status` | See below | Yes |
| `is_main_result` | Boolean | Yes |
| `novelty` | See below | Yes |
| `tags` | List of free-form tags | No |

#### 2c. Node ID convention

The ID format is: `sec{N}::{kind}:{identifier}`

Where:
- `{N}` is the section number (e.g., `2`, `3.1`, `A`).
- `{kind}` is the abbreviated kind: `def`, `thm`, `lem`, `prop`, `cor`,
  `asm`, `rem`, `ex`, `conj`, `not`, `eq`.
- `{identifier}` is the `\label` value (cleaned: replace special characters
  with hyphens) OR the displayed number if no label exists.

**Examples:**
| Object | ID |
|---|---|
| Definition 2.1 with `\label{def:banach-space}` | `sec2::def:banach-space` |
| Theorem 4.3 with `\label{thm:main-convergence}` | `sec4::thm:main-convergence` |
| Lemma 3.5 with no label | `sec3::lem:3.5` |
| Equation (2.7) with `\label{eq:energy-bound}` | `sec2::eq:energy-bound` |
| Assumption A1 in Section 1 | `sec1::asm:A1` |
| Appendix B, Proposition B.3 | `secB::prop:B.3` |

**Uniqueness rule:** If a generated ID collides with an existing one (which
should not happen if labels are unique), append a disambiguating suffix:
`-a`, `-b`, etc.

#### 2d. Tagging `is_main_result`

Mark `is_main_result: true` if ANY of the following hold:
1. The result is stated or referenced in the Introduction/Abstract.
2. The result has a proper name (e.g., "Main Theorem", named after a person).
3. The paper explicitly marks it as a main result (e.g., "Our main result is
   the following").
4. The result is referenced by many other results (high in-degree in the
   dependency graph -- this may be updated after Step 3).

If none of these apply, set `is_main_result: false`.

#### 2e. Tagging `novelty`

Assess each object against the paper's cited prior work:

| Value | Meaning |
|---|---|
| `novel` | Introduced in this paper; not present in cited references. |
| `known` | A classical or previously published result, possibly restated. |
| `adapted` | Based on a known result but modified for this context. |
| `unclear` | Cannot determine from available information. |

When `novelty` is `known` or `adapted`, include a `novelty_source` field with
the citation key or description of where it originates.

#### 2f. Tagging `proof_status`

| Value | Meaning |
|---|---|
| `full` | Complete proof is provided inline. |
| `sketch` | A proof sketch is given (e.g., "Proof sketch", key ideas only). |
| `deferred` | Proof is deferred to appendix or later section. Include `proof_location`. |
| `external` | Proof is in another paper. Include `proof_reference`. |
| `not_applicable` | Object is a definition, assumption, notation, or example. |

#### 2g. Emit nodes to `graph.json`

```json
{
  "schema_version": "0.1.0",
  "nodes": [
    {
      "id": "sec2::def:banach-space",
      "kind": "definition",
      "label": "def:banach-space",
      "number": "2.1",
      "name": null,
      "statement": "A Banach space is a complete normed vector space...",
      "section": "2",
      "proof": null,
      "proof_status": "not_applicable",
      "is_main_result": false,
      "novelty": "known",
      "novelty_source": "standard definition",
      "tags": ["functional-analysis", "spaces"]
    }
  ],
  "edges": []
}
```

The `edges` array is populated in Step 3.

---

### Step 3: Dependency Extraction --> Edges

**Goal:** Determine how mathematical objects depend on each other. Populate the
`edges` array in `graph.json`.

Run three passes over the document. Each pass may produce edges.

#### Pass 1: Explicit references

**Scope:** Scan `\ref{...}`, `\eqref{...}`, and `\cite{...}` within proof
environments (`\begin{proof}...\end{proof}`) and within theorem statements.

**Procedure:**
1. For each `\ref` or `\eqref`, resolve via the label map (from Step 1) to a
   node ID.
2. Create an edge from the node whose proof/statement contains the reference
   TO the referenced node.
3. Set `evidence: "explicit_ref"`.
4. Set `evidence_detail` to the raw reference string (e.g., `"\\ref{lem:key}"`).

**For `\cite` references to entries in the bibliography:**
- If the cited result corresponds to an extracted external_dependency node
  (see Pass 3), create an edge to that node.
- If the `\cite` is a general reference (e.g., "[see 12 for background]"),
  do NOT create an edge unless a specific result is cited.

**Edge schema:**
```json
{
  "source": "sec4::thm:main-convergence",
  "target": "sec3::lem:key-estimate",
  "kind": "uses",
  "evidence": "explicit_ref",
  "evidence_detail": "\\ref{lem:key-estimate} in proof of Theorem 4.3",
  "context": "Applied in the final step to bound the error term."
}
```

#### Pass 2: Inferred dependencies

**Scope:** Read EVERY proof carefully (this is the most intellectually demanding
step). Look for dependencies that exist but are not marked with `\ref`.

**What to look for:**

| Pattern | Example | Action |
|---|---|---|
| **Technique reuse** | "By the same argument as in the proof of Lemma 3.2..." | Edge to sec3::lem:3.2, evidence = inferred |
| **Notation usage** | Proof uses notation $\mathcal{F}_t$ defined in Definition 2.3 but does not cite it | Edge to sec2::def:2.3, evidence = inferred |
| **Unnamed results** | "By a standard compactness argument" that was actually established in Proposition 2.5 of the same paper | Edge to sec2::prop:2.5, evidence = inferred |
| **Definition dependency** | Theorem statement uses a term defined earlier without referencing the definition | Edge to the definition, evidence = inferred |
| **Structural dependency** | Corollary that trivially follows from a theorem | Edge to the theorem, evidence = inferred |
| **Assumption invocation** | Proof uses an assumption (e.g., "since $f$ is Lipschitz") stated in Section 1 | Edge to sec1::asm:..., evidence = inferred |

**Edge schema for inferred edges:**
```json
{
  "source": "sec4::thm:main-convergence",
  "target": "sec2::def:filtration",
  "kind": "uses",
  "evidence": "inferred",
  "evidence_detail": "Proof uses filtration notation F_t without explicit reference.",
  "context": "The filtration structure from Definition 2.3 is used implicitly throughout.",
  "confidence": "high" | "medium" | "low"
}
```

**CRITICAL RULE:** Never mark an inferred edge as `explicit_ref`. When
uncertain whether a dependency exists, still create the edge but set
`confidence: "low"` and `evidence: "inferred"`. It is better to have a
low-confidence edge than to miss a real dependency.

#### Pass 3: External dependencies

**Scope:** For each `\cite` that references a specific result from another paper
(not just a general citation), create an external dependency.

**Procedure:**
1. Identify the cited result: e.g., "[12, Theorem 3.1]" or "by the main
   result of [5]".
2. Create an **external_dependency node** in `graph.json`:
   ```json
   {
     "id": "ext::smith2020::thm:3.1",
     "kind": "external_dependency",
     "source_paper": {
       "cite_key": "smith2020",
       "title": "On the convergence of...",
       "authors": ["Smith, J.", "Doe, A."],
       "year": 2020
     },
     "statement": "If X satisfies condition C, then...",
     "statement_source": "extracted" | "web_search" | "unavailable"
   }
   ```
3. If the cited result's statement is not directly quoted in the paper,
   attempt a **web search** to find it. Prefer arXiv or published versions.
4. Create an edge from the citing node to the external_dependency node:
   ```json
   {
     "source": "sec4::thm:main-convergence",
     "target": "ext::smith2020::thm:3.1",
     "kind": "cites_external",
     "evidence": "external",
     "evidence_detail": "Cites [12, Theorem 3.1] in proof."
   }
   ```

#### Edge `kind` values

| Value | Meaning |
|---|---|
| `uses` | Source depends on target (uses it in proof or statement). |
| `generalizes` | Source generalizes or strengthens target. |
| `specializes` | Source is a special case of target. |
| `equivalent_to` | Source and target are shown to be equivalent. |
| `cites_external` | Source cites target from another paper. |
| `motivates` | Target motivates source (e.g., conjecture motivates theorem). |
| `proof_of` | Source is a proof/proof-step of target (for sub-nodes). |

---

### Step 4: Enrichment --> `index.json`

**Goal:** Produce analytical annotations that help a reader understand the paper
quickly and honestly.

The `index.json` file has the following top-level structure:

```json
{
  "schema_version": "0.1.0",
  "problem_statement": { ... },
  "innovation_assessment": { ... },
  "clusters": [ ... ],
  "main_results": [ ... ],
  "proof_strategies": [ ... ],
  "section_summaries": [ ... ],
  "attention_items": [ ... ],
  "unknowns": [ ... ],
  "notation_index": [ ... ],
  "stats": { ... }
}
```

Each sub-section below specifies the schema and extraction rules.

#### 4a. Problem Statement

Identify the core mathematical question the paper addresses.

```json
{
  "problem_statement": {
    "core_question": "Does the Navier-Stokes equation admit global smooth solutions for arbitrary smooth initial data in 3D?",
    "motivation": "Understanding turbulence in fluid dynamics; one of the Clay Millennium Problems.",
    "context": "Prior work established local existence (Leray 1934) and partial regularity (Caffarelli-Kohn-Nirenberg 1982).",
    "scope": "The paper addresses the case of periodic boundary conditions with small initial data."
  }
}
```

**Rules:**
- `core_question` must be phrased as a precise mathematical question.
- `motivation` explains why anyone should care (applications, connections,
  open problems).
- `context` places the paper in the landscape of prior work.
- `scope` clarifies any restrictions or special cases the paper addresses.

#### 4b. Innovation Assessment

Provide an HONEST evaluation of the paper's contribution. Do NOT sugarcoat.

```json
{
  "innovation_assessment": {
    "calibration": "significant" | "incremental" | "straightforward_extension",
    "justification": "...",
    "novel_contributions": [
      {
        "description": "New interpolation inequality combining X and Y techniques",
        "supporting_nodes": ["sec3::lem:key-estimate"]
      }
    ],
    "known_techniques": [
      {
        "description": "Standard energy method for parabolic PDE",
        "origin": "Evans, Partial Differential Equations, Chapter 7"
      }
    ],
    "comparison_to_prior_work": [
      {
        "prior_work": "[12] Smith & Doe, 2020",
        "relationship": "This paper extends [12] from bounded domains to the whole space. The key new difficulty is...",
        "effort_level": "The extension requires a substantially new argument in Section 4."
      }
    ]
  }
}
```

**Calibration definitions:**

| Level | Criteria |
|---|---|
| `significant` | Introduces a genuinely new technique, solves an open problem, or makes a substantial advance. The mathematical community would broadly recognize this as important. |
| `incremental` | Extends known results to new settings, improves constants/rates, or combines known techniques in a useful way. Solid work but not a breakthrough. |
| `straightforward_extension` | Applies known methods to a new but similar setting with no essential new ideas. The result is expected by experts. |

**Rules:**
- The `justification` field MUST reference specific evidence.
- `novel_contributions` lists what is genuinely new, with node references.
- `known_techniques` lists what is classical or borrowed, with origin.
- `comparison_to_prior_work` is required for every paper that cites prior work
  it extends or improves upon.
- If the paper claims significance beyond what the evidence supports, note this
  explicitly.

#### 4c. Clustering

Group nodes into thematic clusters corresponding to the paper's logical
sections and conceptual modules.

```json
{
  "clusters": [
    {
      "id": "cluster::preliminaries",
      "label": "Preliminaries and Setup",
      "description": "Background definitions, standing assumptions, and notation.",
      "sections": ["2"],
      "member_nodes": ["sec2::def:banach-space", "sec2::def:filtration", "sec2::asm:A1"]
    },
    {
      "id": "cluster::key-estimates",
      "label": "Key Estimates",
      "description": "Technical lemmas establishing the core inequalities used in the main proof.",
      "sections": ["3"],
      "member_nodes": ["sec3::lem:key-estimate", "sec3::lem:interpolation"]
    }
  ]
}
```

**Rules:**
- Every node MUST appear in exactly one cluster.
- Cluster IDs use the format `cluster::{short-name}`.
- Clusters should reflect the paper's own organizational logic, not an
  arbitrary grouping.
- External dependency nodes go into a dedicated `cluster::external` cluster.

#### 4d. Main Results

Identify the headline theorems -- the results the paper exists to prove.
These are the mathematical analogues of "entry points" in a codebase.

```json
{
  "main_results": [
    {
      "node_id": "sec4::thm:main-convergence",
      "role": "Primary result establishing convergence rate.",
      "significance": "Improves the best known rate from O(1/n) to O(1/n^2) under assumption A1.",
      "depends_on_count": 12,
      "is_used_by_count": 3
    }
  ]
}
```

**Rules:**
- Order by importance (most important first).
- `depends_on_count` = number of edges where this node is the source.
- `is_used_by_count` = number of edges where this node is the target.
- Typically a paper has 1-5 main results. If you identify more than 5,
  reconsider whether some should be demoted.

#### 4e. Proof Strategies

For each main result, produce a structured proof roadmap.

```json
{
  "proof_strategies": [
    {
      "target_node": "sec4::thm:main-convergence",
      "strategy_summary": "Prove convergence by establishing a Lyapunov function and showing it decreases at rate O(1/n^2) using the key interpolation estimate from Lemma 3.5.",
      "key_steps": [
        {
          "step": 1,
          "description": "Construct the Lyapunov function V(x_n) combining energy and momentum terms.",
          "nodes_used": ["sec2::def:lyapunov", "sec2::def:energy"]
        },
        {
          "step": 2,
          "description": "Show V(x_{n+1}) - V(x_n) <= -c/n^2 using Lemma 3.5.",
          "nodes_used": ["sec3::lem:key-estimate"]
        },
        {
          "step": 3,
          "description": "Sum the telescoping bound and conclude convergence.",
          "nodes_used": []
        }
      ],
      "noise_removed": [
        {
          "description": "Lengthy computation verifying that the cross-terms in the Lyapunov bound cancel (pages 12-13).",
          "location": "Proof of Theorem 4.3, equations (4.7)-(4.15)",
          "abstraction": "The cross-terms cancel by a routine application of Young's inequality."
        }
      ],
      "overall_approach": "Lyapunov/energy method",
      "difficulty_assessment": "The main technical challenge is Step 2, which requires the new interpolation inequality."
    }
  ]
}
```

**Rules:**
- `strategy_summary`: 1-2 sentences. A reader should understand the proof
  idea from this alone.
- `key_steps`: ordered list. Each step explains WHAT is done and WHY, with
  references to the nodes involved.
- `noise_removed`: identify computations or standard arguments that can be
  safely skipped on a first reading. For each, provide an `abstraction`
  (one-sentence summary of what the computation achieves).
- `overall_approach`: name the proof technique (e.g., "contradiction",
  "induction", "energy method", "fixed point", "compactness argument").
- `difficulty_assessment`: where is the hard part?

#### 4f. Section Summaries

One to two sentences per section.

```json
{
  "section_summaries": [
    {
      "section": "1",
      "title": "Introduction",
      "summary": "States the main convergence theorem and places it in the context of optimization theory. Reviews prior work on accelerated methods."
    },
    {
      "section": "2",
      "title": "Preliminaries",
      "summary": "Defines the function classes, standing assumptions (smoothness, convexity), and introduces the Lyapunov function framework."
    }
  ]
}
```

**Rules:**
- Cover every section (including appendices, unless skipped by user directive).
- Summaries must be self-contained (a reader unfamiliar with the paper should
  get the gist).
- Do NOT just list what the section contains -- explain what it accomplishes.

#### 4g. Attention Items

Flag items that warrant careful reading or may indicate issues.

```json
{
  "attention_items": [
    {
      "id": "attn::1",
      "severity": "high" | "medium" | "low",
      "category": "high_dependency" | "complex_proof" | "unclear_step" | "notation_conflict" | "assumption_gap" | "circular_reference",
      "node_id": "sec3::lem:key-estimate",
      "description": "Lemma 3.5 is referenced by 8 other results. An error here would likely invalidate the main theorem.",
      "suggestion": "Verify the proof of Lemma 3.5 independently, paying particular attention to the application of Gronwall's inequality in equation (3.12)."
    }
  ]
}
```

**Rules:**
- Use **probabilistic language**: "may be incorrect", "appears to rely on",
  "could potentially fail if". NEVER assert an error unless you are certain.
- `high_dependency`: nodes with high in-degree or out-degree.
- `complex_proof`: proofs that are long, use many techniques, or have subtle
  steps.
- `unclear_step`: steps in a proof that are not fully justified.
- `notation_conflict`: same symbol used with different meanings.
- `assumption_gap`: an assumption is used but not clearly stated.
- `circular_reference`: potential circular dependency in the logic.
- Every attention item MUST have a concrete `suggestion` for how to resolve
  or verify it.

#### 4h. Unknowns

Document things the agent could not fully resolve.

```json
{
  "unknowns": [
    {
      "id": "unk::1",
      "severity": "critical" | "important" | "minor",
      "category": "unstated_technique" | "vague_reference" | "unclear_assumption" | "missing_detail" | "unresolved_external",
      "location": "Proof of Theorem 4.3, page 15, line 3",
      "question": "The proof claims 'by a standard interpolation argument' but does not specify which interpolation inequality is used. Is this Gagliardo-Nirenberg or Sobolev embedding?",
      "search_hint": "Search for: interpolation inequality Sobolev spaces Lp estimates",
      "impact": "If the wrong interpolation is used, the exponents in the convergence rate may be incorrect."
    }
  ]
}
```

**Rules:**
- `severity: "critical"` = the unknown could affect the correctness of a main
  result.
- `severity: "important"` = the unknown affects understanding but probably not
  correctness.
- `severity: "minor"` = a gap in exposition that a knowledgeable reader can
  fill.
- `search_hint` MUST be a concrete, actionable search query that could help
  resolve the unknown.
- `impact` explains what goes wrong if the unknown is resolved unfavorably.

#### 4i. Notation Index

A comprehensive symbol-to-meaning mapping.

```json
{
  "notation_index": [
    {
      "symbol": "\\mathcal{F}_t",
      "meaning": "Filtration at time t",
      "introduced_in": "sec2::def:filtration",
      "section": "2",
      "scope": "global"
    },
    {
      "symbol": "\\| \\cdot \\|_X",
      "meaning": "Norm in Banach space X (in Section 2); Operator norm (in Section 5)",
      "introduced_in": "sec2::def:banach-space",
      "section": "2",
      "scope": "global",
      "conflict": {
        "alternative_meaning": "Operator norm on bounded linear operators",
        "section": "5",
        "node_id": "sec5::def:operator-norm"
      }
    }
  ]
}
```

**Rules:**
- Include EVERY symbol that has a specific mathematical meaning in the paper.
- For symbols defined via `\newcommand`, use the command name AND the rendered
  form.
- Flag notation conflicts (same symbol, different meanings) with a `conflict`
  field. Also create an attention item (Step 4g) for each conflict.
- `scope`: `"global"` if used throughout, `"local"` if only in one section.

#### 4j. Stats

Aggregate statistics for validation and quick overview.

```json
{
  "stats": {
    "node_counts": {
      "definition": 12,
      "theorem": 3,
      "lemma": 8,
      "proposition": 2,
      "corollary": 4,
      "assumption": 3,
      "remark": 5,
      "example": 2,
      "conjecture": 1,
      "notation": 3,
      "equation": 7,
      "external_dependency": 4,
      "total": 54
    },
    "edge_counts": {
      "explicit_ref": 28,
      "inferred": 15,
      "external": 4,
      "total": 47
    },
    "edge_kind_counts": {
      "uses": 38,
      "generalizes": 2,
      "specializes": 1,
      "equivalent_to": 0,
      "cites_external": 4,
      "motivates": 1,
      "proof_of": 1
    },
    "cluster_count": 6,
    "main_result_count": 2,
    "attention_item_count": 5,
    "unknown_count": 3,
    "notation_symbol_count": 23,
    "sections_analyzed": 7,
    "pages_estimated": 25
  }
}
```

**Rules:**
- All counts MUST match the actual data in `graph.json` and `index.json`.
- If any count is inconsistent, fix the data before emitting.
- `total` fields must equal the sum of their sub-fields.

---

### Step 5: Output Generation

#### 5a. Dashboard generation (Class A output)

1. Locate the dashboard template in the PaperParser repository (typically at
   `templates/dashboard/`).
2. Copy the template to `parser-run/dashboard/`.
3. Copy (or symlink) the three JSON files into `parser-run/dashboard/data/`:
   - `manifest.json`
   - `graph.json`
   - `index.json`
4. Verify the dashboard loads correctly by checking that all JSON files are
   valid and the HTML file references them at the correct relative paths.

#### 5b. Prompt suite output (Class B output)

Class B output (narrative summaries, reading guides, etc.) is handled by a
separate prompt suite and is NOT part of this protocol. The JSON bundle
produced by Steps 1-4 is the input for Class B generation.

---

## 5. Quality Checklist

Before finalizing the output, verify ALL of the following:

- [ ] **Unique IDs:** Every `id` in `graph.json` nodes is unique.
- [ ] **Edge integrity:** Every `source` and `target` in `graph.json` edges
      references an existing node ID.
- [ ] **Cluster integrity:** Every node ID in every cluster's `member_nodes`
      references an existing node ID.
- [ ] **Complete cluster coverage:** Every node appears in exactly one cluster.
- [ ] **Evidence fields:** Every edge has a non-null `evidence` field.
- [ ] **No false explicit_ref:** No edge with `evidence: "inferred"` is
      incorrectly marked as `"explicit_ref"`.
- [ ] **Probabilistic language:** All attention items use hedging language
      ("may", "appears to", "could potentially").
- [ ] **Honest innovation:** The `innovation_assessment.calibration` is
      defensible given the evidence in `novel_contributions` and
      `known_techniques`.
- [ ] **Useful unknowns:** Every unknown has a non-generic `question` and a
      concrete `search_hint`.
- [ ] **Proof strategies:** Every main result has a proof strategy entry with
      at least one `noise_removed` item (if the proof is non-trivial).
- [ ] **Accurate stats:** All counts in `stats` match the actual data.
- [ ] **Schema version:** `schema_version` is `"0.1.0"` in all three JSON
      files.
- [ ] **Valid JSON:** All three files parse without error.
- [ ] **No orphan nodes:** Every node is either a source or target of at least
      one edge, OR is explicitly tagged as standalone (e.g., a remark that
      does not connect to anything).

---

## 6. Guidance for Edge Cases

### 6.1 Cryptic Papers

When the paper uses techniques, inequalities, or results without explaining
them or providing references:

1. **Identify the gap.** Note the exact location and what is being assumed
   without justification.
2. **Web-search.** Search for the technique name + "proof" or "theorem" to
   find the original source. Prefer arXiv, MathSciNet, or Wikipedia for
   standard results.
3. **Create an external_dependency node** if the technique comes from a
   specific identifiable paper or textbook.
4. **Log as unknown** with `category: "unstated_technique"` if the search does
   not resolve the gap. Include the best `search_hint` you can construct.
5. **Do not fabricate explanations.** If you cannot determine what technique
   is being used, say so explicitly.

### 6.2 Proof by Reference

When a paper says "The proof follows from [12] with minor modifications" or
similar:

1. **Identify what [12] proves.** Look up the cited result (web search if
   needed).
2. **Identify the modification.** What changes between [12]'s setting and the
   current paper? Is it a different function space, a weaker assumption, a
   different boundary condition?
3. **Assess the modification:**
   - If the modification is clearly described and straightforward, create an
     edge with `kind: "cites_external"` and note the modification in
     `context`.
   - If the modification is vague or unclear, create an **unknown** with
     `severity: "important"` and `category: "vague_reference"`.
4. **Set proof_status:** `"external"` with `proof_reference` pointing to [12].

### 6.3 Papers with Appendices

- Assign appendix sections IDs with letter prefixes: `secA`, `secB`, `secC`,
  etc. (or `secA.1`, `secA.2` for sub-sections).
- Treat appendix objects as first-class nodes with the same extraction rules
  as main-body objects.
- When a main-body theorem has `proof_status: "deferred"`, create an edge:
  ```json
  {
    "source": "secA::thm:main-deferred-proof",
    "target": "sec4::thm:main-convergence",
    "kind": "proof_of",
    "evidence": "explicit_ref"
  }
  ```
  (Or from the appendix proof node to the main-body theorem node.)
- Include appendix sections in section_summaries and clustering.

### 6.4 Long Proofs

When a proof spans multiple pages or contains internal structure:

1. **Identify sub-steps.** Look for:
   - Named "Claims" (e.g., "Claim 1:", "Claim 2:").
   - Named "Steps" (e.g., "Step 1:", "Step 2:").
   - "Case" analysis (e.g., "Case 1: p > 2", "Case 2: p <= 2").
2. **Create sub-nodes** for each identified sub-step:
   - ID format: `sec4::thm:main-convergence::claim:1`
   - Kind: `claim` (or `step`, `case`).
   - These sub-nodes are children of the parent theorem node.
3. **Create edges** between sub-nodes to capture the internal proof logic.
4. **In the proof strategy** (Step 4e), reference sub-nodes in `key_steps`.

### 6.5 Scattered Assumptions

When assumptions are stated in one section but used in distant sections:

1. **Create the assumption node** at the location where the assumption is
   FIRST stated.
2. **Track every invocation.** For each proof or statement that invokes the
   assumption, create an edge with `kind: "uses"`.
3. **Flag in attention** if an assumption is invoked more than 3 sections away
   from where it is stated:
   ```json
   {
     "id": "attn::scattered-asm",
     "severity": "medium",
     "category": "assumption_gap",
     "node_id": "sec1::asm:A1",
     "description": "Assumption A1 (stated in Section 1) is invoked in Sections 4, 5, and 7. Readers may lose track of its content.",
     "suggestion": "Review whether Assumption A1 is restated or recalled near its point of use."
   }
   ```

### 6.6 Multi-Paper Dependencies

When the paper builds significantly on results from other papers:

1. **Create external_dependency nodes** for each specific cited result.
2. **Web-search for the cited result's statement.** Trace at least one level
   deep: if the cited paper itself cites another paper for a key ingredient,
   note this in the `statement` field.
3. **Record the full bibliographic reference** in the node's `source_paper`
   field.
4. **Assess whether the dependency is verified:**
   - If the cited result is well-known and widely verified, note
     `"reliability": "established"`.
   - If the cited result is recent or controversial, note
     `"reliability": "recent_unverified"` and add an attention item.

### 6.7 Notation Conflicts

When the same symbol is used with different meanings in different parts of the
paper:

1. **Create separate entries** in the notation index, one per meaning. Include
   the `conflict` field on each entry pointing to the other.
2. **Create an attention item:**
   ```json
   {
     "id": "attn::notation-conflict-norm",
     "severity": "medium",
     "category": "notation_conflict",
     "node_id": null,
     "description": "The symbol ||.||_X denotes the Banach space norm in Section 2 but the operator norm in Section 5. This may cause confusion.",
     "suggestion": "When reading proofs in Sections 4-6, verify which meaning of ||.||_X is intended from context."
   }
   ```
3. **In edge extraction,** be careful to resolve notation to the correct
   definition based on the section context.

### 6.8 Conditional or Partial Results

When a theorem holds only under certain conditions not captured in the
statement:

1. **Check for hidden assumptions.** Sometimes conditions are stated paragraphs
   before the theorem ("Throughout this section, we assume...").
2. **Create edges** to those implicit assumption nodes.
3. **Note in the node's `tags`:** `"conditional"`, `"partial"` as appropriate.
4. **In the proof strategy,** explicitly note which assumptions are needed for
   which steps.

### 6.9 Survey or Expository Sections

When a section restates known results for the reader's convenience:

1. **Still create nodes** for restated results.
2. **Set `novelty: "known"`** with `novelty_source`.
3. **Set `proof_status: "external"`** if the proof is not reproduced.
4. **Group into a cluster** labeled appropriately (e.g., "Background" or
   "Review of Prior Results").

### 6.10 Errata or Corrections

If the paper contains corrections to previous versions or other papers:

1. **Note in the affected node's `tags`:** `"corrected"` or `"erratum"`.
2. **Create an attention item** explaining what was corrected and why.
3. **If the correction affects the dependency graph** (e.g., a corrected lemma
   changes which results depend on it), update edges accordingly.

---

## 7. Anti-Patterns to Avoid

These are common mistakes. The agent MUST NOT do any of the following:

1. **Sugarcoating innovation.** Do not inflate the significance of routine
   extensions. If the paper applies known methods to a new but expected
   setting, call it `straightforward_extension`.

2. **Missing implicit dependencies.** Do not stop at Pass 1 (explicit
   references). Pass 2 (inferred) is where the real intellectual work happens.
   A proof that "obviously" uses a definition without citing it still has a
   dependency.

3. **Fabricating certainty.** If you do not understand a step, do NOT make up
   an explanation. Create an unknown instead.

4. **Conflating evidence types.** `explicit_ref` means there is a literal
   `\ref` or `\eqref` in the LaTeX. Everything else is `inferred` or
   `external`.

5. **Orphaning nodes.** Every definition, assumption, and notation should
   connect to at least one theorem or lemma that uses it. If a node has zero
   edges, either the node is unnecessary (remove it) or you missed edges
   (re-examine).

6. **Generic unknowns.** "This step is unclear" is not useful. Specify WHAT
   is unclear, WHAT you think the answer might be, and HOW to resolve it.

7. **Ignoring appendices.** Appendix content is often critical. Treat it with
   the same rigor as main-body content.

8. **Over-extracting.** Not every equation needs to be a node. Only extract
   equations that are (a) labeled and (b) referenced by other parts of the
   paper, OR (c) constitute key intermediate results.

9. **Under-clustering.** Every node must belong to exactly one cluster. Do not
   leave nodes unassigned.

10. **Stale is_main_result tags.** After Step 3 (edge extraction), revisit
    the `is_main_result` tags. A theorem with very high in-degree that was
    not initially tagged may deserve promotion.

---

## 8. Execution Summary

| Step | Input | Output | Key Action |
|---|---|---|---|
| 1 | Raw paper (LaTeX/PDF) | `manifest.json` | Parse, detect metadata, build label map |
| 2 | Parsed document + manifest | `graph.json` (nodes only) | Extract all mathematical objects as nodes |
| 3 | Nodes + parsed document | `graph.json` (nodes + edges) | Three-pass dependency extraction |
| 4 | Complete graph + parsed document | `index.json` | Enrichment: summaries, strategies, unknowns |
| 5 | All JSON files + template | `parser-run/` directory | Assemble dashboard |

The agent proceeds strictly in order: 1 -> 2 -> 3 -> 4 -> 5. Steps are not
parallelizable because each depends on the output of the previous step.

After Step 5, run the Quality Checklist. If any check fails, return to the
relevant step and fix the issue before finalizing.
