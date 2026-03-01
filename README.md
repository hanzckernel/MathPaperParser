# PaperParser (Current Stage Guide)

PaperParser is a math-paper analysis project with:
- a strict analysis protocol (`docs/prompt_protocol.md`)
- JSON schemas (`schema/`)
- a prompt suite for webchat workflows (`prompts/`)
- helper tools for LaTeX prep and bundle consistency checks (`tools/`)

At the current stage:
- Phase 0 (prompt suite) is stable for static review prototypes.
- Phase 3 tooling can generate **schema-valid bundles** from LaTeX for dashboard testing.
- The dashboard itself is being developed separately.

In practice, the most reliable path right now is still the prompt-suite workflow.

---

## 1) What to use right now

Use the prompt suite in `prompts/`:

1. `prompts/00_skeleton.md`
2. `prompts/01_bird_eye.md`
3. `prompts/02_dependency_graph.md`
4. `prompts/03_frog_eye.md`
5. `prompts/04_assembly.md`

Run them **in order** and pass full outputs forward step-by-step.

Reference guide: `prompts/README.md`

---

## 2) Quickstart (recommended path)

### Step A — pick a paper input

Start with one fixture in `ref/papers/` (these are **local-only** and may not exist in a fresh clone; see `ref/papers/README.md`):
- `ref/papers/short_Petri.tex` (best first run)
- `ref/papers/medium_Mueller.gz`
- `ref/papers/long_nalini/arXiv-2502.12268v2/main.tex`

Current stage note:
- `ref/papers/MS_nextstage.pdf` is reserved for later and is out of scope for now.

### Step B — flatten LaTeX (if needed)

If your input uses `\input`/`\include`, preprocess it:

```bash
python3 tools/prepare_latex.py <path-to-tex-or-gz-or-project-dir>
```

This writes `*.flat.tex` next to the input and reports missing refs (inputs/bib/graphics).

### Step C — run prompts in your model chat

Open a reasoning model chat and do:
- attach the full PDF or LaTeX source (flattened TeX preferred)
- paste `prompts/00_skeleton.md`
- copy full output into the next prompt, continuing through `04_assembly.md`

Do not skip steps or summarize intermediate outputs.

If your Markdown math renderer errors on double-escaped LaTeX like `\\pi`, fix it with:

```bash
python3 tools/fix_markdown_latex_backslashes.py <report.md> --inplace
```

### Copy/paste demo run (short_Petri)

If you have the local demo bundle under `ref/runs/short_petri/` (not tracked in git), sanity-check it with:

```bash
python3 tools/prepare_latex.py ref/papers/short_Petri.tex
python3 tools/check_bundle_consistency.py ref/runs/short_petri/parser-run
```

Then open:
- `ref/runs/short_petri/report.md`

---

## 3) Outputs you should expect

### Prompt-suite path (today’s main path)
- Final Markdown report with:
  - paper skeleton
  - bird’s-eye summary
  - Mermaid dependency graph(s)
  - frog’s-eye proof roadmaps
  - notation + unknowns/attention items

### Protocol/bundle path (agent-oriented)
- `manifest.json`
- `graph.json`
- `index.json`
- optional dashboard bundle structure under `parser-run/dashboard/`

Protocol reference: `docs/prompt_protocol.md`

---

## 4) Validate a generated bundle (if you have one)

If you generated `parser-run/{manifest,graph,index}.json`, run:

```bash
python3 tools/check_bundle_consistency.py <path-to-parser-run>
```

Example:

```bash
python3 tools/check_bundle_consistency.py ref/runs/short_petri/parser-run
```

To also validate JSON Schema:

```bash
python3 tools/validate_bundle_schema.py ref/runs/short_petri/parser-run
```

---

## 5) Existing demo artifacts

- Demo report: `ref/runs/short_petri/report.md`
- Demo bundle: `ref/runs/short_petri/parser-run/`

These are good references for expected structure and quality.

Note: `ref/runs/` is treated as **local-only** and is typically ignored by git (see `.gitignore`), so a fresh clone may not contain these artifacts.

---

## 6) Phase 3 runbook

- `docs/phase3_runbook.md`

---

## 7) Repo map

- `prompts/` — copy-paste prompt pipeline for webchat users
- `docs/` — protocol/spec docs
- `schema/` — JSON schemas + examples
- `tools/` — local helper scripts
- `ref/` — local fixtures and demo runs
- `dashboard/` — dashboard source area (planned; not the primary current-stage workflow)
