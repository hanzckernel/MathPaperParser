# PaperParser Bundle Schema Specification

**Version:** 0.1.0
**Status:** Draft
**Last updated:** 2026-03-01

---

## Overview

A PaperParser bundle is a structured analysis of a mathematical research paper. It consists of three JSON files that together capture the metadata, logical dependency graph, and enriched commentary for the paper.

| File | Purpose | Size guidance |
|------|---------|---------------|
| `manifest.json` | Paper metadata, scope, and producer info | Small (< 5 KB) |
| `graph.json` | Nodes (math objects) and edges (dependencies) | Scales with paper complexity |
| `index.json` | Enrichment: summaries, clusters, proof strategies, unknowns | Scales with paper length |

A conforming implementation MUST produce all three files. An empty paper with no extractable structure still produces valid files (with empty `nodes`/`edges` arrays, etc.).

### Design Principles

1. **Reproducibility.** Every claim in the graph links back to evidence (explicit reference, inference, or external citation).
2. **Hierarchy.** Node IDs encode section context so that locality is visible at a glance.
3. **Separation of concerns.** `graph.json` is a pure directed graph; all narrative enrichment lives in `index.json`.
4. **Round-trippability.** The bundle carries enough information for a downstream agent to regenerate a faithful summary of the paper without re-reading the source.

---

## Node ID Format

All node IDs follow a canonical format:

```
sec{N}::{kind}:{label}
```

| Component | Description | Example |
|-----------|-------------|---------|
| `sec{N}` | Section number (use `sec0` for preamble / unnumbered front matter, `secA` for appendix A, etc.) | `sec3` |
| `{kind}` | One of the node kinds listed below | `lem` |
| `{label}` | A short, kebab-case, human-readable slug | `key-estimate` |

**Full example:** `sec3::lem:key-estimate`

**Abbreviation table for `{kind}` in IDs:**

| Node kind | ID abbreviation |
|-----------|----------------|
| `definition` | `def` |
| `theorem` | `thm` |
| `lemma` | `lem` |
| `proposition` | `prop` |
| `corollary` | `cor` |
| `assumption` | `asm` |
| `remark` | `rem` |
| `example` | `ex` |
| `conjecture` | `conj` |
| `notation` | `not` |
| `external_dependency` | `ext` |

**Rules:**
- IDs MUST be unique across the entire bundle.
- The `{label}` component MUST use only lowercase ASCII letters, digits, and hyphens.
- The `{label}` SHOULD be derived from the mathematical name (e.g., `banach-alaoglu`, `gronwall-inequality`) rather than opaque numbering.
- For external dependencies, use `sec0::ext:{source-label}` (e.g., `sec0::ext:evans-pde-thm5.3`).

---

## 1. manifest.json -- Paper Metadata

The manifest captures everything about the paper itself, the scope of analysis, and the agent that produced the bundle.

### Full Example

```jsonc
{
  "schema_version": "0.1.0",
  "created_at": "2026-03-01T14:30:00Z",
  "paper": {
    "title": "On the Convergence of Iterative Methods in Banach Spaces",
    "authors": ["A. Author", "B. Coauthor"],
    "arxiv_id": "2401.12345v2",
    "doi": "10.1234/jfa.2024.109876",
    "year": 2024,
    "subject_area": "Functional Analysis",
    "source_type": "latex",
    "source_files": ["main.tex", "appendix.tex"],
    "version_note": "arXiv v2, Jan 2024"
  },
  "scope": {
    "sections_included": ["all"],
    "analysis_level": "both"
  },
  "producer": {
    "agent": "claude-opus-4-6",
    "schema_version": "0.1.0",
    "timestamp_start": "2026-03-01T14:25:00Z",
    "timestamp_end": "2026-03-01T14:30:00Z"
  }
}
```

### Field Reference

#### Top-level fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `schema_version` | `string` | YES | Semver version of this schema spec. Currently `"0.1.0"`. |
| `created_at` | `string` | YES | ISO 8601 timestamp of bundle creation. |
| `paper` | `object` | YES | Metadata about the paper being analyzed. |
| `scope` | `object` | YES | What was included in the analysis. |
| `producer` | `object` | YES | Information about the agent/tool that produced this bundle. |

