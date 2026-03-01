# Phase 3 — Agent Integration + Real Data Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add local CLI tooling to build + validate PaperParser bundles from LaTeX inputs, and generate real local runs for the medium + long fixtures.

**Architecture:** Provide three small Python CLIs:
1) schema validation (`validate_bundle_schema.py`)
2) bundle build from flattened LaTeX (`build_bundle_from_latex.py`)
3) deterministic markdown rendering (`render_report.py`)

**Tech Stack:** Python 3 (stdlib) + `jsonschema` (already installed), existing repo tools (`prepare_latex.py`, `check_bundle_consistency.py`).

---

### Task 1: Add JSON Schema validator CLI

**Files:**
- Create: `tools/validate_bundle_schema.py`

**Step 1: Implement CLI**
- Support:
  - `tools/validate_bundle_schema.py <bundle_dir>`
  - or `--manifest/--graph/--index`
  - optional `--schema-dir schema/`
- Load schemas from `schema/*.schema.json`
- Validate each JSON file with `jsonschema.Draft202012Validator`

**Step 2: Smoke check**
- Run:
  - `PYTHONPYCACHEPREFIX=/tmp/pycache python3 tools/validate_bundle_schema.py schema/examples`
  - `PYTHONPYCACHEPREFIX=/tmp/pycache python3 tools/validate_bundle_schema.py ref/runs/short_petri/parser-run`

---

### Task 2: Add report renderer CLI

**Files:**
- Create: `tools/render_report.py`

**Step 1: Implement renderer**
- Inputs: `<bundle_dir>` (containing `manifest.json`, `graph.json`, `index.json`)
- Output: `report.md` (default: sibling of `parser-run/`, override via `--out`)
- Render:
  - header + summary card from `manifest.paper` + `index.problem_statement`
  - Mermaid graph from `graph.edges` (`source --> target`)
  - main results list from `index.main_results`
  - attention + unknowns

**Step 2: Smoke check**
- Run:
  - `PYTHONPYCACHEPREFIX=/tmp/pycache python3 tools/render_report.py ref/runs/short_petri/parser-run --out /tmp/short_petri_report.md`

---

### Task 3: Add LaTeX → bundle builder CLI

**Files:**
- Create: `tools/build_bundle_from_latex.py`
- Modify: `tools/prepare_latex.py` (only if required by builder)

**Step 1: Implement LaTeX scanning utilities**
- Parse `\\newtheorem{env}{Printed}` to map `env -> kind`
  - Match Printed strings for: Theorem, Lemma, Proposition, Corollary, Definition, Conjecture, Remark(s), Example, Notation, Assumption
- Track section structure:
  - `\\section`, `\\subsection`, `\\subsubsection`, `\\appendix`
  - produce `node.section` like `1`, `2.1`, `A.2`
  - produce `node.section_title` from current headings (joined by `" — "`)
- Extract environment blocks:
  - `\\begin{env}` … `\\end{env}` (best-effort, non-nested)
  - statement text = raw block content (trim)
  - `latex_label` from `\\label{...}` in block

**Step 2: Implement node ID + numbering policy**
- Canonical ID: `sec{section}::{abbr}:{slug}`
  - abbr map: definition=def, theorem=thm, lemma=lem, proposition=prop, corollary=cor, assumption=asm, remark=rem, example=ex, conjecture=conj, notation=not, external_dependency=ext
  - slug: derived from `latex_label` (lowercase, `[^a-z0-9]+ -> -`), fallback to `n-{counter}`

**Step 3: Implement edge extraction**
- `uses_in_proof` edges:
  - when statement contains `\\ref{label}` or `\\eqref{label}`, connect current node -> referenced node (if known)
- `cites_external` edges:
  - detect `\\cite{key1,key2}` in statement
  - create `external_dependency` nodes for each key and connect current node -> ext node
- Any unresolved refs remain ignored (no edge) but recorded to `node.metadata.unresolved_refs`

**Step 4: Implement index.json enrichment (minimal, consistent)**
- `stats` computed from graph
- `summaries`: one entry per section derived from headings
- `attention.high_dependency_nodes`: top-k by `(in_degree + out_degree)`
- `attention.demanding_proofs`: top-k by statement length
- `unknowns`: include one paper-level unknown noting bundle is auto-generated
- `main_results`: pick a heuristic main theorem (label contains `main` else first theorem-like)
- `proof_strategies`: add one placeholder strategy for the chosen main result

**Step 5: Validate with existing checker + schema validator**
- Run:
  - `PYTHONPYCACHEPREFIX=/tmp/pycache python3 tools/check_bundle_consistency.py <run_dir>/parser-run`
  - `PYTHONPYCACHEPREFIX=/tmp/pycache python3 tools/validate_bundle_schema.py <run_dir>/parser-run`

---

### Task 4: Phase 3 runbook

**Files:**
- Create: `docs/phase3_runbook.md`

**Contents:**
- Commands to build + validate bundles for medium + long fixtures
- Explicit reminder: do not use `ref/papers/MS_nextstage.pdf` yet
- How to hand the resulting `parser-run/` to the dashboard worktree (copy into `dashboard/public/data/` or equivalent)

---

### Task 5: Generate local runs (not committed)

**Runs:**
- Medium:
  - `PYTHONPYCACHEPREFIX=/tmp/pycache python3 tools/build_bundle_from_latex.py ref/papers/medium_Mueller.gz --out ref/runs/medium_mueller/parser-run`
  - `PYTHONPYCACHEPREFIX=/tmp/pycache python3 tools/render_report.py ref/runs/medium_mueller/parser-run --out ref/runs/medium_mueller/report.md`
- Long:
  - `PYTHONPYCACHEPREFIX=/tmp/pycache python3 tools/build_bundle_from_latex.py ref/papers/long_nalini/arXiv-2502.12268v2 --out ref/runs/long_nalini/parser-run`
  - `PYTHONPYCACHEPREFIX=/tmp/pycache python3 tools/render_report.py ref/runs/long_nalini/parser-run --out ref/runs/long_nalini/report.md`

**Validation:**
- `PYTHONPYCACHEPREFIX=/tmp/pycache python3 tools/check_bundle_consistency.py ref/runs/medium_mueller/parser-run`
- `PYTHONPYCACHEPREFIX=/tmp/pycache python3 tools/check_bundle_consistency.py ref/runs/long_nalini/parser-run`
- `PYTHONPYCACHEPREFIX=/tmp/pycache python3 tools/validate_bundle_schema.py ref/runs/medium_mueller/parser-run`
- `PYTHONPYCACHEPREFIX=/tmp/pycache python3 tools/validate_bundle_schema.py ref/runs/long_nalini/parser-run`

---

### Task 6: Commit

**Commit:**
```bash
git add tools/validate_bundle_schema.py tools/build_bundle_from_latex.py tools/render_report.py docs/phase3_runbook.md docs/plans/2026-03-01-phase3-agent-integration.md
git commit -m "feat(phase3): latex bundle builder + schema validation"
```

