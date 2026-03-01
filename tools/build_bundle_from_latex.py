#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


SCHEMA_VERSION = "0.1.0"

NODE_KIND_TO_ABBR: dict[str, str] = {
    "definition": "def",
    "theorem": "thm",
    "lemma": "lem",
    "proposition": "prop",
    "corollary": "cor",
    "assumption": "asm",
    "remark": "rem",
    "example": "ex",
    "conjecture": "conj",
    "notation": "not",
    "external_dependency": "ext",
}

KIND_TITLE: dict[str, str] = {
    "definition": "Definition",
    "theorem": "Theorem",
    "lemma": "Lemma",
    "proposition": "Proposition",
    "corollary": "Corollary",
    "assumption": "Assumption",
    "remark": "Remark",
    "example": "Example",
    "conjecture": "Conjecture",
    "notation": "Notation",
    "external_dependency": "External",
}


NEWTHEOREM_RE = re.compile(
    r"\\newtheorem(?P<star>\*)?\{(?P<env>[^}]+)\}(?:\[[^\]]+\])?\{(?P<title>[^}]+)\}(?:\[[^\]]+\])?"
)
BEGIN_ENV_RE = re.compile(r"\\begin\{(?P<env>[A-Za-z][A-Za-z0-9*]*)\}\s*(?:\[(?P<title>[^\]]+)\])?")
TITLE_RE = re.compile(r"\\title\s*\{(?P<title>[^}]+)\}")
AUTHOR_RE = re.compile(r"\\author\s*\{(?P<author>[^}]+)\}")
ABSTRACT_BEGIN_RE = re.compile(r"\\begin\{abstract\}")
ABSTRACT_END_RE = re.compile(r"\\end\{abstract\}")

SECTION_RE = re.compile(r"\\section\*?\{(?P<title>[^}]*)\}")
APPENDIX_RE = re.compile(r"\\appendix\b")

LABEL_RE = re.compile(r"\\label\{(?P<label>[^}]+)\}")
REF_RE = re.compile(r"\\(eqref|ref)\{(?P<label>[^}]+)\}")
CITE_RE = re.compile(r"\\cite[a-zA-Z*]*\{(?P<keys>[^}]+)\}")


def now_iso_utc() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace")


def write_json(path: Path, obj: Any) -> None:
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False, sort_keys=False) + "\n", encoding="utf-8")


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


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = text.strip("-")
    if not text:
        return "x"
    return text


def first_sentence(text: str) -> str:
    text = " ".join(text.split())
    if not text:
        return ""
    for sep in [". ", "? ", "! "]:
        i = text.find(sep)
        if 0 < i < 240:
            return text[: i + 1].strip()
    return text[:240].strip()


@dataclass(frozen=True)
class EnvSpec:
    kind: str
    printed_title: str
    numbered: bool
    subkind: str | None


def kind_from_printed_title(title: str) -> tuple[str | None, str | None]:
    t = title.strip().lower()
    if "theorem" in t:
        return "theorem", None
    if "lemma" in t:
        return "lemma", None
    if "proposition" in t:
        return "proposition", None
    if "corollary" in t:
        return "corollary", None
    if "definition" in t:
        return "definition", None
    if "conjecture" in t:
        return "conjecture", None
    if "notation" in t:
        return "notation", None
    if "assumption" in t or "hypothesis" in t:
        return "assumption", None
    if "remark" in t or "reminder" in t:
        return "remark", title.strip()
    if "example" in t:
        return "example", None
    if "exercise" in t:
        return "example", "exercise"
    if "question" in t or "open" in t or "problem" in t:
        return "conjecture", title.strip()
    if "algorithm" in t:
        return "remark", "algorithm"
    return None, None