#### `paper` object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | `string` | YES | Full title of the paper. |
| `authors` | `string[]` | YES | Ordered list of author names as they appear on the paper. |
| `arxiv_id` | `string` | NO | arXiv identifier including version suffix (e.g., `"2401.12345v2"`). |
| `doi` | `string` | NO | Digital Object Identifier. |
| `year` | `integer` | YES | Publication or preprint year. |
| `subject_area` | `string` | YES | Primary mathematical subject area (free text, but prefer standard MSC-style descriptions like `"Functional Analysis"`, `"Algebraic Geometry"`, `"Probability Theory"`). |
| `source_type` | `string` | YES | One of: `"latex"`, `"pdf"`. Indicates the source format the agent worked from. |
| `source_files` | `string[]` | YES | List of source file names analyzed. For PDF input, this is `["paper.pdf"]` or similar. |
| `version_note` | `string` | NO | Free-text note about which version of the paper was analyzed. |

#### `scope` object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sections_included` | `string[]` | YES | List of section numbers included, or `["all"]` for full paper. Examples: `["all"]`, `["1", "2", "3"]`, `["3", "4", "A"]`. |
| `analysis_level` | `string` | YES | One of: `"bird_eye"` (high-level structure only), `"frog_eye"` (detailed proof-level analysis), `"both"`. |

#### `producer` object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `agent` | `string` | YES | Identifier for the producing agent (e.g., `"claude-opus-4-6"`). |
| `schema_version` | `string` | YES | Schema version the agent targeted. Must match top-level `schema_version`. |
| `timestamp_start` | `string` | YES | ISO 8601 timestamp when analysis began. |
| `timestamp_end` | `string` | YES | ISO 8601 timestamp when analysis completed. |

---

## 2. graph.json -- Math Objects + Dependencies

The graph file encodes the mathematical content of the paper as a directed graph. Nodes are mathematical objects (definitions, theorems, lemmas, etc.). Edges are logical dependencies between them.

### Full Example

```jsonc
{
  "schema_version": "0.1.0",
  "nodes": [
    {
      "id": "sec2::def:banach-space",
      "kind": "definition",
      "label": "Definition 2.1 (Banach space)",
      "section": "2",
      "section_title": "Preliminaries",
      "number": "2.1",
      "latex_label": "def:banach-space",
      "statement": "A Banach space is a complete normed vector space $(X, \\|\\cdot\\|)$.",
      "proof_status": "not_applicable",
      "is_main_result": false,
      "novelty": "classical",
      "metadata": {}
    },
    {
      "id": "sec2::lem:key-estimate",
      "kind": "lemma",
      "label": "Lemma 2.3 (Key a priori estimate)",
      "section": "2",
      "section_title": "Preliminaries",
      "number": "2.3",
      "latex_label": "lem:key-estimate",
      "statement": "For all $u \\in X$, we have $\\|Tu\\| \\leq C\\|u\\|^{1+\\alpha}$ where $C$ depends only on the dimension.",
      "proof_status": "full",
      "is_main_result": false,
      "novelty": "new",
      "metadata": {
        "proof_length_lines": 35
      }
    },
    {
      "id": "sec4::thm:main",
      "kind": "theorem",
      "label": "Theorem 4.1 (Main convergence result)",
      "section": "4",
      "section_title": "Main Results",
      "number": "4.1",
      "latex_label": "thm:main",
      "statement": "Under Assumptions 1.1--1.3, the iterative scheme $(x_n)$ converges strongly to the unique fixed point $x^*$ at rate $O(n^{-\\beta})$.",
      "proof_status": "full",
      "is_main_result": true,
      "novelty": "new",
      "metadata": {
        "proof_length_lines": 120
      }
    },
    {
      "id": "sec0::ext:evans-pde-thm5.3",
      "kind": "external_dependency",
      "label": "Evans, PDE, Theorem 5.3 (Sobolev embedding)",
      "section": "0",
      "section_title": "",
      "number": "",
      "latex_label": null,
      "statement": "Sobolev embedding theorem as stated in Evans, Partial Differential Equations, Theorem 5.3.",
      "proof_status": "external",
      "is_main_result": false,
      "novelty": "classical",
      "metadata": {
        "source": "Evans, Partial Differential Equations, 2nd ed., AMS, 2010"
      }
    }
  ],
  "edges": [
    {
      "source": "sec4::thm:main",
      "target": "sec2::lem:key-estimate",
      "kind": "uses_in_proof",
      "evidence": "explicit_ref",
      "detail": "Used in step 3 of the proof via inequality (4.2)",
      "metadata": {}
    },
    {
      "source": "sec4::thm:main",
      "target": "sec2::def:banach-space",
      "kind": "uses_in_proof",
      "evidence": "inferred",
      "detail": "The proof works in the Banach space framework established in Definition 2.1",
      "metadata": {}
    },
    {
      "source": "sec2::lem:key-estimate",
      "target": "sec0::ext:evans-pde-thm5.3",
      "kind": "uses_in_proof",
      "evidence": "explicit_ref",
      "detail": "Sobolev embedding applied in the second inequality of the chain",
      "metadata": {}
    },
    {
      "source": "sec5::cor:rate-improvement",
      "target": "sec4::thm:main",
      "kind": "specializes",
      "evidence": "explicit_ref",
      "detail": "Corollary specializes the main theorem to Hilbert spaces, yielding a sharper rate",
      "metadata": {}
    }
  ]
}
```

