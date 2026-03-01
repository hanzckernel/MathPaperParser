#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


# In Markdown math, LaTeX commands should be written with a single backslash, e.g. "\pi".
# Some generators mistakenly double-escape and emit "\\pi", which breaks KaTeX/MathJax parsing.
#
# This fixer collapses *double* backslashes that look like LaTeX command starts:
#   \\alpha -> \alpha
#   \\{     -> \{
#   \\|     -> \|
# but leaves line-break commands ("\\ " / "\\\n") alone.
DOUBLE_ESCAPED_LATEX_RE = re.compile(r"\\\\(?=[A-Za-z{}%_#$&|,;:!])")
DOUBLE_ESCAPED_LINEBREAK_RE = re.compile(r"\\\\\\\\(?=[\\s\\[])")


def fix_text(text: str) -> str:
    fixed = DOUBLE_ESCAPED_LATEX_RE.sub(lambda _m: "\\", text)
    return DOUBLE_ESCAPED_LINEBREAK_RE.sub(lambda _m: "\\\\", fixed)


def read_text(path: str) -> str:
    if path == "-":
        return sys.stdin.read()
    return Path(path).read_text(encoding="utf-8")


def write_text(path: str, text: str) -> None:
    if path == "-":
        sys.stdout.write(text)
        return
    Path(path).write_text(text, encoding="utf-8")


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(
        description="Fix double-escaped LaTeX backslashes in Markdown (e.g. \\\\pi -> \\pi)."
    )
    parser.add_argument("input", help="Input Markdown path, or '-' for stdin.")
    parser.add_argument("--out", default="-", help="Output path (default: stdout). Use '-' for stdout.")
    parser.add_argument("--inplace", action="store_true", help="Edit input file in place (requires input != '-').")
    args = parser.parse_args(argv)

    if args.inplace and args.input == "-":
        parser.error("--inplace requires a file input (not stdin).")
    if args.inplace and args.out != "-":
        parser.error("--inplace cannot be used with --out.")

    text = read_text(args.input)
    fixed = fix_text(text)

    if args.inplace:
        write_text(args.input, fixed)
    else:
        write_text(args.out, fixed)

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