def parse_newtheorem_envs(tex: str) -> dict[str, EnvSpec]:
    envs: dict[str, EnvSpec] = {}
    for m in NEWTHEOREM_RE.finditer(tex):
        env = (m.group("env") or "").strip()
        printed = (m.group("title") or "").strip()
        numbered = m.group("star") is None
        kind, subkind = kind_from_printed_title(printed)
        if not env or kind is None:
            continue
        envs[env] = EnvSpec(kind=kind, printed_title=printed, numbered=numbered, subkind=subkind)

    # Fallbacks for common environment names when no \\newtheorem is present.
    for env, kind in [
        ("theorem", "theorem"),
        ("lemma", "lemma"),
        ("proposition", "proposition"),
        ("corollary", "corollary"),
        ("definition", "definition"),
        ("conjecture", "conjecture"),
        ("remark", "remark"),
        ("example", "example"),
        ("notation", "notation"),
        ("assumption", "assumption"),
        ("algorithm", "remark"),
        ("question", "conjecture"),
        ("open", "conjecture"),
        ("exo", "example"),
    ]:
        envs.setdefault(
            env,
            EnvSpec(kind=kind, printed_title=KIND_TITLE.get(kind, env), numbered=True, subkind=None),
        )

    return envs


def extract_title_and_authors(tex: str) -> tuple[str, list[str]]:
    title = ""
    m = TITLE_RE.search(tex)
    if m:
        title = " ".join(m.group("title").split())

    authors: list[str] = []
    m2 = AUTHOR_RE.search(tex)
    if m2:
        raw = m2.group("author")
        parts = [p.strip() for p in re.split(r"\\\\and", raw) if p.strip()]
        for p in parts:
            cleaned = " ".join(p.replace("\n", " ").split())
            if cleaned:
                authors.append(cleaned)

    if not title:
        title = "Untitled (auto-extracted)"
    if not authors:
        authors = ["Unknown (auto-extracted)"]

    return title, authors


def extract_abstract(tex: str) -> str:
    lines = tex.splitlines()
    in_abs = False
    out: list[str] = []
    for line in lines:
        line_nc = strip_line_comment(line)
        if not in_abs and ABSTRACT_BEGIN_RE.search(line_nc):
            in_abs = True
            continue
        if in_abs and ABSTRACT_END_RE.search(line_nc):
            break
        if in_abs:
            out.append(line_nc)
    abs_text = " ".join(" ".join(out).split())
    return abs_text


def extract_arxiv_id(haystack: str) -> str | None:
    m = re.search(r"([0-9]{4}\.[0-9]{4,5}(v[0-9]+)?)", haystack)
    return m.group(1) if m else None


def year_from_arxiv_id(arxiv_id: str) -> int | None:
    # e.g. 2502.12268v2 -> 2025
    m = re.match(r"^(?P<yy>[0-9]{2})[0-9]{2}\.", arxiv_id)
    if not m:
        return None
    yy = int(m.group("yy"))
    return 2000 + yy


@dataclass
class HeadingState:
    appendix_mode: bool = False
    section_index: int = 0  # numeric sections, or appendix ordinal
    section_label: str = "0"
    section_title: str = ""
    heading_path: str = ""


def update_heading(state: HeadingState, line_nc: str) -> None:
    if APPENDIX_RE.search(line_nc):
        state.appendix_mode = True
        state.section_index = 0
        state.section_label = "A"
        state.section_title = ""
        state.heading_path = ""
        return

    m = SECTION_RE.search(line_nc)
    if not m:
        return

    title = " ".join((m.group("title") or "").split())
    if state.appendix_mode:
        state.section_index += 1
        idx = state.section_index - 1
        if 0 <= idx < 26:
            state.section_label = chr(ord("A") + idx)
        else:
            state.section_label = f"App{state.section_index}"
    else:
        state.section_index += 1
        state.section_label = str(state.section_index)

    state.section_title = title
    state.heading_path = title


def make_node_id(section_label: str, kind: str, slug: str) -> str:
    abbr = NODE_KIND_TO_ABBR[kind]
    return f"sec{section_label}::{abbr}:{slug}"