### Node Kinds

| Kind | Description | Typical `proof_status` | Example |
|------|-------------|----------------------|---------|
| `definition` | Introduces a new concept, space, operator, or mathematical object. | `not_applicable` | "A Banach space is..." |
| `theorem` | A major proven statement. | `full`, `sketch`, `deferred` | "Theorem 4.1 (Main result)" |
| `lemma` | A subsidiary proven statement used in service of a larger result. | `full`, `sketch`, `deferred` | "Lemma 3.2 (Key estimate)" |
| `proposition` | A proven statement of intermediate importance. | `full`, `sketch`, `deferred` | "Proposition 2.5" |
| `corollary` | A statement that follows readily from a theorem or proposition. | `full`, `not_applicable` | "Corollary 4.2" |
| `assumption` | A standing hypothesis or axiom adopted throughout the paper. | `not_applicable` | "Assumption 1.1 (Ellipticity)" |
| `remark` | An informal observation or clarification. | `not_applicable` | "Remark 3.4" |
| `example` | A concrete instance illustrating a definition or showing sharpness. | `not_applicable` | "Example 2.2 (Sharpness)" |
| `conjecture` | An unproven statement proposed by the authors. | `not_applicable` | "Conjecture 6.1" |
| `notation` | Introduction of a symbol or notational convention. | `not_applicable` | "We write $B_r(x)$ for the open ball..." |
| `external_dependency` | A result from another paper or textbook that this paper relies on. | `external` | "By [Evans, Thm 5.3]..." |

**Implementation note:** The `kind` field MUST be one of the eleven values listed above. If the paper contains an object that does not fit cleanly (e.g., "Algorithm 3.1"), map it to the closest kind and note the original label in `metadata.original_label`.

### Edge Kinds

| Kind | Description | Typical direction | Example |
|------|-------------|-------------------|---------|
| `uses_in_proof` | Source's proof directly uses the target statement or definition. | theorem --> lemma | "Theorem 4.1 uses Lemma 2.3 in step 3" |
| `extends` | Source extends the target to a broader setting or with weaker hypotheses. | new thm --> old thm | "Theorem 5.1 extends Theorem 4.1 to unbounded domains" |
| `generalizes` | Source is a strict generalization of the target (target is a special case of source). | general --> specific | "Theorem 3.1 generalizes the classical Banach fixed-point theorem" |
| `specializes` | Source is a specialization/restriction of the target (source follows by restricting the target). | specific --> general | "Corollary 4.2 specializes Theorem 4.1 to Hilbert spaces" |
| `equivalent_to` | Source and target are proven equivalent. | bidirectional (use two edges) | "Theorem 2.1 is equivalent to Proposition 2.3" |
| `cites_external` | Source cites an external result (target is an `external_dependency` node). | internal --> external | "Lemma 3.1 cites Evans PDE Thm 5.3" |

**Direction convention:**
- For `uses_in_proof`: the edge points FROM the statement being proved TO the dependency it uses. Read as: "source uses target."
- For `extends` / `generalizes` / `specializes`: the edge points FROM the new/derived result TO the base result.
- For `equivalent_to`: create TWO edges (one in each direction) to represent the bidirectional relationship.
- For `cites_external`: the edge points FROM the internal node TO the `external_dependency` node.

### Evidence Levels

| Evidence level | Description | When to use |
|----------------|-------------|-------------|
| `explicit_ref` | The dependency is stated in the source text via `\ref`, `\eqref`, a theorem number citation, or an explicit textual reference (e.g., "by Lemma 2.3"). | Whenever the paper text explicitly names the dependency. This is the strongest evidence level. |
| `inferred` | The agent determined the dependency by reading the proof and recognizing that a concept, inequality, or result is being used, even though the paper does not explicitly cite it. | When the dependency is logically necessary but the author did not write an explicit reference. |
| `external` | The dependency references a result from another paper, textbook, or well-known folklore result. | For all edges pointing to `external_dependency` nodes, or when the paper says "by a classical result" without giving a precise reference. |

