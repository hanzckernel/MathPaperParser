# PaperParser Prompt Suite -- User Guide

## What is PaperParser?

PaperParser is a structured analysis pipeline for mathematical research papers. Given a PDF (or LaTeX source), the prompt suite guides a large language model through a systematic decomposition of the paper's logical architecture: extracting every formal mathematical object (theorems, lemmas, definitions, assumptions), mapping all dependencies between them, assessing the novelty and significance of contributions honestly, and producing a navigable report with dependency graphs, proof roadmaps, and a notation glossary. The output is designed for graduate students and researchers who want to understand a paper deeply without spending days on a first pass.

---

## How to Use the Prompt Suite

The suite consists of **5 prompts** (numbered 00 through 04), designed to be run **sequentially**. Each prompt builds on the output of the previous ones. You paste each prompt into your model's chat interface along with the required input.

### Workflow

```
[Your Paper PDF]
       |
       v
  Prompt 00: Skeleton Extraction  -->  skeleton output
       |
       v
  Prompt 01: Bird's-Eye Analysis  -->  high-level analysis
       |
       v
  Prompt 02: Dependency Graph     -->  Mermaid.js diagrams
       |
       v
  Prompt 03: Frog's-Eye Proofs    -->  proof roadmaps
       |
       v
  Prompt 04: Report Assembly      -->  final Markdown report
```

**Important:** Each prompt's output becomes input for subsequent prompts. Do NOT skip prompts or run them out of order. Copy the full output of each step and paste it into the next prompt where indicated.

---

## Prompt Reference

| File | Prompt | Input | Output | Time Estimate |
|------|--------|-------|--------|---------------|
| `00_skeleton.md` | Paper Skeleton Extraction | PDF (attached) | Structured list of all sections and formal objects | 3--5 min |
| `01_bird_eye.md` | Bird's-Eye Analysis | Skeleton from Prompt 00 | Core problem, novelty assessment, section summaries, main results | 3--5 min |
| `02_dependency_graph.md` | Dependency Graph | Skeleton from Prompt 00 | Two Mermaid.js dependency diagrams (condensed + full) | 5--8 min |
| `03_frog_eye.md` | Frog's-Eye Proof Strategies | Skeleton + dependency graph from Prompts 00--02 | Proof decompositions, noise identification, knowledge gaps | 5--10 min |
| `04_assembly.md` | Report Assembly | All outputs from Prompts 00--03 | Single self-contained Markdown report | 3--5 min |

---

## Target Models

| Model | Suitability | Notes |
|-------|-------------|-------|
| **GPT 5.2 Extended Thinking** | Primary recommendation | Best at long structured reasoning; handles the skeleton extraction and dependency tracing reliably. Use "extended thinking" / "reasoning" mode if available. |
| **Gemini 3.1 Pro** | Strong secondary option | Good at long-context tasks; handles full papers well. |
| **Claude Opus / Sonnet** | Also suitable | Strong at structured analysis; use with the full paper attached. |
| **Any reasoning-capable model** | Acceptable | The prompts are model-agnostic. Performance varies. |

---

## Tips for Best Results

### Paper attachment
- **Attach the full paper PDF** to Prompt 00. Do not paste excerpts -- the model needs the complete document to build an accurate skeleton.
- If you have LaTeX source files (`.tex`), attach those instead. LaTeX source produces significantly better results because `\label`/`\ref` cross-references are preserved.
- For papers longer than ~40 pages, consider using focus directives (described in Prompt 00) to analyze specific sections.

### Model settings
- **Use thinking / reasoning mode** when available. These prompts are optimized for models that plan before responding.
- **Set a high output token limit** (at least 8,000 tokens; 16,000+ preferred for Prompts 02 and 03).
- **Use a fresh conversation** for each prompt to avoid context pollution. Alternatively, run the full pipeline in a single long conversation if your model supports sufficient context.

### During the pipeline
- **Verify the skeleton** (Prompt 00 output) before proceeding. If the model missed objects or sections, re-run Prompt 00 or manually correct the skeleton. Everything downstream depends on it.
- **Copy outputs exactly.** When pasting a previous prompt's output into the next prompt, copy the entire output -- do not truncate or summarize it.
- If a prompt's output seems incomplete, say "continue" or "please complete the output" -- the model may have hit a length limit.

### Interpreting results
- The pipeline is designed for **honest assessment**. If the novelty calibration says "straightforward extension," that is not a negative judgment -- it is an accurate description that helps you focus your reading time.
- The dependency graphs are in **Mermaid.js** format. You can render them at [mermaid.live](https://mermaid.live), in VS Code with a Mermaid extension, or in any Markdown renderer that supports Mermaid.
- The "unknowns" and "attention items" sections are the most actionable parts of the report. Start there if you want to verify the paper's correctness.

---

## Combining Outputs into a Final Report

Prompt 04 does this automatically: it takes all outputs from Prompts 00--03 and assembles them into a single navigable Markdown document with:

- A summary card (title, authors, contribution, calibration)
- Table of contents with anchor links
- Inline Mermaid.js dependency graphs
- Proof roadmaps with cross-links
- Notation glossary
- "How to Read This Report" guide

If you want to manually assemble the report instead, structure it as:

```
1. Summary Card
2. Bird's-Eye Overview (from Prompt 01)
3. Dependency Graphs (from Prompt 02)
4. Paper Skeleton (from Prompt 00)
5. Proof Strategies (from Prompt 03)
6. Notation Glossary (extracted across all prompts)
7. Unknowns and Attention Items (from Prompts 01--03)
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Model misses some theorems/lemmas in Prompt 00 | Re-run with explicit instruction: "You missed Lemma X.Y in Section Z. Please re-extract." |
| Dependency graph is too large to render | Use the condensed (bird's-eye) graph only. The full graph is for reference. |
| Model refuses to give honest calibration | Re-emphasize: "Do not sugarcoat. If the contribution is incremental, say so." |
| Output is truncated | Say "continue from where you left off" or reduce scope with focus directives. |
| KaTeX/MathJax shows LaTeX parse errors like `\\pi` / `\\mathcal{S}` | Tell the model: "Do not double-escape backslashes in Markdown; use `\\pi` → `\pi` (single backslash)". If you already have Markdown with double-escaped LaTeX, run `python3 tools/fix_markdown_latex_backslashes.py <report.md> --inplace`. |
| Mermaid diagram has syntax errors | Paste into [mermaid.live](https://mermaid.live) and fix manually, or ask the model to correct the syntax. |
