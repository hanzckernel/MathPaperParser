#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def load_schema(schema_path: Path) -> dict[str, Any]:
    schema = load_json(schema_path)
    if not isinstance(schema, dict):
        raise ValueError(f"Schema must be an object: {schema_path}")
    return schema


def choose_file(bundle_dir: Path, preferred: str, fallbacks: list[str]) -> Path:
    candidate = bundle_dir / preferred
    if candidate.is_file():
        return candidate
    for name in fallbacks:
        p = bundle_dir / name
        if p.is_file():
            return p
    raise ValueError(f"Missing {preferred} in {bundle_dir} (also tried: {', '.join(fallbacks)})")


def find_bundle_files(bundle_dir: Path) -> tuple[Path, Path, Path]:
    """
    Locate manifest/graph/index files inside a directory.

    Supports both real bundles (manifest.json) and schema examples (manifest.example.json).
    """
    manifest = choose_file(bundle_dir, "manifest.json", ["manifest.example.json"])
    graph = choose_file(bundle_dir, "graph.json", ["graph.example.json"])
    index = choose_file(bundle_dir, "index.json", ["index.example.json"])
    return manifest, graph, index


def iter_errors(validator: Draft202012Validator, instance: Any) -> list[str]:
    errors = sorted(validator.iter_errors(instance), key=lambda e: (list(e.path), e.message))
    rendered: list[str] = []
    for e in errors:
        loc = "$"
        for part in e.path:
            if isinstance(part, int):
                loc += f"[{part}]"
            else:
                loc += f".{part}"
        rendered.append(f"{loc}: {e.message}")
    return rendered


def validate_one(instance_path: Path, schema_path: Path) -> None:
    instance = load_json(instance_path)
    schema = load_schema(schema_path)
    validator = Draft202012Validator(schema)
    rendered = iter_errors(validator, instance)
    if rendered:
        preview = "\n".join(f"  - {msg}" for msg in rendered[:50])
        more = "" if len(rendered) <= 50 else f"\n  ... and {len(rendered) - 50} more"
        raise ValueError(f"{instance_path.name} does not validate against {schema_path.name}:\n{preview}{more}")


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Validate a PaperParser bundle against JSON Schemas.")
    parser.add_argument("bundle", nargs="?", default=None, help="Directory containing manifest/graph/index JSON files")
    parser.add_argument("--manifest", type=Path, default=None)
    parser.add_argument("--graph", type=Path, default=None)
    parser.add_argument("--index", type=Path, default=None)
    parser.add_argument(
        "--schema-dir",
        type=Path,
        default=None,
        help="Schema directory (default: <repo>/schema).",
    )
    args = parser.parse_args(argv)

    try:
        schema_dir = (
            args.schema_dir.expanduser().resolve()
            if args.schema_dir is not None
            else (Path(__file__).resolve().parents[1] / "schema")
        )
        manifest_schema = schema_dir / "manifest.schema.json"
        graph_schema = schema_dir / "graph.schema.json"
        index_schema = schema_dir / "index.schema.json"
        missing_schema = [p.name for p in [manifest_schema, graph_schema, index_schema] if not p.is_file()]
        if missing_schema:
            raise ValueError(f"Missing schema files in {schema_dir}: {', '.join(missing_schema)}")

        if args.bundle is not None:
            bundle_dir = Path(args.bundle).expanduser().resolve()
            manifest_path, graph_path, index_path = find_bundle_files(bundle_dir)
        else:
            if args.manifest is None or args.graph is None or args.index is None:
                parser.error("Provide either <bundle_dir> or all of --manifest/--graph/--index")
            manifest_path = args.manifest.expanduser().resolve()
            graph_path = args.graph.expanduser().resolve()
            index_path = args.index.expanduser().resolve()

        validate_one(manifest_path, manifest_schema)
        validate_one(graph_path, graph_schema)
        validate_one(index_path, index_schema)
    except ValueError as e:
        print(f"[validate_bundle_schema] FAIL: {e}")
        return 1

    print("[validate_bundle_schema] OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))

