# PaperParser Agent Protocol (v0.1.0)

This document is the instruction set for an agent tasked with analyzing a mathematical research paper and producing a **PaperParser bundle**:

```
parser-run/
  manifest.json
  graph.json
  index.json
```

**Source of truth for JSON shape:** `schema/*.schema.json` and `docs/schema_spec.md`.

---

## 1) Inputs

One of:
- **LaTeX source** (preferred): a `.tex` file, a `.gz` containing TeX, or a directory containing `main.tex`.
- **PDF** (fallback): use only if LaTeX is unavailable; expect lower accuracy for cross-references.

Optional:
- Focus directive: include/skip specific sections/appendices.
- Analysis level: `"bird_eye"`, `"frog_eye"`, or `"both"` (default).

---

## 2) Output constraints (non-negotiable)

You MUST produce:
- `manifest.json` matching `schema/manifest.schema.json`
- `graph.json` matching `schema/graph.schema.json`
- `index.json` matching `schema/index.schema.json`

All three MUST use the same `"schema_version"` (currently `"0.1.0"`).

---

## 3) Canonical vocabularies

### Node kinds (allowed)

Only these kinds are allowed (see `schema/graph.schema.json`):

- `definition`
- `theorem`
- `lemma`
- `proposition`
- `corollary`
- `assumption`
- `remark`
- `example`
- `conjecture`
- `notation`
- `external_dependency`

If the paper contains other structures (e.g., algorithms, questions, key equations), represent them using an allowed kind and record the original form in `node.metadata.subkind` (e.g., `{"subkind":"algorithm"}`).

### Edge kinds (allowed)

- `uses_in_proof`
- `extends`
- `generalizes`
- `specializes`
- `equivalent_to`
- `cites_external`

### Evidence levels (allowed)

- `explicit_ref` — explicitly referenced (e.g., `\ref{...}` / “by Lemma 2.3”).
- `inferred` — clearly necessary but not explicitly cited.
- `external` — external citation / outside source.

---

## 4) Protocol steps

### Step 1 — Ingest paper → emit `manifest.json`

**Goal:** fill paper metadata, analysis scope, and producer info.

1. **Flatten LaTeX (if applicable).**
   - Resolve `\input{...}` / `\include{...}` recursively (best-effort).
   - Record missing assets as warnings (do not fail unless the source becomes unreadable).

2. **Extract paper metadata (best-effort, but do not fabricate):**
   - `paper.title` (required; if missing, use `"Untitled paper"`)
   - `paper.authors` (required; if missing, use `["Unknown"]`)
   - `paper.year` (required; only infer if the source clearly states a year)
   - `paper.subject_area` (required; free text)
   - optional `paper.arxiv_id`, `paper.doi`, `paper.version_note`
   - `paper.source_type`: `"latex"` or `"pdf"`
   - `paper.source_files`: list of filenames analyzed

3. **Set scope:**
   - `scope.sections_included`: `["all"]` unless the user specified focus/skip.
   - `scope.analysis_level`: `"bird_eye" | "frog_eye" | "both"`.

4. **Producer info:**
   - `producer.agent`: model/tool identifier
   - `producer.timestamp_start` / `producer.timestamp_end` (ISO 8601)
   - `created_at`: ISO 8601 bundle creation timestamp

**PDF fallback note:** you cannot rely on `\label` / `\ref` tables. Use `paper.version_note` to note reduced accuracy (e.g., “Parsed from PDF; cross-references may be incomplete.”).

**Repo helper:** `tools/prepare_latex.py` can flatten `.tex`, `.gz`, or a `main.tex` directory into `*.flat.tex` and report missing assets.

**Repo helper (PDF fallback):** `tools/build_bundle_from_pdf.py` can build a **schema-valid** bundle from a PDF via text extraction. It is heuristic and may miss theorem boundaries and dependencies.

---

### Step 2 — Extract objects → build `graph.json.nodes`

**Goal:** represent theorem-like content (plus key notation/external dependencies) as nodes.

1. **Environment mapping (LaTeX):**
   - Parse `\newtheorem{env}{Printed Name}` when present.
   - Include common defaults even without `\newtheorem`:
     `theorem`, `lemma`, `proposition`, `corollary`, `definition`, `assumption`,
     `remark`, `example`, `conjecture`, `notation`, plus custom names like `exo`, `question`, `open`, `algorithm`.