### Node Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | YES | Canonical node ID in the format `sec{N}::{kind}:{label}`. Must be globally unique. |
| `kind` | `string` | YES | One of the eleven node kinds. |
| `label` | `string` | YES | Human-readable label as it appears in the paper (e.g., `"Theorem 4.1 (Main convergence result)"`). Include the parenthetical name if the paper provides one. |
| `section` | `string` | YES | Section number (e.g., `"2"`, `"3.1"`, `"A"`). Use `"0"` for preamble/front matter. |
| `section_title` | `string` | YES | Title of the section. Empty string if the section is untitled. |
| `number` | `string` | YES | The theorem/definition number as printed in the paper (e.g., `"2.1"`, `"A.3"`). Empty string if unnumbered. |
| `latex_label` | `string \| null` | NO | The LaTeX `\label{}` tag if available from source. `null` if unavailable (e.g., PDF source). |
| `statement` | `string` | YES | The full mathematical statement, in LaTeX-flavored plain text. Include all quantifiers, hypotheses, and conclusions. For definitions, include the full definition. For notation nodes, include the symbol and its meaning. |
| `proof_status` | `string` | YES | One of: `"full"` (complete proof given), `"sketch"` (proof sketch only), `"deferred"` (proof deferred to appendix or later section), `"external"` (proved elsewhere, e.g., in a cited reference), `"not_applicable"` (definitions, assumptions, remarks, notation, conjectures). |
| `is_main_result` | `boolean` | YES | `true` if this is one of the paper's headline results (typically mentioned in the abstract or introduction). |
| `novelty` | `string` | YES | One of: `"new"` (first appearance in this paper), `"classical"` (well-known, recalled for convenience), `"extended"` (known result with a new proof or minor extension), `"folklore"` (widely believed but not formally published before). |
| `metadata` | `object` | YES | Free-form object for additional information. May be empty `{}`. See suggested metadata keys below. |

**Suggested `metadata` keys for nodes:**

| Key | Type | Description |
|-----|------|-------------|
| `proof_length_lines` | `integer` | Approximate length of the proof in source lines. |
| `original_label` | `string` | Original label if the paper uses a non-standard environment (e.g., "Algorithm", "Claim"). |
| `source` | `string` | For external dependencies: bibliographic reference. |
| `page` | `integer` | Page number where the statement appears (for PDF sources). |
| `tags` | `string[]` | Optional classification tags (e.g., `["fixed-point", "contraction"]`). |

### Edge Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `source` | `string` | YES | Node ID of the source (the "from" node). Must reference an existing node. |
| `target` | `string` | YES | Node ID of the target (the "to" node). Must reference an existing node. |
| `kind` | `string` | YES | One of the six edge kinds listed above. |
| `evidence` | `string` | YES | One of: `"explicit_ref"`, `"inferred"`, `"external"`. |
| `detail` | `string` | YES | A short natural-language explanation of the dependency. Be specific: mention proof steps, equation numbers, or the technique used. |
| `metadata` | `object` | YES | Free-form object. May be empty `{}`. |

**Suggested `metadata` keys for edges:**

| Key | Type | Description |
|-----|------|-------------|
| `proof_step` | `string` | Which step of the proof uses this dependency (e.g., `"step 3"`, `"second inequality in the chain"`). |
| `equation_ref` | `string` | Equation number referenced (e.g., `"(4.2)"`). |

---

## 3. index.json -- Enrichment

The index file provides narrative enrichment layered on top of the graph. It is organized into named sections, each serving a specific analytical purpose.

### Full Example

