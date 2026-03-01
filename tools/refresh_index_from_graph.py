#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def write_json(path: Path, obj: Any) -> None:
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False, sort_keys=False) + "\n", encoding="utf-8")


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


def build_attention(nodes: list[dict[str, Any]], edges: list[dict[str, Any]]) -> dict[str, Any]:
    in_deg: dict[str, int] = defaultdict(int)
    out_deg: dict[str, int] = defaultdict(int)
    for e in edges:
        src = e.get("source")
        tgt = e.get("target")
        if isinstance(src, str) and isinstance(tgt, str):
            out_deg[src] += 1
            in_deg[tgt] += 1

    ranked = []
    for n in nodes:
        nid = n.get("id")
        if not isinstance(nid, str):
            continue
        ranked.append((in_deg.get(nid, 0) + out_deg.get(nid, 0), nid))
    ranked.sort(reverse=True)

    high_dep = []
    for _score, nid in ranked[:5]:
        if in_deg.get(nid, 0) + out_deg.get(nid, 0) == 0:
            continue
        high_dep.append(
            {
                "node_id": nid,
                "in_degree": int(in_deg.get(nid, 0)),
                "out_degree": int(out_deg.get(nid, 0)),
                "note": f"Auto-detected high degree (in={in_deg.get(nid,0)}, out={out_deg.get(nid,0)}).",
            }
        )

    demanding_ranked = []
    for n in nodes:
        if n.get("kind") in {"definition", "notation", "external_dependency", "assumption"}:
            continue
        nid = n.get("id")
        if not isinstance(nid, str):
            continue
        stmt = str(n.get("statement") or "")
        demanding_ranked.append((len(stmt), nid))
    demanding_ranked.sort(reverse=True)

    demanding = []
    for length, nid in demanding_ranked[:5]:
        if length > 2000:
            diff = "high"
        elif length > 800:
            diff = "medium"
        else:
            diff = "low"
        demanding.append(
            {
                "node_id": nid,
                "reason": f"Auto-ranked by statement length ({length} chars).",
                "estimated_difficulty": diff,
            }
        )

    return {"high_dependency_nodes": high_dep, "demanding_proofs": demanding}


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(
        description="Refresh index.json fields derived from graph.json (stats; optional attention)."
    )
    parser.add_argument("bundle_dir", type=Path, help="Directory containing graph.json and index.json")
    parser.add_argument("--out", type=Path, default=None, help="Write updated index.json to this path")
    parser.add_argument(
        "--update-attention",
        action="store_true",
        help="Also recompute index.attention from graph degree + statement length heuristics",
    )
    args = parser.parse_args(argv)

    try:
        bundle_dir = args.bundle_dir.expanduser().resolve()
        graph_path = bundle_dir / "graph.json"
        index_path = bundle_dir / "index.json"
        if not graph_path.is_file() or not index_path.is_file():
            raise ValueError(f"Expected graph.json and index.json in {bundle_dir}")

        graph = load_json(graph_path)
        index = load_json(index_path)
        if not isinstance(graph, dict) or not isinstance(index, dict):
            raise ValueError("graph.json and index.json must be JSON objects")

        stats = compute_stats_from_graph(graph)
        index["stats"] = stats

        if args.update_attention:
            nodes = graph.get("nodes", [])
            edges = graph.get("edges", [])
            if not isinstance(nodes, list) or not isinstance(edges, list):
                raise ValueError("graph.json must contain 'nodes' and 'edges' arrays")
            index["attention"] = build_attention([n for n in nodes if isinstance(n, dict)], [e for e in edges if isinstance(e, dict)])

        out_path = args.out.expanduser().resolve() if args.out is not None else index_path
        write_json(out_path, index)
        print(f"[refresh_index_from_graph] wrote: {out_path}")
    except ValueError as e:
        print(f"[refresh_index_from_graph] FAIL: {e}")
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))