def unique_node_id(existing: set[str], base_id: str) -> str:
    if base_id not in existing:
        return base_id
    i = 2
    while True:
        candidate = f"{base_id}-{i}"
        if candidate not in existing:
            return candidate
        i += 1


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
        if n.get("proof_status") not in {"full", "sketch", "deferred", "external"}:
            continue
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
    parser = argparse.ArgumentParser(description="Build a PaperParser bundle from LaTeX (heuristic, local-only).")
    parser.add_argument("input", type=Path, help=".tex, .gz containing TeX, or directory containing main.tex")
    parser.add_argument("--out", type=Path, required=True, help="Output directory for manifest/graph/index JSON")
    parser.add_argument("--agent", default="paperparser-tools/build_bundle_from_latex", help="Producer agent string")
    args = parser.parse_args(argv)

    try:
        tools_dir = Path(__file__).resolve().parent
        sys.path.insert(0, str(tools_dir))
        import prepare_latex  # type: ignore

        result = prepare_latex.flatten_latex(args.input)  # type: ignore[attr-defined]
        flat_tex = result.flat_tex

        title, authors = extract_title_and_authors(flat_tex)
        abstract = extract_abstract(flat_tex)

        arxiv_id = extract_arxiv_id(str(args.input))
        if arxiv_id is None:
            arxiv_id = extract_arxiv_id(flat_tex)

        year = year_from_arxiv_id(arxiv_id) if arxiv_id is not None else None
        if year is None:
            year = datetime.now(timezone.utc).year

        env_specs = parse_newtheorem_envs(flat_tex)

        body = flat_tex
        doc_idx = body.find("\\begin{document}")
        if doc_idx != -1:
            body = body[doc_idx:]

        heading = HeadingState()
        section_counters: dict[tuple[str, str], int] = defaultdict(int)

        nodes: list[dict[str, Any]] = []
        node_ids: set[str] = set()
        latex_label_to_id: dict[str, str] = {}

        citations_by_node: dict[str, list[str]] = {}
        refs_by_node: dict[str, list[str]] = {}

        in_env = False
        env_name = ""
        env_title: str | None = None
        capture: list[str] = []
        capture_section = "0"
        capture_section_title = ""
        capture_heading_path = ""
        pending_proof_node_idx: int | None = None

        lines = body.splitlines(keepends=True)
        for raw in lines:
            line_nc = strip_line_comment(raw)

            if not in_env:
                update_heading(heading, line_nc)

                if pending_proof_node_idx is not None:
                    s = line_nc.strip()
                    if s:
                        if s.startswith("\\begin{proof}"):
                            nodes[pending_proof_node_idx]["proof_status"] = "full"
                        elif s.startswith("\\begin{proof}[") and "sketch" in s.lower():
                            nodes[pending_proof_node_idx]["proof_status"] = "sketch"
                        pending_proof_node_idx = None

                m = BEGIN_ENV_RE.search(line_nc)
                if m:
                    candidate_env = m.group("env")
                    if candidate_env in env_specs:
                        in_env = True
                        env_name = candidate_env
                        env_title = m.group("title")
                        capture = [line_nc[m.end() :]]
                        capture_section = heading.section_label
                        capture_section_title = heading.section_title
                        capture_heading_path = heading.heading_path
                        continue

                continue

            # in environment capture
            end_token = f"\\end{{{env_name}}}"
            if end_token in line_nc:
                idx = line_nc.find(end_token)
                capture.append(line_nc[:idx])

                statement_raw = "".join(capture).strip()
                capture = []
                in_env = False

                spec = env_specs[env_name]
                kind = spec.kind
                numbered = spec.numbered

                latex_label: str | None = None
                m_label = LABEL_RE.search(statement_raw)
                if m_label:
                    latex_label = m_label.group("label").strip()

                refs = [m.group("label").strip() for m in REF_RE.finditer(statement_raw)]
                cites: list[str] = []
                for m_cite in CITE_RE.finditer(statement_raw):
                    keys = m_cite.group("keys")
                    for key in [k.strip() for k in keys.split(",") if k.strip()]:
                        cites.append(key)

                statement = LABEL_RE.sub("", statement_raw).strip()
                statement = re.sub(r"\s+\n", "\n", statement)
                statement = re.sub(r"[ \t]+", " ", statement)

                if numbered and capture_section != "0":
                    section_counters[(capture_section, kind)] += 1
                    number = f"{capture_section}.{section_counters[(capture_section, kind)]}"
                else:
                    number = ""

                display_kind = KIND_TITLE.get(kind, kind.capitalize())
                label = f"{display_kind} {number}".strip()
                if env_title:
                    env_title_clean = " ".join(env_title.split())
                    label = f"{label} ({env_title_clean})" if label else env_title_clean

                if latex_label:
                    slug = slugify(latex_label)
                    # Heuristic: if label starts with the kind prefix (e.g. thm-main), shorten.
                    for prefix in ["thm-", "lem-", "prop-", "cor-", "def-", "conj-", "rem-", "not-", "exa-"]:
                        if slug.startswith(prefix) and len(slug) > len(prefix):
                            slug = slug[len(prefix) :]
                            break
                else:
                    slug = slugify(f"{kind}-{capture_section}-{section_counters[(capture_section, kind)] + 1}")

                base_id = make_node_id(capture_section, kind, slug)
                node_id = unique_node_id(node_ids, base_id)
                node_ids.add(node_id)

                proof_status: str
                if kind in {"definition", "assumption", "notation", "external_dependency"}:
                    proof_status = "not_applicable"
                else:
                    proof_status = "deferred"

                novelty = "classical" if kind in {"definition", "notation"} else "new"

                metadata: dict[str, Any] = {
                    "env": env_name,
                    "heading_path": capture_heading_path,
                }
                if spec.subkind:
                    metadata["subkind"] = spec.subkind
                if kind == "remark" and env_name == "algorithm":
                    metadata["subkind"] = "algorithm"

                if refs:
                    metadata["ref_labels"] = sorted(set(refs))
                if cites:
                    metadata["cite_keys"] = sorted(set(cites))

                node = {
                    "id": node_id,
                    "kind": kind,
                    "label": label,
                    "section": capture_section,
                    "section_title": capture_section_title,
                    "number": number,
                    "latex_label": latex_label,
                    "statement": statement if statement else f"(empty {display_kind} statement)",
                    "proof_status": proof_status,
                    "is_main_result": False,
                    "novelty": novelty,
                    "metadata": metadata,
                }

                nodes.append(node)

                if kind not in {"definition", "assumption", "notation", "external_dependency"}:
                    pending_proof_node_idx = len(nodes) - 1
                else:
                    pending_proof_node_idx = None

                if latex_label:
                    latex_label_to_id.setdefault(latex_label, node_id)

                refs_by_node[node_id] = refs
                citations_by_node[node_id] = cites

                env_name = ""
                env_title = None
                continue

            capture.append(line_nc)

        # External dependency nodes from citations
        cite_to_node: dict[str, str] = {}
        for cite_key in sorted({k for keys in citations_by_node.values() for k in keys}):
            slug = slugify(cite_key)
            base_id = make_node_id("0", "external_dependency", slug)
            node_id = unique_node_id(node_ids, base_id)
            node_ids.add(node_id)
            cite_to_node[cite_key] = node_id
            nodes.append(
                {
                    "id": node_id,
                    "kind": "external_dependency",
                    "label": f"External dependency ({cite_key})",
                    "section": "0",
                    "section_title": "External dependencies",
                    "number": "",
                    "latex_label": None,
                    "statement": f"Citation key: {cite_key}",
                    "proof_status": "not_applicable",
                    "is_main_result": False,
                    "novelty": "classical",
                    "metadata": {"cite_key": cite_key},
                }
            )

        # Choose main result
        main_id: str | None = None
        for n in nodes:
            if n.get("kind") == "theorem":
                ll = (n.get("latex_label") or "").lower()
                lab = (n.get("label") or "").lower()
                if "main" in ll or "main" in lab:
                    main_id = str(n["id"])
                    break
        if main_id is None:
            for n in nodes:
                if n.get("kind") == "theorem":
                    main_id = str(n["id"])
                    break
        if main_id is None and nodes:
            main_id = str(nodes[0]["id"])

        if main_id is None:
            # Ensure schema validity (index.main_results requires at least one entry).
            placeholder_id = make_node_id("0", "remark", "no-extracted-theorems")
            placeholder_id = unique_node_id(node_ids, placeholder_id)
            node_ids.add(placeholder_id)
            nodes.append(
                {
                    "id": placeholder_id,
                    "kind": "remark",
                    "label": "Remark (Auto-generated placeholder)",
                    "section": "0",
                    "section_title": "Front matter",
                    "number": "",
                    "latex_label": None,
                    "statement": "No theorem-like environments were extracted from the LaTeX source.",
                    "proof_status": "not_applicable",
                    "is_main_result": True,
                    "novelty": "new",
                    "metadata": {"subkind": "placeholder"},
                }
            )
            main_id = placeholder_id

        if main_id is not None:
            for n in nodes:
                if n.get("id") == main_id:
                    n["is_main_result"] = True
                    break

        # Build edges
        edges: list[dict[str, Any]] = []
        edge_seen: set[tuple[str, str, str, str]] = set()

        for node in nodes:
            src = node.get("id")
            if not isinstance(src, str):
                continue

            for ref_label in refs_by_node.get(src, []):
                tgt = latex_label_to_id.get(ref_label)
                if not tgt:
                    node.get("metadata", {}).setdefault("unresolved_refs", []).append(ref_label)
                    continue
                key = (src, tgt, "uses_in_proof", "explicit_ref")
                if key in edge_seen:
                    continue
                edge_seen.add(key)
                edges.append(
                    {
                        "source": src,
                        "target": tgt,
                        "kind": "uses_in_proof",
                        "evidence": "explicit_ref",
                        "detail": f"Explicit reference via \\\\ref{{{ref_label}}}.",
                        "metadata": {"latex_ref": ref_label},
                    }
                )

            for cite_key in citations_by_node.get(src, []):
                tgt = cite_to_node.get(cite_key)
                if not tgt:
                    continue
                key = (src, tgt, "cites_external", "external")
                if key in edge_seen:
                    continue
                edge_seen.add(key)
                edges.append(
                    {
                        "source": src,
                        "target": tgt,
                        "kind": "cites_external",
                        "evidence": "external",
                        "detail": f"Cites \\\\cite{{{cite_key}}}.",
                        "metadata": {"cite_key": cite_key},
                    }
                )

        graph = {"schema_version": SCHEMA_VERSION, "nodes": nodes, "edges": edges}
        stats = compute_stats_from_graph(graph)
        attention = build_attention(nodes, edges)

        # Summaries (top-level sections only)
        section_kind_counts: dict[str, Counter[str]] = defaultdict(Counter)
        section_titles: dict[str, str] = {}
        for n in nodes:
            sec = str(n.get("section") or "0")
            if sec == "0":
                continue
            section_titles.setdefault(sec, str(n.get("section_title") or ""))
            section_kind_counts[sec][str(n.get("kind") or "")] += 1

        def section_sort_key(section: str) -> tuple[int, str]:
            if section.isdigit():
                return (0, f"{int(section):08d}")
            return (1, section)

        summaries = []
        for sec in sorted(section_kind_counts.keys(), key=section_sort_key):
            title_s = section_titles.get(sec, "")
            counts = section_kind_counts[sec]
            parts = [f"{counts[k]} {k}" for k in sorted(counts.keys()) if counts[k] > 0]
            summary = f"Auto-generated: extracted {sum(counts.values())} items ({', '.join(parts)})."
            summaries.append({"section": sec, "section_title": title_s, "summary": summary})

        if abstract:
            question = first_sentence(abstract) or "What is the main problem addressed by this paper?"
            motivation = (
                abstract[:280].strip()
                if len(abstract) <= 280
                else abstract[:277].rstrip() + "..."
            )
            context = "Auto-generated from LaTeX; prior-work context not assessed."
        else:
            question = "What is the main problem addressed by this paper?"
            motivation = "Auto-generated from LaTeX structure; abstract not found."
            context = "Auto-generated from LaTeX; prior-work context not assessed."

        main_results = []
        proof_strategies = []
        if main_id is not None:
            main_node = next((n for n in nodes if n.get("id") == main_id), None)
            main_label = str((main_node or {}).get("label") or main_id)
            main_stmt = str((main_node or {}).get("statement") or "")
            main_results = [
                {
                    "node_id": main_id,
                    "headline": first_sentence(main_stmt) or f"Main result: {main_label}",
                    "significance": "Auto-generated bundle; significance assessment not performed.",
                }
            ]

            deps = [e["target"] for e in edges if e.get("source") == main_id and isinstance(e.get("target"), str)]
            key_steps = []
            if deps:
                for i, dep in enumerate(deps[:5], start=1):
                    key_steps.append(
                        {
                            "step": i,
                            "description": "Uses an explicitly referenced dependency extracted from LaTeX.",
                            "uses": [dep],
                        }
                    )
            else:
                key_steps = [
                    {"step": 1, "description": "Proof structure not extracted (no explicit refs detected).", "uses": []}
                ]

            proof_strategies = [
                {
                    "target_node": main_id,
                    "strategy_summary": "Auto-generated placeholder strategy; run the agent protocol for a real proof roadmap.",
                    "key_steps": key_steps,
                    "noise_removed": "N/A (auto-generated).",
                }
            ]

        index = {
            "schema_version": SCHEMA_VERSION,
            "problem_statement": {"question": question, "motivation": motivation, "context": context},
            "innovation_assessment": {
                "summary": "Auto-generated from LaTeX structure; innovation assessment not performed.",
                "main_innovations": [],
                "prior_work_comparison": "Auto-generated from LaTeX structure; prior-work comparison not performed.",
            },
            "clusters": [],
            "main_results": main_results,
            "proof_strategies": proof_strategies,
            "summaries": summaries,
            "attention": attention,
            "unknowns": [
                {
                    "id": "unknown:1",
                    "description": "This bundle was auto-generated from LaTeX structure; semantic dependencies and narrative analysis are incomplete.",
                    "search_hint": "Run docs/prompt_protocol.md with a reasoning model to fill in missing dependencies, strategies, and novelty assessment.",
                    "scope": "paper",
                    "related_nodes": [main_id] if main_id is not None else [],
                }
            ],
            "notation_index": [],
            "stats": stats,
        }

        manifest = {
            "schema_version": SCHEMA_VERSION,
            "created_at": now_iso_utc(),
            "paper": {},
            "scope": {"sections_included": ["all"], "analysis_level": "bird_eye"},
            "producer": {
                "agent": args.agent,
                "schema_version": SCHEMA_VERSION,
                "timestamp_start": now_iso_utc(),
                "timestamp_end": now_iso_utc(),
            },
        }
        paper_obj: dict[str, Any] = {
            "title": title,
            "authors": authors,
            "year": year,
            "subject_area": "Mathematics (auto)",
            "source_type": "latex",
            "source_files": [args.input.name],
            "version_note": "Auto-generated from LaTeX (Phase 3 tooling).",
        }
        if arxiv_id is not None:
            paper_obj["arxiv_id"] = arxiv_id
        manifest["paper"] = paper_obj

        out_dir = args.out.expanduser().resolve()
        out_dir.mkdir(parents=True, exist_ok=True)
        write_json(out_dir / "manifest.json", manifest)
        write_json(out_dir / "graph.json", graph)
        write_json(out_dir / "index.json", index)

        print(f"[build_bundle_from_latex] wrote: {out_dir / 'manifest.json'}")
        print(f"[build_bundle_from_latex] wrote: {out_dir / 'graph.json'}")
        print(f"[build_bundle_from_latex] wrote: {out_dir / 'index.json'}")

    except Exception as e:
        print(f"[build_bundle_from_latex] FAIL: {e}")
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
