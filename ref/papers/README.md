# Paper Fixtures (Local Only)

This directory contains **local-only** paper fixtures used to test the PaperParser protocol and static prompt pipeline.

These files are intentionally **not** meant to be committed or published.

## Entry points

### Short (LaTeX, single file)
- `short_Petri.tex`
- Notes:
  - References `bib_hyperbolic.bib` and figures (`poisson1`, `poisson2`, `bw2`, `dirichlet-bis`) that may be missing; this is non-blocking for structure extraction from TeX.

### Medium (LaTeX, gzip-compressed)
- `medium_Mueller.gz` is a gzipped `.tex`.
- To decompress:
  - `gzip -dc ref/papers/medium_Mueller.gz > ref/papers/medium_Mueller.tex`

### Long (LaTeX project folder)
- `long_nalini/arXiv-2502.12268v2/main.tex`
- Keep all `\\input{...}` files in the same folder.

### PDF (reserved for next stage)
- `MS_nextstage.pdf` is **out of scope for this stage**; use only after the LaTeX-based pipeline is solid.

## Preprocessing helper

Use:
- `python3 tools/prepare_latex.py <path>`

It can take a `.tex`, a `.gz` containing TeX, or a directory containing `main.tex`, and will write a flattened `*.flat.tex` next to the input while reporting missing referenced assets.

