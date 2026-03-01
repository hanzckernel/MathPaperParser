#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any, Iterable


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


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
    manifest = choose_file(bundle_dir, "manifest.json", ["manifest.example.json"])
    graph = choose_file(bundle_dir, "graph.json", ["graph.example.json"])
    index = choose_file(bundle_dir, "index.json", ["index.example.json"])
    return manifest, graph, index


MERMAID_ID_RE = re.compile(r"[^0-9A-Za-z_]")


def mermaid_id(node_id: str) -> str:
    return MERMAID_ID_RE.sub("_", node_id)


def mermaid_label(text: str) -> str:
    text = " ".join(text.split())
    text = text.replace('"', "'")
    if len(text) > 140:
        text = text[:137].rstrip() + "..."
    return text


def build_condensed_subgraph(
    edges: list[dict[str, Any]],
    roots: set[str],
    depth: int,
) -> tuple[set[str], list[dict[str, Any]]]:
    out_edges: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for e in edges:
        if isinstance(e, dict):
            src = e.get("source")
            if isinstance(src, str):
                out_edges[src].append(e)

    included_nodes: set[str] = set(roots)
    included_edges: list[dict[str, Any]] = []

    frontier: set[str] = set(roots)
    for _ in range(depth):
        if not frontier:
            break
        next_frontier: set[str] = set()
        for src in sorted(frontier):
            for e in out_edges.get(src, []):
                tgt = e.get("target")
                if not isinstance(tgt, str):
                    continue
                included_edges.append(e)
                included_nodes.add(src)
                included_nodes.add(tgt)
                next_frontier.add(tgt)
        frontier = next_frontier

    # Include edges between included nodes (helps show local structure).
    edge_keys = set()
    for e in included_edges:
        edge_keys.add((e.get("source"), e.get("target"), e.get("kind"), e.get("evidence")))
    for e in edges:
        if not isinstance(e, dict):
            continue
        src = e.get("source")
        tgt = e.get("target")
        if src in included_nodes and tgt in included_nodes:
            key = (src, tgt, e.get("kind"), e.get("evidence"))
            if key not in edge_keys:
                included_edges.append(e)
                edge_keys.add(key)

    return included_nodes, included_edges


def render_mermaid_graph(nodes: dict[str, dict[str, Any]], edges: list[dict[str, Any]]) -> str:
    lines: list[str] = ["```mermaid", "flowchart TD"]

    for node_id in sorted(nodes.keys()):
        n = nodes[node_id]
        label = mermaid_label(str(n.get("label") or node_id))
        mid = mermaid_id(node_id)
        lines.append(f'  {mid}["{label}"]')

    for e in edges:
        src = e.get("source")
        tgt = e.get("target")
        if not (isinstance(src, str) and isinstance(tgt, str)):
            continue
        src_mid = mermaid_id(src)
        tgt_mid = mermaid_id(tgt)
        kind = e.get("kind", "")
        evidence = e.get("evidence", "")
        edge_label = mermaid_label(f"{kind} / {evidence}".strip(" /"))
        lines.append(f"  {src_mid} -->|{edge_label}| {tgt_mid}")

    lines.append("```")
    return "\n".join(lines)


def render_list(items: Iterable[str]) -> str:
    rendered = []
    for s in items:
        rendered.append(f"- {s}")
    return "\n".join(rendered) if rendered else "- (none)"


