#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path


@dataclass(frozen=True)
class BundleFiles:
    manifest: Path
    graph: Path
    index: Path


def choose_file(bundle_dir: Path, preferred: str, fallbacks: list[str]) -> Path:
    candidate = bundle_dir / preferred
    if candidate.is_file():
        return candidate
    for name in fallbacks:
        p = bundle_dir / name
        if p.is_file():
            return p
    raise ValueError(f"Missing {preferred} in {bundle_dir} (also tried: {', '.join(fallbacks)})")


def find_bundle_files(bundle_dir: Path) -> BundleFiles:
    manifest = choose_file(bundle_dir, "manifest.json", ["manifest.example.json"])
    graph = choose_file(bundle_dir, "graph.json", ["graph.example.json"])
    index = choose_file(bundle_dir, "index.json", ["index.example.json"])
    return BundleFiles(manifest=manifest, graph=graph, index=index)


def resolve_bundle_dir(path: Path) -> Path:
    """
    Resolve a bundle directory from a user-provided path.

    Accepts:
    - a directory containing manifest/graph/index json files
    - a run directory containing a nested parser-run/
    - a direct path to one of the json files
    """
    path = path.expanduser().resolve()
    if path.is_file():
        return path.parent
    if not path.is_dir():
        raise ValueError(f"Not a file or directory: {path}")

    # Direct bundle dir?
    try:
        _ = find_bundle_files(path)
        return path
    except ValueError:
        pass

    nested = path / "parser-run"
    try:
        _ = find_bundle_files(nested)
        return nested
    except ValueError:
        pass

    raise ValueError(
        f"Could not locate bundle files in {path}. Expected manifest/graph/index json files, "
        f"or a nested parser-run/ directory."
    )


def utc_stamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def maybe_backup_existing(dest_dir: Path, *, backup: bool) -> Path | None:
    if not backup:
        return None
    if not dest_dir.is_dir():
        return None

    bundle_dir = dest_dir.parent
    backup_dir = bundle_dir / "_backups" / "dashboard" / utc_stamp()
    backup_dir.mkdir(parents=True, exist_ok=True)
    shutil.copytree(dest_dir, backup_dir / "dashboard", dirs_exist_ok=True)
    return backup_dir


def run_validation(repo_root: Path, data_dir: Path) -> None:
    validate_schema = repo_root / "tools" / "validate_bundle_schema.py"
    check_consistency = repo_root / "tools" / "check_bundle_consistency.py"
    if not validate_schema.is_file():
        raise ValueError(f"Missing tool: {validate_schema}")
    if not check_consistency.is_file():
        raise ValueError(f"Missing tool: {check_consistency}")

    env = os.environ.copy()
    env.setdefault("PYTHONPYCACHEPREFIX", "/tmp/pycache")
    env.setdefault("PYTHONDONTWRITEBYTECODE", "1")

    subprocess.run([sys.executable, str(validate_schema), str(data_dir)], cwd=repo_root, check=True, env=env)
    subprocess.run([sys.executable, str(check_consistency), str(data_dir)], cwd=repo_root, check=True, env=env)


def run_dashboard_build(dashboard_dir: Path) -> None:
    package_json = dashboard_dir / "package.json"
    if not package_json.is_file():
        raise ValueError(f"Missing dashboard package.json: {package_json}")
    subprocess.run(["npm", "run", "build"], cwd=dashboard_dir, check=True)


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(
        description="Export a built dashboard (dashboard/dist) into a bundle directory (parser-run/dashboard/), injecting bundle JSON into dashboard/data/."
    )
    parser.add_argument(
        "bundle",
        type=Path,
        help="Path to a bundle dir (or run dir containing parser-run/) with manifest/graph/index JSON files",
    )
    parser.add_argument(
        "--dashboard-dir",
        type=Path,
        default=None,
        help="Dashboard project directory (default: <repo>/dashboard)",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=None,
        help="Output dashboard directory (default: <bundle_dir>/dashboard)",
    )
    parser.add_argument("--build", action="store_true", help="Run `npm run build` in the dashboard project first")
    parser.add_argument("--overwrite", action="store_true", help="Overwrite existing output directory")
    parser.add_argument("--backup", action="store_true", help="Back up existing output directory before overwriting")
    parser.add_argument("--validate", action="store_true", help="Validate injected bundle JSON in output data/ dir")
    parser.add_argument("--dry-run", action="store_true", help="Print planned actions without writing files")
    args = parser.parse_args(argv)

    try:
        repo_root = Path(__file__).resolve().parents[1]
        bundle_dir = resolve_bundle_dir(args.bundle)
        files = find_bundle_files(bundle_dir)

        dashboard_dir = (
            args.dashboard_dir.expanduser().resolve()
            if args.dashboard_dir is not None
            else (repo_root / "dashboard")
        )
        dist_dir = dashboard_dir / "dist"

        out_dir = args.out.expanduser().resolve() if args.out is not None else (bundle_dir / "dashboard")
        data_dir = out_dir / "data"

        print(f"[export_dashboard_bundle] bundle:    {bundle_dir}")
        print(f"[export_dashboard_bundle] dashboard: {dashboard_dir}")
        print(f"[export_dashboard_bundle] dist:      {dist_dir}")
        print(f"[export_dashboard_bundle] out:       {out_dir}")

        if args.build:
            print("[export_dashboard_bundle] build:     npm run build")
            if args.dry_run:
                print("[export_dashboard_bundle] DRY RUN (no build executed).")
            else:
                run_dashboard_build(dashboard_dir)

        if not dist_dir.is_dir():
            raise ValueError(
                f"Missing {dist_dir}. Run `cd dashboard && npm install && npm run build`, or re-run with --build."
            )

        planned = [
            (files.manifest, data_dir / "manifest.json"),
            (files.graph, data_dir / "graph.json"),
            (files.index, data_dir / "index.json"),
        ]

        if out_dir.exists():
            if not args.overwrite:
                raise ValueError(f"Output already exists (pass --overwrite): {out_dir}")
            if args.backup:
                print("[export_dashboard_bundle] backup:    enabled")
            print("[export_dashboard_bundle] overwrite: enabled")

        for src, dst in planned:
            print(f"[export_dashboard_bundle] inject:   {src.name} -> {dst}")

        if args.dry_run:
            print("[export_dashboard_bundle] DRY RUN (no files written).")
            return 0

        if out_dir.exists():
            backup_dir = maybe_backup_existing(out_dir, backup=args.backup)
            if backup_dir is not None:
                print(f"[export_dashboard_bundle] backup:    {backup_dir}")
            shutil.rmtree(out_dir)

        shutil.copytree(dist_dir, out_dir)
        data_dir.mkdir(parents=True, exist_ok=True)
        for src, dst in planned:
            shutil.copy2(src, dst)

        print("[export_dashboard_bundle] OK: dashboard exported + data injected.")

        if args.validate:
            run_validation(repo_root, data_dir)
            print("[export_dashboard_bundle] OK: injected data validated.")

    except (OSError, ValueError, subprocess.CalledProcessError) as e:
        print(f"[export_dashboard_bundle] FAIL: {e}")
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