```jsonc
{
  "schema_version": "0.1.0",

  "problem_statement": {
    "question": "Under what conditions do iterative fixed-point schemes converge in Banach spaces, and at what rate?",
    "motivation": "Classical Banach fixed-point theorem requires strict contractions; many applications in PDE and optimization involve only asymptotic contractions. This paper seeks sharp convergence rates under relaxed contractivity assumptions.",
    "context": "Builds on the framework of Browder (1967) and the more recent asymptotic regularity results of Kohlenbach (2005)."
  },

  "innovation_assessment": {
    "summary": "The paper introduces a new quantitative convergence framework for asymptotic contractions in Banach spaces, removing the uniform convexity assumption required by prior work.",
    "main_innovations": [
      {
        "description": "A new a priori estimate (Lemma 2.3) that controls iterate differences without uniform convexity.",
        "calibration": "significant",
        "related_nodes": ["sec2::lem:key-estimate"]
      },
      {
        "description": "Rate-of-convergence bound $O(n^{-\\beta})$ matching the known lower bound up to endpoint.",
        "calibration": "significant",
        "related_nodes": ["sec4::thm:main"]
      },
      {
        "description": "Extension to non-reflexive spaces via a James-type characterization.",
        "calibration": "incremental",
        "related_nodes": ["sec5::cor:rate-improvement"]
      }
    ],
    "prior_work_comparison": "Compared to Kirk (1971) and Goebel-Reich (1984), the main advance is removing uniform convexity. The rate $O(n^{-\\beta})$ improves the $O(n^{-\\beta/2})$ rate of Kohlenbach (2005) in the non-uniformly convex setting."
  },

  "clusters": [
    {
      "id": "cluster:preliminaries",
      "label": "Preliminaries and Setup",
      "section": "2",
      "members": [
        "sec2::def:banach-space",
        "sec2::def:asymptotic-contraction",
        "sec2::lem:key-estimate",
        "sec2::not:ball-notation"
      ],
      "description": "Background definitions and the key a priori estimate."
    },
    {
      "id": "cluster:main-convergence",
      "label": "Main Convergence Theory",
      "section": "4",
      "members": [
        "sec4::thm:main",
        "sec4::lem:iteration-bound",
        "sec4::cor:strong-convergence"
      ],
      "description": "The central convergence theorem and its immediate consequences."
    }
  ],

  "main_results": [
    {
      "node_id": "sec4::thm:main",
      "headline": "Iterative schemes converge at rate $O(n^{-\\beta})$ under asymptotic contractivity in arbitrary Banach spaces.",
      "significance": "Removes the uniform convexity assumption from prior convergence theorems while achieving an optimal rate."
    }
  ],

  "proof_strategies": [
    {
      "target_node": "sec4::thm:main",
      "strategy_summary": "The proof combines a soft analysis argument (asymptotic regularity) with a hard quantitative estimate (the key a priori bound from Lemma 2.3). The proof proceeds in three stages: establishing uniform boundedness of iterates, proving asymptotic regularity, and extracting the convergence rate via a Gronwall-type iteration.",
      "key_steps": [
        {
          "step": 1,
          "description": "Uniform boundedness of the iterate sequence via Assumption 1.2 and the contraction estimate.",
          "uses": ["sec1::asm:boundedness", "sec2::lem:key-estimate"]
        },
        {
          "step": 2,
          "description": "Asymptotic regularity: $\\|x_{n+1} - x_n\\| \\to 0$ by telescoping and the a priori estimate.",
          "uses": ["sec2::lem:key-estimate"]
        },
        {
          "step": 3,
          "description": "Rate extraction via discrete Gronwall inequality applied to the difference sequence.",
          "uses": ["sec0::ext:gronwall-discrete", "sec3::lem:gronwall-variant"]
        }
      ],
      "noise_removed": "The proof contains a lengthy verification (lines 45-70 in source) that the iteration map preserves a certain sublevel set. This is a routine calculation that can be skipped on first reading."
    }
  ],

  "summaries": [
    {
      "section": "1",
      "section_title": "Introduction",
      "summary": "States the main problem (convergence of iterative schemes under relaxed contractivity), reviews prior work by Kirk, Goebel-Reich, and Kohlenbach, and gives an overview of the paper's contributions."
    },
    {
      "section": "2",
      "section_title": "Preliminaries",
      "summary": "Recalls the definitions of Banach spaces and asymptotic contractions. Establishes the key a priori estimate (Lemma 2.3) that is central to all later results."
    },
    {
      "section": "4",
      "section_title": "Main Results",
      "summary": "Proves the main convergence theorem (Theorem 4.1) using a three-stage argument: boundedness, asymptotic regularity, and rate extraction. The rate $O(n^{-\\beta})$ is shown to be optimal."
    }
  ],

  "attention": {
    "high_dependency_nodes": [
      {
        "node_id": "sec2::lem:key-estimate",
        "in_degree": 5,
        "out_degree": 2,
        "note": "Central lemma used by almost every later result. Failure of this estimate would collapse the entire proof."
      }
    ],
    "demanding_proofs": [
      {
        "node_id": "sec4::thm:main",
        "reason": "120-line proof with three distinct phases and a subtle Gronwall argument. Most complex proof in the paper.",
        "estimated_difficulty": "high"
      }
    ]
  },

  "unknowns": [
    {
      "id": "unknown:1",
      "description": "The constant $C$ in Lemma 2.3 depends on dimension, but the exact dependence is not tracked. It is unclear whether the estimate is sharp in high dimensions.",
      "search_hint": "Look for the constant $C$ in the proof of Lemma 2.3 and trace where dimensional dependence enters.",
      "scope": "proof_step",
      "related_nodes": ["sec2::lem:key-estimate"]
    },
    {
      "id": "unknown:2",
      "description": "The authors claim the rate $O(n^{-\\beta})$ is optimal but cite a lower-bound result without proof. The referenced lower bound (Reference [14]) was not verified.",
      "search_hint": "Check Reference [14] for the matching lower-bound construction.",
      "scope": "paper",
      "related_nodes": ["sec4::thm:main"]
    }
  ],

  "notation_index": [
    {
      "symbol": "$\\|\\cdot\\|$",
      "meaning": "Norm on the Banach space $X$.",
      "introduced_in": "sec2::def:banach-space"
    },
    {
      "symbol": "$B_r(x)$",
      "meaning": "Open ball of radius $r$ centered at $x$.",
      "introduced_in": "sec2::not:ball-notation"
    },
    {
      "symbol": "$T$",
      "meaning": "The iteration operator $T: X \\to X$.",
      "introduced_in": "sec1::asm:operator"
    },
    {
      "symbol": "$\\beta$",
      "meaning": "Convergence rate exponent; $\\beta \\in (0,1]$.",
      "introduced_in": "sec1::asm:rate-exponent"
    }
  ],

  "stats": {
    "node_counts": {
      "definition": 5,
      "theorem": 2,
      "lemma": 4,
      "proposition": 1,
      "corollary": 2,
      "assumption": 3,
      "remark": 3,
      "example": 2,
      "conjecture": 1,
      "notation": 4,
      "external_dependency": 3,
      "total": 30
    },
    "edge_counts": {
      "uses_in_proof": 18,
      "extends": 1,
      "generalizes": 1,
      "specializes": 2,
      "equivalent_to": 0,
      "cites_external": 5,
      "total": 27
    },
    "evidence_breakdown": {
      "explicit_ref": 15,
      "inferred": 9,
      "external": 3
    }
  }
}
```

