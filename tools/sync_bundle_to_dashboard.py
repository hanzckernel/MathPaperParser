#!/usr/bin/env python3
from __future__ import annotations

import argparse
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


def find_bundle_files(bundle_dir: Path) -> BundleFiles:
    """
    Locate manifest/graph/index files inside a directory.

    Supports both real bundles (manifest.json) and schema examples (manifest.example.json).
    """
    manifest = choose_file(bundle_dir, "manifest.json", ["manifest.example.json"])
    graph = choose_file(bundle_dir, "graph.json", ["graph.example.json"])
    index = choose_file(bundle_dir, "index.json", ["index.example.json"])
    return BundleFiles(manifest=manifest, graph=graph, index=index)


def utc_stamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def maybe_backup_existing(dest_dir: Path, *, backup: bool) -> Path | None:
    if not backup:
        return None
    existing = [dest_dir / "manifest.json", dest_dir / "graph.json", dest_dir / "index.json"]
    if not any(p.is_file() for p in existing):
        return None
    backup_dir = dest_dir / "_backups" / utc_stamp()
    backup_dir.mkdir(parents=True, exist_ok=True)
    for p in existing:
        if p.is_file():
            shutil.copy2(p, backup_dir / p.name)
    return backup_dir


def run_validation(repo_root: Path, dest_dir: Path) -> None:
    validate_schema = repo_root / "tools" / "validate_bundle_schema.py"
    check_consistency = repo_root / "tools" / "check_bundle_consistency.py"
    if not validate_schema.is_file():
        raise ValueError(f"Missing tool: {validate_schema}")
    if not check_consistency.is_file():
        raise ValueError(f"Missing tool: {check_consistency}")

    subprocess.run([sys.executable, str(validate_schema), str(dest_dir)], cwd=repo_root, check=True)
    subprocess.run([sys.executable, str(check_consistency), str(dest_dir)], cwd=repo_root, check=True)


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(
        description="Copy a PaperParser bundle (manifest/graph/index JSON) into the dashboard data directory."
    )
    parser.add_argument(
        "bundle",
        type=Path,
        help="Path to a bundle dir (or run dir containing parser-run/) with manifest/graph/index JSON files",
    )
    parser.add_argument(
        "--dashboard-data",
        type=Path,
        default=None,
        help="Destination data directory (default: <repo>/dashboard/public/data)",
    )
    parser.add_argument(
        "--backup",
        action="store_true",
        help="Back up existing dashboard data files before overwriting (into dashboard/public/data/_backups/<timestamp>/)",
    )
    parser.add_argument("--validate", action="store_true", help="Validate copied bundle using repo tools")
    parser.add_argument("--dry-run", action="store_true", help="Print planned actions without writing files")
    args = parser.parse_args(argv)

    try:
        repo_root = Path(__file__).resolve().parents[1]
        bundle_dir = resolve_bundle_dir(args.bundle)
        files = find_bundle_files(bundle_dir)

        dest_dir = (
            args.dashboard_data.expanduser().resolve()
            if args.dashboard_data is not None
            else (repo_root / "dashboard" / "public" / "data")
        )

        planned = [
            (files.manifest, dest_dir / "manifest.json"),
            (files.graph, dest_dir / "graph.json"),
            (files.index, dest_dir / "index.json"),
        ]

        print(f"[sync_bundle_to_dashboard] source: {bundle_dir}")
        print(f"[sync_bundle_to_dashboard] dest:   {dest_dir}")
        for src, dst in planned:
            print(f"[sync_bundle_to_dashboard] copy:   {src.name} -> {dst}")

        if args.dry_run:
            print("[sync_bundle_to_dashboard] DRY RUN (no files written).")
            return 0

        dest_dir.mkdir(parents=True, exist_ok=True)
        backup_dir = maybe_backup_existing(dest_dir, backup=args.backup)
        if backup_dir is not None:
            print(f"[sync_bundle_to_dashboard] backup: {backup_dir}")

        for src, dst in planned:
            shutil.copy2(src, dst)

        print("[sync_bundle_to_dashboard] OK: bundle copied.")

        if args.validate:
            run_validation(repo_root, dest_dir)
            print("[sync_bundle_to_dashboard] OK: bundle validated.")
    except (OSError, ValueError, subprocess.CalledProcessError) as e:
        print(f"[sync_bundle_to_dashboard] FAIL: {e}")
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))

