#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter
from pathlib import Path
from typing import Any


NODE_ID_RE = re.compile(
    r"^sec[0-9A-Za-z]+(\.[0-9A-Za-z]+)*::(def|thm|lem|prop|cor|asm|rem|ex|conj|not|ext):"
    r"[a-z0-9]([a-z0-9-]*[a-z0-9])?$"
)


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def compute_stats_from_graph(graph: dict[str, Any]) -> dict[str, Any]:
    nodes = graph.get("nodes", [])
    edges = graph.get("edges", [])

    node_counts = Counter(n.get("kind") for n in nodes if isinstance(n, dict))
    edge_counts = Counter(e.get("kind") for e in edges if isinstance(e, dict))
    evidence_counts = Counter(e.get("evidence") for e in edges if isinstance(e, dict))

    node_keys = [
        "definition",
        "theorem",
        "lemma",
        "proposition",
        "corollary",
        "assumption",
        "remark",
        "example",
        "conjecture",
        "notation",
        "external_dependency",
    ]
    edge_keys = ["uses_in_proof", "extends", "generalizes", "specializes", "equivalent_to", "cites_external"]
    evidence_keys = ["explicit_ref", "inferred", "external"]

    node_obj = {k: int(node_counts.get(k, 0)) for k in node_keys}
    node_obj["total"] = int(sum(node_obj.values()))

    edge_obj = {k: int(edge_counts.get(k, 0)) for k in edge_keys}
    edge_obj["total"] = int(sum(edge_obj.values()))

    evidence_obj = {k: int(evidence_counts.get(k, 0)) for k in evidence_keys}

    return {"node_counts": node_obj, "edge_counts": edge_obj, "evidence_breakdown": evidence_obj}


def collect_index_node_refs(index: dict[str, Any]) -> list[str]:
    refs: list[str] = []

    for c in index.get("clusters", []) or []:
        if isinstance(c, dict):
            refs.extend(c.get("members", []) or [])

    for mr in index.get("main_results", []) or []:
        if isinstance(mr, dict):
            node_id = mr.get("node_id")
            if isinstance(node_id, str):
                refs.append(node_id)

    for ps in index.get("proof_strategies", []) or []:
        if not isinstance(ps, dict):
            continue
        target = ps.get("target_node")
        if isinstance(target, str):
            refs.append(target)
        for step in ps.get("key_steps", []) or []:
            if isinstance(step, dict):
                refs.extend(step.get("uses", []) or [])

    att = index.get("attention") or {}
    if isinstance(att, dict):
        for item in att.get("high_dependency_nodes", []) or []:
            if isinstance(item, dict):
                refs.append(item.get("node_id", ""))
        for item in att.get("demanding_proofs", []) or []:
            if isinstance(item, dict):
                refs.append(item.get("node_id", ""))

    for u in index.get("unknowns", []) or []:
        if isinstance(u, dict):
            refs.extend(u.get("related_nodes", []) or [])

    for n in index.get("notation_index", []) or []:
        if isinstance(n, dict):
            refs.append(n.get("introduced_in", ""))

    innov = index.get("innovation_assessment") or {}
    if isinstance(innov, dict):
        for item in innov.get("main_innovations", []) or []:
            if isinstance(item, dict):
                refs.extend(item.get("related_nodes", []) or [])

    return [r for r in refs if isinstance(r, str) and r]