### Field Reference for index.json

#### Top-level fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `schema_version` | `string` | YES | Must match `manifest.json` schema version. |
| `problem_statement` | `object` | YES | The paper's central question and context. |
| `innovation_assessment` | `object` | YES | Assessment of the paper's novelty and contributions. |
| `clusters` | `array` | YES | Groupings of related nodes (by section, topic, or technique). |
| `main_results` | `array` | YES | The headline theorems/results of the paper. |
| `proof_strategies` | `array` | YES | Proof outlines for main results. |
| `summaries` | `array` | YES | Per-section narrative summaries. |
| `attention` | `object` | YES | Highlights of structurally important or difficult parts. |
| `unknowns` | `array` | YES | Gaps, unclear points, or unverified claims. May be empty `[]`. |
| `notation_index` | `array` | YES | Symbol-to-meaning mapping. |
| `stats` | `object` | YES | Aggregate counts for the bundle. |

#### `problem_statement` object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `question` | `string` | YES | The central mathematical question the paper addresses, in a single sentence or short paragraph. |
| `motivation` | `string` | YES | Why this question matters: applications, open-problem status, or theoretical importance. |
| `context` | `string` | YES | How this paper relates to prior work. Mention key predecessors. |

#### `innovation_assessment` object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `summary` | `string` | YES | One-paragraph summary of what is new in this paper. |
| `main_innovations` | `array` | YES | List of distinct innovations. |
| `main_innovations[].description` | `string` | YES | What the innovation is. |
| `main_innovations[].calibration` | `string` | YES | One of: `"significant"` (major new idea or technique), `"incremental"` (meaningful but builds straightforwardly on existing work), `"straightforward_extension"` (routine generalization or minor variant). |
| `main_innovations[].related_nodes` | `string[]` | YES | Node IDs of the graph nodes most closely tied to this innovation. |
| `prior_work_comparison` | `string` | YES | Explicit comparison with the most relevant prior results, noting what is improved and by how much. |

#### `clusters` array items

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | YES | Cluster ID in the format `cluster:{label}`. |
| `label` | `string` | YES | Human-readable cluster name. |
| `section` | `string` | NO | Section number, if the cluster corresponds to a single section. |
| `members` | `string[]` | YES | Node IDs belonging to this cluster. |
| `description` | `string` | YES | Short description of the cluster's role in the paper. |

#### `main_results` array items

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `node_id` | `string` | YES | Node ID of the main result. Must reference a node with `is_main_result: true`. |
| `headline` | `string` | YES | One-sentence summary of what the result says, suitable for a talk abstract. |
| `significance` | `string` | YES | Why this result matters, in one to two sentences. |