2. **For each extracted object, emit a node with EXACT required fields:**

| Field | Meaning |
|---|---|
| `id` | canonical ID (see below) |
| `kind` | one of the allowed kinds |
| `label` | human-readable label as printed (“Lemma 2.3 (Key estimate)”) |
| `section` | section number as string (`"0"` for preamble) |
| `section_title` | section title (may be empty) |
| `number` | printed theorem/definition number (may be empty) |
| `latex_label` | the `\label{...}` string, or `null` |
| `statement` | full LaTeX-flavored statement (non-empty) |
| `proof_status` | `full | sketch | deferred | external | not_applicable` |
| `is_main_result` | `true` for headline results; keep consistent with `index.main_results` |
| `novelty` | `new | classical | extended | folklore` |
| `metadata` | free-form object (may be `{}`) |

3. **Node ID convention (required):**

```
sec{SECTION}::{abbr}:{slug}
```

Where `{abbr}` is:
`def | thm | lem | prop | cor | asm | rem | ex | conj | not | ext`

And `{slug}` MUST be lowercase ASCII letters/digits/hyphens only.

**Recommended slug source:** derive from `latex_label` when available; otherwise from a short name (“key-estimate”), otherwise a stable counter (`n-1`, `n-2`, …).

4. **Representing “non-schema” objects (required policy):**
   - *Key labeled equation:* use `kind:"remark"` and `metadata.subkind:"equation"`; put the equation text in `statement`, and the `\label{...}` in `latex_label`.
   - *Algorithm environment:* use `kind:"remark"` and `metadata.subkind:"algorithm"`.
   - *Question/Open problem:* use `kind:"conjecture"` and `metadata.subkind:"question"` / `"open"`.

---

### Step 3 — Extract dependencies → build `graph.json.edges`

**Goal:** connect nodes with directed edges capturing logical dependence.

1. Build a map from `latex_label -> node_id` (for LaTeX sources).
2. For each node statement (and proof text if available), extract:
   - `\ref{...}` / `\eqref{...}` → `uses_in_proof` edges to the referenced node
   - `\cite{...}` → `cites_external` edges to `external_dependency` nodes (create nodes as needed)
3. Evidence policy:
   - Use `explicit_ref` when the source explicitly references a label/result.
   - Use `external` for citation edges.
   - Use `inferred` sparingly, only for obvious dependencies.

Edge fields (all required):
`source`, `target`, `kind`, `evidence`, `detail`, `metadata`.

---

### Step 4 — Enrichment → emit `index.json`

`index.json` is required and MUST include all required top-level fields.

Minimum guidance:
- `problem_statement`: concise and specific (question, motivation, context).
- `innovation_assessment`: concrete novelty summary + innovations list (each with calibration + related node IDs).
- `clusters`: may be empty (`[]`). Clusters do not need to cover all nodes.
- `main_results`: MUST have at least one entry. Every referenced node MUST have `is_main_result:true`.
- `proof_strategies`: add at least one strategy for each main result when possible; may be empty if unknown.
- `summaries`: per-section summaries when possible; may be empty.
- `attention`: select a few high-degree nodes and a few demanding proofs.
- `unknowns`: may be empty.
- `notation_index`: may be empty.
- `stats`: MUST match counts computed from `graph.json` and MUST include required zero-count keys.

**Repo helper:** `tools/refresh_index_from_graph.py` can recompute `index.stats` from `graph.json` and (optionally) refresh `index.attention`.

---

## 5) Validation + dashboard handoff

When available, run:

```bash
python3 tools/validate_bundle_schema.py <parser-run-dir>
python3 tools/check_bundle_consistency.py <parser-run-dir>
```

To load a bundle into the dashboard data folder in this repo:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 tools/sync_bundle_to_dashboard.py <parser-run-dir> --backup --validate
```

---

## 6) Quality checklist (before finalizing)

- `schema_version` matches across manifest/graph/index.
- Every edge endpoint exists in `graph.nodes`.
- Every node ID matches the canonical `sec{...}::{abbr}:{slug}` pattern.
- `index.main_results[*].node_id` points to nodes with `is_main_result:true`.
- `index.stats` matches the graph counts (including required zero-count keys).