def check_bundle(manifest_path: Path, graph_path: Path, index_path: Path) -> None:
    manifest = load_json(manifest_path)
    graph = load_json(graph_path)
    index = load_json(index_path)

    # --- schema_version consistency
    sv_m = manifest.get("schema_version")
    sv_g = graph.get("schema_version")
    sv_i = index.get("schema_version")
    if not (isinstance(sv_m, str) and isinstance(sv_g, str) and isinstance(sv_i, str)):
        raise ValueError("schema_version missing or not a string in one of manifest/graph/index")
    if not (sv_m == sv_g == sv_i):
        raise ValueError(f"schema_version mismatch: manifest={sv_m} graph={sv_g} index={sv_i}")

    # --- graph node IDs
    nodes = graph.get("nodes")
    if not isinstance(nodes, list):
        raise ValueError("graph.nodes must be a list")

    node_ids: list[str] = []
    for n in nodes:
        if not isinstance(n, dict):
            raise ValueError("graph.nodes must contain objects")
        node_id = n.get("id")
        if not isinstance(node_id, str) or not node_id:
            raise ValueError("graph.nodes[].id must be a non-empty string")
        if not NODE_ID_RE.match(node_id):
            raise ValueError(f"graph.nodes[].id does not match canonical pattern: {node_id}")
        node_ids.append(node_id)

    if len(set(node_ids)) != len(node_ids):
        raise ValueError("graph.nodes[].id must be unique")

    node_id_set = set(node_ids)

    # --- graph edges refer to existing nodes
    edges = graph.get("edges")
    if not isinstance(edges, list):
        raise ValueError("graph.edges must be a list")
    for e in edges:
        if not isinstance(e, dict):
            raise ValueError("graph.edges must contain objects")
        src = e.get("source")
        tgt = e.get("target")
        if src not in node_id_set:
            raise ValueError(f"graph.edges[].source not in node IDs: {src}")
        if tgt not in node_id_set:
            raise ValueError(f"graph.edges[].target not in node IDs: {tgt}")

    # --- index references refer to existing nodes
    if not isinstance(index, dict):
        raise ValueError("index must be an object")
    refs = collect_index_node_refs(index)
    missing_refs = sorted({r for r in refs if r not in node_id_set})
    if missing_refs:
        raise ValueError(f"index contains references to unknown node IDs: {missing_refs}")

    # --- main_results must point to is_main_result nodes
    is_main = {n.get("id"): bool(n.get("is_main_result")) for n in nodes}
    bad_main: list[str] = []
    for mr in index.get("main_results", []) or []:
        if not isinstance(mr, dict):
            continue
        node_id = mr.get("node_id")
        if isinstance(node_id, str) and not is_main.get(node_id, False):
            bad_main.append(node_id)
    if bad_main:
        raise ValueError(f"index.main_results references nodes not marked is_main_result: {bad_main}")

    # --- stats must match computed stats from graph
    computed = compute_stats_from_graph(graph)
    stats = index.get("stats")
    if not isinstance(stats, dict):
        raise ValueError("index.stats must be an object")

    if stats.get("node_counts") != computed["node_counts"]:
        raise ValueError(
            "index.stats.node_counts mismatch\n"
            f"computed={computed['node_counts']}\n"
            f"found={stats.get('node_counts')}"
        )
    if stats.get("edge_counts") != computed["edge_counts"]:
        raise ValueError(
            "index.stats.edge_counts mismatch\n"
            f"computed={computed['edge_counts']}\n"
            f"found={stats.get('edge_counts')}"
        )
    if stats.get("evidence_breakdown") != computed["evidence_breakdown"]:
        raise ValueError(
            "index.stats.evidence_breakdown mismatch\n"
            f"computed={computed['evidence_breakdown']}\n"
            f"found={stats.get('evidence_breakdown')}"
        )

    # evidence sums to total edges
    ev = computed["evidence_breakdown"]
    if sum(ev.values()) != computed["edge_counts"]["total"]:
        raise ValueError("evidence_breakdown does not sum to edge_counts.total")


def find_bundle_files(bundle_dir: Path) -> tuple[Path, Path, Path]:
    manifest = bundle_dir / "manifest.json"
    graph = bundle_dir / "graph.json"
    index = bundle_dir / "index.json"
    missing = [p.name for p in [manifest, graph, index] if not p.is_file()]
    if missing:
        raise ValueError(f"Missing required files in {bundle_dir}: {', '.join(missing)}")
    return manifest, graph, index


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Check PaperParser bundle consistency (cross-refs + stats).")
    parser.add_argument("bundle", nargs="?", default=None, help="Directory containing manifest.json/graph.json/index.json")
    parser.add_argument("--manifest", type=Path, default=None)
    parser.add_argument("--graph", type=Path, default=None)
    parser.add_argument("--index", type=Path, default=None)
    args = parser.parse_args(argv)

    try:
        if args.bundle is not None:
            manifest_path, graph_path, index_path = find_bundle_files(Path(args.bundle).expanduser().resolve())
        else:
            if args.manifest is None or args.graph is None or args.index is None:
                parser.error("Provide either <bundle_dir> or all of --manifest/--graph/--index")
            manifest_path = args.manifest.expanduser().resolve()
            graph_path = args.graph.expanduser().resolve()
            index_path = args.index.expanduser().resolve()

        check_bundle(manifest_path, graph_path, index_path)
    except ValueError as e:
        print(f"[check_bundle_consistency] FAIL: {e}")
        return 1

    print("[check_bundle_consistency] OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))