#### `proof_strategies` array items

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `target_node` | `string` | YES | Node ID of the result whose proof is being described. |
| `strategy_summary` | `string` | YES | Paragraph-length overview of the proof strategy, describing the overall approach and the key ideas. |
| `key_steps` | `array` | YES | Ordered list of proof steps. |
| `key_steps[].step` | `integer` | YES | Step number (1-indexed). |
| `key_steps[].description` | `string` | YES | What happens in this step. |
| `key_steps[].uses` | `string[]` | YES | Node IDs of definitions/lemmas/external results used in this step. |
| `noise_removed` | `string` | NO | Description of proof sections that are routine or can be skipped on first reading. Helps a reader triage their attention. |

#### `summaries` array items

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `section` | `string` | YES | Section number. |
| `section_title` | `string` | YES | Section title. |
| `summary` | `string` | YES | Narrative summary of the section (2--5 sentences). Should capture the section's role in the paper, not just list its contents. |

#### `attention` object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `high_dependency_nodes` | `array` | YES | Nodes with unusually high in-degree or out-degree in the graph. |
| `high_dependency_nodes[].node_id` | `string` | YES | Node ID. |
| `high_dependency_nodes[].in_degree` | `integer` | YES | Number of edges pointing TO this node. |
| `high_dependency_nodes[].out_degree` | `integer` | YES | Number of edges pointing FROM this node. |
| `high_dependency_nodes[].note` | `string` | YES | Why this node deserves attention. |
| `demanding_proofs` | `array` | YES | Proofs that are especially long, complex, or subtle. |
| `demanding_proofs[].node_id` | `string` | YES | Node ID of the proved statement. |
| `demanding_proofs[].reason` | `string` | YES | Why the proof is demanding. |
| `demanding_proofs[].estimated_difficulty` | `string` | YES | One of: `"low"`, `"medium"`, `"high"`. |

#### `unknowns` array items

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | YES | Unique ID in the format `unknown:{N}`. |
| `description` | `string` | YES | What is unknown or unclear. |
| `search_hint` | `string` | YES | Suggestion for where to look or what to check to resolve this unknown. |
| `scope` | `string` | YES | One of: `"proof_step"` (localized to a single proof step), `"section"` (affects a section), `"paper"` (affects a paper-level conclusion). |
| `related_nodes` | `string[]` | YES | Node IDs relevant to this unknown. |

#### `notation_index` array items

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `symbol` | `string` | YES | The mathematical symbol in LaTeX (e.g., `"$\\|\\cdot\\|$"`). |
| `meaning` | `string` | YES | Plain-text explanation of what the symbol denotes. |
| `introduced_in` | `string` | YES | Node ID where this notation is first introduced. |

#### `stats` object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `node_counts` | `object` | YES | Object mapping each node kind to its count, plus a `"total"` key. All eleven kinds MUST be present, even if the count is 0. |
| `edge_counts` | `object` | YES | Object mapping each edge kind to its count, plus a `"total"` key. All six kinds MUST be present, even if the count is 0. |
| `evidence_breakdown` | `object` | YES | Object mapping each evidence level to the number of edges with that level. All three levels MUST be present. |

**Invariant:** `stats.node_counts.total` MUST equal the length of `graph.json`'s `nodes` array. `stats.edge_counts.total` MUST equal the length of `graph.json`'s `edges` array. `stats.evidence_breakdown` values MUST sum to `stats.edge_counts.total`.

---

## Validation Rules

A conforming bundle MUST satisfy all of the following rules. An implementation SHOULD validate these before emitting the bundle.

### Structural Rules

| ID | Rule | Severity |
|----|------|----------|
| V01 | All three files (`manifest.json`, `graph.json`, `index.json`) MUST be present. | ERROR |
| V02 | `schema_version` MUST match across all three files. | ERROR |
| V03 | All node IDs MUST be unique. | ERROR |
| V04 | All node IDs MUST conform to the format `sec{N}::{kind_abbrev}:{label}` where `{label}` matches `^[a-z0-9]([a-z0-9-]*[a-z0-9])?$`. | ERROR |
| V05 | Every `edge.source` and `edge.target` MUST reference an existing node ID. | ERROR |
| V06 | There MUST be no self-loops (edge where `source == target`). | ERROR |
| V07 | `stats.node_counts.total` MUST equal the number of nodes in `graph.json`. | ERROR |
| V08 | `stats.edge_counts.total` MUST equal the number of edges in `graph.json`. | ERROR |
| V09 | `stats.evidence_breakdown` values MUST sum to `stats.edge_counts.total`. | ERROR |

