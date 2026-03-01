# Phase 3 Runbook — Real LaTeX Bundles (Medium + Long)

This phase is about generating **schema-valid** PaperParser bundles from LaTeX sources for dashboard testing and review.

**Out of scope:** `/Users/hanzhicheng/Desktop/Coding/agent4math/PaperParser/ref/papers/MS_nextstage.pdf` (next-stage only).

---

## Prerequisites

- Use `PYTHONPYCACHEPREFIX=/tmp/pycache` for Python commands (avoids writing `__pycache__` into the workspace).
- All runs are **local-only** under `ref/runs/` (ignored by `.gitignore`).

---

## 1) Medium fixture (`medium_Mueller.gz`)

Build bundle:
```bash
cd /Users/hanzhicheng/Desktop/Coding/agent4math/PaperParser
PYTHONPYCACHEPREFIX=/tmp/pycache python3 tools/build_bundle_from_latex.py \
  ref/papers/medium_Mueller.gz \
  --out ref/runs/medium_mueller/parser-run
```

Validate:
```bash
PYTHONPYCACHEPREFIX=/tmp/pycache python3 tools/validate_bundle_schema.py ref/runs/medium_mueller/parser-run
PYTHONPYCACHEPREFIX=/tmp/pycache python3 tools/check_bundle_consistency.py ref/runs/medium_mueller/parser-run
```

Render static report:
```bash
PYTHONPYCACHEPREFIX=/tmp/pycache python3 tools/render_report.py \
  ref/runs/medium_mueller/parser-run \
  --out ref/runs/medium_mueller/report.md
```

---

## 2) Long fixture (`long_nalini/.../main.tex`)

Build bundle:
```bash
cd /Users/hanzhicheng/Desktop/Coding/agent4math/PaperParser
PYTHONPYCACHEPREFIX=/tmp/pycache python3 tools/build_bundle_from_latex.py \
  ref/papers/long_nalini/arXiv-2502.12268v2 \
  --out ref/runs/long_nalini/parser-run
```

Validate:
```bash
PYTHONPYCACHEPREFIX=/tmp/pycache python3 tools/validate_bundle_schema.py ref/runs/long_nalini/parser-run
PYTHONPYCACHEPREFIX=/tmp/pycache python3 tools/check_bundle_consistency.py ref/runs/long_nalini/parser-run
```

Render static report:
```bash
PYTHONPYCACHEPREFIX=/tmp/pycache python3 tools/render_report.py \
  ref/runs/long_nalini/parser-run \
  --out ref/runs/long_nalini/report.md
```

---

## 3) Refinement loop (Phase 3.2)

If you or an agent edits `graph.json`, refresh derived fields in `index.json`:
```bash
PYTHONPYCACHEPREFIX=/tmp/pycache python3 tools/refresh_index_from_graph.py \
  ref/runs/long_nalini/parser-run \
  --update-attention
```

Then re-check:
```bash
PYTHONPYCACHEPREFIX=/tmp/pycache python3 tools/check_bundle_consistency.py ref/runs/long_nalini/parser-run
```

---

## 4) Hand-off to the dashboard worktree

The dashboard expects `manifest.json`, `graph.json`, `index.json` in a `data/` folder.

From a run directory:
- Copy `ref/runs/<run>/parser-run/{manifest,graph,index}.json` into the dashboard worktree’s data location (e.g. `dashboard/public/data/` or whatever the scaffold uses).

---

## 5) Cross-validation checklist (Phase 3.3)

To compare Class B (prompt suite static report) vs Class A (dashboard) for the same paper:

1. Generate a bundle (this runbook) and render a deterministic report:
   - `ref/runs/<run>/report.md` (from `tools/render_report.py`)
2. Generate a prompt-suite report separately using `prompts/00_skeleton.md` → `prompts/04_assembly.md`.
3. Compare:
   - Title/authors/year sanity
   - Main results list (do the headline theorems match?)
   - Dependency edges: are the most important `\\ref{...}`-based dependencies represented?
   - External dependencies: are the key `\\cite{...}` keys surfaced as `external_dependency` nodes?
4. If `graph.json` changes during refinement, run:
   - `tools/refresh_index_from_graph.py ... --update-attention`
   - then re-run `tools/check_bundle_consistency.py`
