#!/usr/bin/env python3
from __future__ import annotations

import argparse
import gzip
import re
import sys
from dataclasses import dataclass
from pathlib import Path


INPUT_CMD_RE = re.compile(r"\\(input|include)(?![A-Za-z])\s*(?:\{([^}]+)\}|([^\s%]+))")
BIB_CMD_RE = re.compile(r"\\(bibliography|addbibresource)\s*\{([^}]+)\}")
GRAPHICS_CMD_RE = re.compile(r"\\includegraphics(?:\[[^\]]*\])?\s*\{([^}]+)\}")


def strip_line_comment(line: str) -> str:
    # TeX comment: % to end-of-line, unless escaped as \%.
    out: list[str] = []
    i = 0
    while i < len(line):
        ch = line[i]
        if ch == "%":
            if i > 0 and line[i - 1] == "\\":  # \%
                out.append(ch)
                i += 1
                continue
            break
        out.append(ch)
        i += 1
    return "".join(out)


def resolve_tex_path(root: Path, ref: str) -> Path | None:
    ref = ref.strip()
    if not ref:
        return None

    candidate = (root / ref).resolve()
    if candidate.is_file():
        return candidate

    if not candidate.suffix:
        candidate_tex = candidate.with_suffix(".tex")
        if candidate_tex.is_file():
            return candidate_tex

    return None


@dataclass(frozen=True)
class FlattenResult:
    flat_tex: str
    missing_inputs: tuple[str, ...]
    missing_bibs: tuple[str, ...]
    missing_graphics: tuple[str, ...]


def flatten_latex(entry: Path) -> FlattenResult:
    """
    Flatten a LaTeX document by recursively inlining \\input{...} and \\include{...}
    directives. Missing inputs are reported and left in place.

    The function also scans for missing bibliography files and graphics includes.
    """
    entry = entry.resolve()
    if entry.is_dir():
        entry_tex = entry / "main.tex"
        if not entry_tex.is_file():
            raise FileNotFoundError(f"Directory does not contain main.tex: {entry}")
        entry = entry_tex

    root = entry.parent.resolve()

    if entry.suffix == ".gz":
        with gzip.open(entry, "rt", encoding="utf-8", errors="replace") as f:
            entry_text = f.read()
        virtual_name = entry.with_suffix("").name
        entry_virtual = (root / f"{virtual_name}.tex").resolve()
    else:
        entry_text = entry.read_text(encoding="utf-8", errors="replace")
        entry_virtual = entry

    visited: set[Path] = set()
    missing_inputs: set[str] = set()
    missing_bibs: set[str] = set()
    missing_graphics: set[str] = set()

    def scan_assets(line: str) -> None:
        for m in BIB_CMD_RE.finditer(line):
            bib_ref = m.group(2).strip()
            for part in [p.strip() for p in bib_ref.split(",") if p.strip()]:
                bib_path = (root / part).resolve()
                if bib_path.suffix != ".bib":
                    bib_path = bib_path.with_suffix(".bib")
                if not bib_path.is_file():
                    missing_bibs.add(bib_path.name)

        for m in GRAPHICS_CMD_RE.finditer(line):
            gref = m.group(1).strip()
            if not gref:
                continue
            gpath = (root / gref).resolve()
            if gpath.suffix:
                if not gpath.is_file():
                    missing_graphics.add(gref)
            else:
                exts = [".pdf", ".png", ".jpg", ".jpeg", ".eps"]
                if not any(gpath.with_suffix(ext).is_file() for ext in exts):
                    missing_graphics.add(gref)

    def inline_text(path: Path, text: str) -> str:
        path = path.resolve()
        if path in visited:
            return f"% [prepare_latex] Skipping already-inlined file: {path.name}\n"
        visited.add(path)

        out_lines: list[str] = [f"% >>> BEGIN FILE: {path.relative_to(root)}\n"]
        for raw_line in text.splitlines(keepends=True):
            stripped = strip_line_comment(raw_line)
            scan_assets(stripped)

            m = INPUT_CMD_RE.search(stripped)
            if m:
                ref = (m.group(2) or m.group(3) or "").strip()
                resolved = resolve_tex_path(root, ref)
                if resolved is None:
                    missing_inputs.add(ref)
                    out_lines.append(raw_line)
                else:
                    included_text = resolved.read_text(encoding="utf-8", errors="replace")
                    out_lines.append(inline_text(resolved, included_text))
                continue

            out_lines.append(raw_line)

        out_lines.append(f"% <<< END FILE: {path.relative_to(root)}\n")
        return "".join(out_lines)

    flat = inline_text(entry_virtual, entry_text)
    return FlattenResult(
        flat_tex=flat,
        missing_inputs=tuple(sorted(missing_inputs)),
        missing_bibs=tuple(sorted(missing_bibs)),
        missing_graphics=tuple(sorted(missing_graphics)),
    )


def default_output_path(input_path: Path) -> Path:
    if input_path.is_dir():
        return input_path / "main.flat.tex"
    if input_path.suffix == ".gz":
        return input_path.with_suffix("").with_suffix(".flat.tex")
    return input_path.with_suffix(".flat.tex")


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Flatten LaTeX by inlining \\input/\\include directives.")
    parser.add_argument("input", type=Path, help=".tex file, .gz containing TeX, or directory containing main.tex")
    parser.add_argument("--out", type=Path, default=None, help="output .flat.tex path (default: next to input)")
    args = parser.parse_args(argv)

    input_path: Path = args.input
    out_path: Path = args.out if args.out is not None else default_output_path(input_path)

    result = flatten_latex(input_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(result.flat_tex, encoding="utf-8")

    print(f"[prepare_latex] wrote: {out_path}")
    if result.missing_inputs:
        print("[prepare_latex] missing inputs/includes:")
        for ref in result.missing_inputs:
            print(f"  - {ref}")
    if result.missing_bibs:
        print("[prepare_latex] missing bibliography files:")
        for ref in result.missing_bibs:
            print(f"  - {ref}")
    if result.missing_graphics:
        print("[prepare_latex] missing graphics files (any of .pdf/.png/.jpg/.eps):")
        for ref in result.missing_graphics:
            print(f"  - {ref}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