### Semantic Rules

| ID | Rule | Severity |
|----|------|----------|
| S01 | Every node with `is_main_result: true` MUST appear in `index.json`'s `main_results` array. | ERROR |
| S02 | Every node referenced in `main_results[].node_id` MUST have `is_main_result: true` in its graph node. | ERROR |
| S03 | Every `proof_strategies[].target_node` MUST reference a node with `proof_status` of `"full"` or `"sketch"`. | WARNING |
| S04 | Every node ID referenced anywhere in `index.json` (in `clusters.members`, `main_results.node_id`, `proof_strategies.target_node`, `proof_strategies.key_steps.uses`, `unknowns.related_nodes`, `notation_index.introduced_in`, `attention` node IDs, `innovation_assessment.main_innovations.related_nodes`) MUST exist in `graph.json`'s nodes. | ERROR |
| S05 | `node.kind` MUST be one of the eleven defined kinds. | ERROR |
| S06 | `edge.kind` MUST be one of the six defined edge kinds. | ERROR |
| S07 | `edge.evidence` MUST be one of the three defined evidence levels. | ERROR |
| S08 | Edges with `kind: "cites_external"` SHOULD have `evidence: "external"` and SHOULD target a node with `kind: "external_dependency"`. | WARNING |
| S09 | Edges with `kind: "uses_in_proof"` SHOULD have `source` node with `proof_status` in `{"full", "sketch", "deferred"}`. | WARNING |
| S10 | `node.proof_status` MUST be `"not_applicable"` for kinds: `definition`, `assumption`, `remark`, `notation`, `conjecture`. | WARNING |
| S11 | `node.proof_status` MUST be `"external"` for kind `external_dependency`. | WARNING |
| S12 | `node.novelty` SHOULD be `"classical"` for kind `external_dependency`. | WARNING |
| S13 | `unknown.scope` MUST be one of: `"proof_step"`, `"section"`, `"paper"`. | ERROR |
| S14 | `innovation_assessment.main_innovations[].calibration` MUST be one of: `"significant"`, `"incremental"`, `"straightforward_extension"`. | ERROR |
| S15 | `attention.demanding_proofs[].estimated_difficulty` MUST be one of: `"low"`, `"medium"`, `"high"`. | ERROR |

### Completeness Rules

| ID | Rule | Severity |
|----|------|----------|
| C01 | Every section of the paper that is within `scope.sections_included` MUST have an entry in `index.json`'s `summaries` array. | WARNING |
| C02 | At least one `main_result` entry MUST be present (a paper without any main results is not a valid analysis). | WARNING |
| C03 | Every node with `proof_status: "full"` or `"sketch"` that has `is_main_result: true` SHOULD have a corresponding `proof_strategies` entry. | WARNING |
| C04 | The `notation_index` SHOULD contain entries for all non-standard symbols used in `node.statement` fields. | WARNING |
| C05 | `stats.node_counts` MUST contain keys for all eleven node kinds (use 0 for kinds not present). | ERROR |
| C06 | `stats.edge_counts` MUST contain keys for all six edge kinds (use 0 for kinds not present). | ERROR |
| C07 | `stats.evidence_breakdown` MUST contain keys for all three evidence levels (use 0 for levels not present). | ERROR |

---

## Enum Summary

For quick reference, all controlled vocabularies in the schema:

### Node kinds (11)
`definition`, `theorem`, `lemma`, `proposition`, `corollary`, `assumption`, `remark`, `example`, `conjecture`, `notation`, `external_dependency`

### Edge kinds (6)
`uses_in_proof`, `extends`, `generalizes`, `specializes`, `equivalent_to`, `cites_external`

### Evidence levels (3)
`explicit_ref`, `inferred`, `external`

### Proof status (5)
`full`, `sketch`, `deferred`, `external`, `not_applicable`

### Novelty (4)
`new`, `classical`, `extended`, `folklore`

### Analysis level (3)
`bird_eye`, `frog_eye`, `both`

### Source type (2)
`latex`, `pdf`

### Innovation calibration (3)
`significant`, `incremental`, `straightforward_extension`

### Unknown scope (3)
`proof_step`, `section`, `paper`

### Estimated difficulty (3)
`low`, `medium`, `high`

---

## Changelog

| Version | Date | Description |
|---------|------|-------------|
| 0.1.0 | 2026-03-01 | Initial draft. |