def default_out_path(bundle_dir: Path) -> Path:
    return bundle_dir.parent / "report.md"


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Render a static Markdown report from a PaperParser bundle.")
    parser.add_argument("bundle_dir", type=Path, help="Directory containing manifest.json/graph.json/index.json")
    parser.add_argument("--out", type=Path, default=None, help="Output report path (default: <bundle_dir>/../report.md)")
    parser.add_argument("--full-graph", action="store_true", help="Render all nodes/edges (may be large).")
    parser.add_argument("--depth", type=int, default=2, help="Dependency depth from main results (default: 2).")
    args = parser.parse_args(argv)

    try:
        bundle_dir = args.bundle_dir.expanduser().resolve()
        manifest_path, graph_path, index_path = find_bundle_files(bundle_dir)
        manifest = load_json(manifest_path)
        graph = load_json(graph_path)
        index = load_json(index_path)

        paper = (manifest.get("paper") or {}) if isinstance(manifest, dict) else {}
        title = str(paper.get("title") or "Untitled paper")
        authors = paper.get("authors") or []
        authors_str = ", ".join(authors) if isinstance(authors, list) else str(authors)
        year = paper.get("year")
        subject = str(paper.get("subject_area") or "")

        nodes_list = graph.get("nodes") if isinstance(graph, dict) else []
        edges_list = graph.get("edges") if isinstance(graph, dict) else []
        if not isinstance(nodes_list, list) or not isinstance(edges_list, list):
            raise ValueError("graph.json must have 'nodes' and 'edges' lists")

        nodes_by_id: dict[str, dict[str, Any]] = {}
        for n in nodes_list:
            if isinstance(n, dict) and isinstance(n.get("id"), str):
                nodes_by_id[n["id"]] = n

        main_results = index.get("main_results") if isinstance(index, dict) else []
        root_ids: set[str] = set()
        if isinstance(main_results, list):
            for mr in main_results:
                if isinstance(mr, dict) and isinstance(mr.get("node_id"), str):
                    root_ids.add(mr["node_id"])

        if args.full_graph or not root_ids:
            included_nodes = set(nodes_by_id.keys())
            included_edges = [e for e in edges_list if isinstance(e, dict)]
        else:
            included_nodes, included_edges = build_condensed_subgraph(
                edges=[e for e in edges_list if isinstance(e, dict)],
                roots=root_ids,
                depth=max(0, args.depth),
            )

        sub_nodes = {nid: nodes_by_id[nid] for nid in included_nodes if nid in nodes_by_id}
        mermaid = render_mermaid_graph(sub_nodes, included_edges)

        ps = index.get("problem_statement") if isinstance(index, dict) else {}
        ps_question = str((ps or {}).get("question") or "")
        ps_motivation = str((ps or {}).get("motivation") or "")
        ps_context = str((ps or {}).get("context") or "")

        attention = index.get("attention") if isinstance(index, dict) else {}
        high_dep = (attention or {}).get("high_dependency_nodes") or []
        demanding = (attention or {}).get("demanding_proofs") or []

        unknowns = index.get("unknowns") if isinstance(index, dict) else []

        def node_label(nid: str) -> str:
            n = nodes_by_id.get(nid) or {}
            return str(n.get("label") or nid)

        high_dep_lines = []
        if isinstance(high_dep, list):
            for item in high_dep[:10]:
                if not isinstance(item, dict):
                    continue
                nid = item.get("node_id")
                if not isinstance(nid, str):
                    continue
                note = str(item.get("note") or "")
                high_dep_lines.append(f"{node_label(nid)} — {note}".strip(" —"))

        demanding_lines = []
        if isinstance(demanding, list):
            for item in demanding[:10]:
                if not isinstance(item, dict):
                    continue
                nid = item.get("node_id")
                if not isinstance(nid, str):
                    continue
                diff = str(item.get("estimated_difficulty") or "")
                reason = str(item.get("reason") or "")
                demanding_lines.append(f"{node_label(nid)} ({diff}) — {reason}".strip(" —"))

        unknown_lines = []
        if isinstance(unknowns, list):
            for u in unknowns[:20]:
                if not isinstance(u, dict):
                    continue
                desc = str(u.get("description") or "")
                hint = str(u.get("search_hint") or "")
                if desc:
                    unknown_lines.append(f"{desc} (hint: {hint})".strip())

        out_path = (args.out.expanduser().resolve() if args.out is not None else default_out_path(bundle_dir))
        out_path.parent.mkdir(parents=True, exist_ok=True)

        md = f"""# PaperParser — Report

## Summary card
- **Title:** {title}
- **Authors:** {authors_str}
- **Year:** {year}
- **Subject:** {subject}

## Problem statement
- **Question:** {ps_question}
- **Motivation:** {ps_motivation}
- **Context:** {ps_context}

## Dependency graph (condensed)
{mermaid}

## Main results
"""

        if isinstance(main_results, list) and main_results:
            for mr in main_results:
                if not isinstance(mr, dict):
                    continue
                nid = mr.get("node_id")
                if not isinstance(nid, str):
                    continue
                headline = str(mr.get("headline") or "")
                sig = str(mr.get("significance") or "")
                md += f"- **{node_label(nid)}** — {headline}\n  - {sig}\n"
        else:
            md += "- (none)\n"

        md += "\n## Attention\n"
        md += "\n### High-dependency nodes\n"
        md += render_list(high_dep_lines) + "\n"
        md += "\n### Demanding proofs\n"
        md += render_list(demanding_lines) + "\n"

        md += "\n## Unknowns\n"
        md += render_list(unknown_lines) + "\n"

        out_path.write_text(md, encoding="utf-8")
        print(f"[render_report] wrote: {out_path}")
    except ValueError as e:
        print(f"[render_report] FAIL: {e}")
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))

