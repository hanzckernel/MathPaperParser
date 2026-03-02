#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path


def run(cmd: list[str], *, cwd: Path) -> None:
    env = os.environ.copy()
    env.setdefault("PYTHONPYCACHEPREFIX", "/tmp/pycache")
    env.setdefault("PYTHONDONTWRITEBYTECODE", "1")
    subprocess.run(cmd, cwd=cwd, check=True, env=env)


def validate_examples(repo_root: Path) -> None:
    run([sys.executable, "tools/validate_bundle_schema.py", "schema/examples"], cwd=repo_root)
    run(
        [
            sys.executable,
            "tools/check_bundle_consistency.py",
            "--manifest",
            "schema/examples/manifest.example.json",
            "--graph",
            "schema/examples/graph.example.json",
            "--index",
            "schema/examples/index.example.json",
        ],
        cwd=repo_root,
    )


def validate_dir(repo_root: Path, bundle_dir: Path) -> None:
    run([sys.executable, "tools/validate_bundle_schema.py", str(bundle_dir)], cwd=repo_root)
    run([sys.executable, "tools/check_bundle_consistency.py", str(bundle_dir)], cwd=repo_root)


def validate_runs(repo_root: Path, runs_dir: Path) -> int:
    if not runs_dir.is_dir():
        return 0

    validated = 0
    for run_dir in sorted([p for p in runs_dir.iterdir() if p.is_dir()]):
        bundle = run_dir / "parser-run"
        if not bundle.is_dir():
            continue
        if not (bundle / "manifest.json").is_file():
            continue
        try:
            validate_dir(repo_root, bundle)
        except subprocess.CalledProcessError:
            raise
        validated += 1

    return validated


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Phase 4 smoke checks (schemas + dashboard data + local runs).")
    parser.add_argument(
        "--runs-dir",
        type=Path,
        default=Path("ref/runs"),
        help="Directory containing local run folders (default: ref/runs).",
    )
    parser.add_argument(
        "--require-runs",
        action="store_true",
        help="Fail if no runs are found under runs-dir (only relevant if runs-dir exists).",
    )
    args = parser.parse_args(argv)

    repo_root = Path(__file__).resolve().parents[1]

    try:
        validate_examples(repo_root)
        validate_dir(repo_root, repo_root / "dashboard" / "public" / "data")

        validated = validate_runs(repo_root, (repo_root / args.runs_dir).resolve())
        if args.require_runs and (repo_root / args.runs_dir).is_dir() and validated == 0:
            print("[phase4_smoke] FAIL: no runs found under runs-dir")
            return 1
    except subprocess.CalledProcessError as e:
        print(f"[phase4_smoke] FAIL: {e}")
        return 1

    print("[phase4_smoke] OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))

