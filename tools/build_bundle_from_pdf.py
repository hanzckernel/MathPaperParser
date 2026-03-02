#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import sys
from bisect import bisect_right
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable


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

PRINTED_KIND_TO_NODE_KIND: dict[str, str] = {
    "definition": "definition",
    "theorem": "theorem",
    "lemma": "lemma",
    "proposition": "proposition",
    "corollary": "corollary",
    "assumption": "assumption",
    "remark": "remark",
    "example": "example",
    "conjecture": "conjecture",
    "notation": "notation",
}

PRINTED_KIND_WORDS = [
    "Theorem",
    "Lemma",
    "Proposition",
    "Corollary",
    "Definition",
    "Assumption",
    "Conjecture",
    "Remark",
    "Example",
    "Notation",
]

NUMBER_TOKEN_RE = r"(?:[0-9]+(?:\.[0-9]+)*|[A-Z](?:\.[0-9]+)*)"

HEADER_WITH_REST_RE = re.compile(
    rf"^(?P<kind>{'|'.join(PRINTED_KIND_WORDS)})\b"
    rf"(?:\s+(?P<number>{NUMBER_TOKEN_RE}))?"
    r"(?:\s*\((?P<name>[^)]+)\))?\s*"
    r"(?P<punct>[.:])\s+"
    r"(?P<rest>.+)$",
    flags=re.IGNORECASE,
)

HEADER_ALONE_RE = re.compile(
    rf"^(?P<kind>{'|'.join(PRINTED_KIND_WORDS)})\b"
    rf"(?:\s+(?P<number>{NUMBER_TOKEN_RE}))?"
    r"(?:\s*\((?P<name>[^)]+)\))?\s*"
    r"(?P<punct>[.:])?\s*$",
    flags=re.IGNORECASE,
)

PROOF_LINE_RE = re.compile(r"^(Sketch of proof|Proof of|Proof)\b", flags=re.IGNORECASE)

REF_IN_TEXT_RE = re.compile(
    rf"\b(?P<kind>{'|'.join(PRINTED_KIND_WORDS)})\s+(?P<number>{NUMBER_TOKEN_RE})\b",
    flags=re.IGNORECASE,
)

ARXIV_RE = re.compile(r"\barXiv:\s*(?P<id>[0-9]{4}\.[0-9]{4,5}(v[0-9]+)?)\b", flags=re.IGNORECASE)
DOI_RE = re.compile(r"\bdoi:\s*(?P<doi>10\.[^\s]+)\b", flags=re.IGNORECASE)


def now_iso_utc() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def write_json(path: Path, obj: Any) -> None:
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False, sort_keys=False) + "\n", encoding="utf-8")


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = text.strip("-")
    return text if text else "x"


def first_sentence(text: str) -> str:
    text = " ".join(text.split())
    if not text:
        return ""
    for sep in [". ", "? ", "! "]:
        i = text.find(sep)
        if 0 < i < 260:
            return text[: i + 1].strip()
    return text[:260].strip()


def normalize_ws(text: str) -> str:
    return " ".join(text.replace("\u00ad", "").split())


def strip_section_prefix(title: str) -> str:
    title = title.strip()
    m = re.match(rf"^(?P<section>{NUMBER_TOKEN_RE}|[A-Z])\s+(.+)$", title)
    if m:
        return m.group(2).strip()
    m2 = re.match(r"^Appendix\s+(?P<section>[A-Z](?:\.[0-9]+)*)\s*[:.]?\s*(?P<title>.+)$", title, flags=re.IGNORECASE)
    if m2:
        return m2.group("title").strip()
    return title


def parse_section_id_and_title(raw_title: str, fallback_section: str) -> tuple[str, str]:
    s = raw_title.strip()
    m = re.match(rf"^(?P<section>{NUMBER_TOKEN_RE}|[A-Z])\s+(?P<title>.+)$", s)
    if m:
        section = m.group("section").strip()
        title = m.group("title").strip()
        return section, title
    m2 = re.match(
        r"^Appendix\s+(?P<section>[A-Z](?:\.[0-9]+)*)\s*[:.]?\s*(?P<title>.+)$",
        s,
        flags=re.IGNORECASE,
    )
    if m2:
        return m2.group("section").strip(), m2.group("title").strip()
    return fallback_section, s


@dataclass(frozen=True)
class SectionMarker:
    start_page: int  # 1-indexed
    section: str
    title: str


def section_for_page(markers: list[SectionMarker], page: int) -> tuple[str, str]:
    if not markers:
        return "0", "Front matter"
    starts = [m.start_page for m in markers]
    idx = bisect_right(starts, page) - 1
    if idx < 0:
        return "0", "Front matter"
    m = markers[idx]
    return m.section, m.title


def make_node_id(section: str, kind: str, slug: str) -> str:
    abbr = NODE_KIND_TO_ABBR.get(kind, "rem")
    return f"sec{section}::{abbr}:{slug}"


def unique_node_id(existing: set[str], base_id: str) -> str:
    if base_id not in existing:
        return base_id
    for i in range(2, 10_000):
        cand = f"{base_id}-{i}"
        if cand not in existing:
            return cand
    raise ValueError(f"Could not create unique node id for {base_id}")


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
        deg = in_deg.get(nid, 0) + out_deg.get(nid, 0)
        if deg == 0:
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


def iter_lines_by_page(pages: list[str]) -> Iterable[tuple[int, str]]:
    for page_num, text in enumerate(pages, start=1):
        for line in text.splitlines():
            yield page_num, line.rstrip("\n")


def extract_title_authors_year(pages: list[str], pdf_name: str) -> tuple[str, list[str], int]:
    year = datetime.now(timezone.utc).year
    if not pages:
        return f"Untitled ({pdf_name})", ["Unknown"], year

    first = pages[0]
    lines = [normalize_ws(l) for l in first.splitlines()]
    lines = [l for l in lines if l]
    title = lines[0] if lines else f"Untitled ({pdf_name})"

    # Very rough author heuristic: look for a short non-empty line after title.
    authors: list[str] = []
    for cand in lines[1:10]:
        if len(cand) > 120:
            continue
        if any(k in cand.lower() for k in ["abstract", "contents", "introduction", "keywords"]):
            continue
        if re.search(r"\b(university|institute|department|email|@)\b", cand, flags=re.IGNORECASE):
            continue
        if len(cand.split()) >= 2:
            authors = [cand]
            break
    if not authors:
        authors = ["Unknown"]

    return title, authors, year


def extract_abstract(pages: list[str]) -> str:
    hay = "\n".join(pages[:3])
    m = re.search(
        r"(?is)\babstract\b\s*(?P<body>.+?)(?:\n\s*\n|\bcontents\b|\b1\s+introduction\b)",
        hay,
    )
    if not m:
        return ""
    body = normalize_ws(m.group("body"))
    return body[:1200].strip()


def extract_section_markers_from_toc(raw_toc: list[list[Any]]) -> list[SectionMarker]:
    top = []
    for row in raw_toc:
        if not (isinstance(row, list) and len(row) >= 3):
            continue
        level, title, page = row[0], row[1], row[2]
        if not (isinstance(level, int) and isinstance(title, str) and isinstance(page, int)):
            continue
        if level != 1:
            continue
        top.append((title, page))

    markers: list[SectionMarker] = []
    seq = 0
    for title, page in top:
        seq += 1
        fallback = str(seq)
        section, stitle = parse_section_id_and_title(title, fallback)
        # Constrain section to schema-friendly token.
        section = re.sub(r"[^0-9A-Za-z.]+", "", section)
        if not section:
            section = fallback
        markers.append(SectionMarker(start_page=max(1, page), section=section, title=strip_section_prefix(stitle)))

    markers.sort(key=lambda m: m.start_page)
    # De-dup by section token, keep earliest.
    seen = set()
    out: list[SectionMarker] = []
    for m in markers:
        if m.section in seen:
            continue
        seen.add(m.section)
        out.append(m)
    return out


def extract_section_markers_fallback(pages: list[str]) -> list[SectionMarker]:
    # Heuristic: scan first ~8 lines of each page for "1 Introduction" etc.
    sec_re = re.compile(rf"^(?P<section>[0-9]+(?:\.[0-9]+)*)\s+(?P<title>[A-Z][A-Za-z0-9 ,:;\-]{{3,80}})\s*$")
    found: dict[str, SectionMarker] = {}
    for page_num, text in enumerate(pages, start=1):
        head_lines = [normalize_ws(l) for l in text.splitlines()[:8]]
        for line in head_lines:
            m = sec_re.match(line)
            if not m:
                continue
            section = m.group("section")
            title = m.group("title").strip()
            if section not in found:
                found[section] = SectionMarker(start_page=page_num, section=section, title=title)
    markers = sorted(found.values(), key=lambda m: m.start_page)
    return markers


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Build a PaperParser bundle from a PDF (heuristic, local-only).")
    parser.add_argument("pdf", type=Path, help="Input PDF path")
    parser.add_argument("--out", type=Path, required=True, help="Output directory for manifest/graph/index JSON")
    parser.add_argument("--agent", default="paperparser-tools/build_bundle_from_pdf", help="Producer agent string")
    parser.add_argument("--max-pages", type=int, default=None, help="Only read the first N pages (debug)")
    parser.add_argument("--max-nodes", type=int, default=400, help="Cap extracted nodes (safety)")
    args = parser.parse_args(argv)

    try:
        pdf_path = args.pdf.expanduser().resolve()
        if not pdf_path.is_file():
            raise ValueError(f"PDF not found: {pdf_path}")

        try:
            import fitz  # type: ignore
        except ImportError as e:
            raise ValueError("Missing dependency: PyMuPDF (import fitz). Install with `pip install pymupdf`.") from e

        t_start = now_iso_utc()
        doc = fitz.open(str(pdf_path))
        page_count = doc.page_count
        limit = min(page_count, args.max_pages) if args.max_pages is not None else page_count

        pages: list[str] = []
        for i in range(limit):
            page = doc.load_page(i)
            pages.append(page.get_text("text"))

        raw_toc = doc.get_toc(simple=True) if hasattr(doc, "get_toc") else []
        markers = extract_section_markers_from_toc(raw_toc if isinstance(raw_toc, list) else [])
        if not markers:
            markers = extract_section_markers_fallback(pages)

        pdf_name = pdf_path.name
        title, authors, year = extract_title_authors_year(pages, pdf_name=pdf_name)
        abstract = extract_abstract(pages)

        nodes: list[dict[str, Any]] = []
        edges: list[dict[str, Any]] = []
        node_ids: set[str] = set()

        # First pass: extract nodes
        i = 0
        lines = list(iter_lines_by_page(pages))

        extracted_meta: list[tuple[str, str, str]] = []  # (node_id, kind, number)
        while i < len(lines):
            page_num, raw_line = lines[i]
            line = normalize_ws(raw_line)
            if not line:
                i += 1
                continue

            m = HEADER_WITH_REST_RE.match(line) or HEADER_ALONE_RE.match(line)
            if not m:
                i += 1
                continue

            printed_kind = str(m.group("kind") or "").strip().lower()
            kind = PRINTED_KIND_TO_NODE_KIND.get(printed_kind)
            if kind is None:
                i += 1
                continue

            number = str(m.group("number") or "").strip()
            name = str(m.group("name") or "").strip()
            rest = str(m.group("rest") or "").strip() if "rest" in m.groupdict() else ""

            section, section_title = section_for_page(markers, page_num)

            display = KIND_TITLE.get(kind, printed_kind.capitalize())
            label = f"{display} {number}".strip()
            if name:
                label = f"{label} ({normalize_ws(name)})" if label else normalize_ws(name)

            statement_lines: list[str] = []
            if rest:
                statement_lines.append(rest)

            saw_proof = False
            proof_kind = ""

            i += 1
            max_chars = 12_000
            while i < len(lines):
                _p2, raw2 = lines[i]
                s2 = normalize_ws(raw2)
                if s2 and (HEADER_WITH_REST_RE.match(s2) or HEADER_ALONE_RE.match(s2)):
                    break
                if s2 and PROOF_LINE_RE.match(s2):
                    saw_proof = True
                    proof_kind = s2
                    break
                statement_lines.append(raw2)
                if sum(len(x) for x in statement_lines) > max_chars:
                    statement_lines.append("(…truncated…)")  # show truncation explicitly
                    break
                i += 1

            statement = normalize_ws("\n".join(statement_lines)).strip()
            if not statement:
                statement = "(empty statement extracted from PDF)"

            if kind in {"definition", "assumption", "notation", "external_dependency"}:
                proof_status = "not_applicable"
            elif saw_proof:
                proof_status = "sketch" if "sketch" in proof_kind.lower() else "full"
            else:
                proof_status = "deferred"

            novelty = "classical" if kind in {"definition", "notation"} else "new"

            if number:
                slug_parts = [NODE_KIND_TO_ABBR.get(kind, "x"), number]
                if name:
                    slug_parts.append(name)
                slug = slugify("-".join(slug_parts))
            else:
                slug = slugify(f"{kind}-p{page_num}-n{len(nodes)+1}")

            base_id = make_node_id(section, kind, slug)
            node_id = unique_node_id(node_ids, base_id)
            node_ids.add(node_id)

            node = {
                "id": node_id,
                "kind": kind,
                "label": label or f"{display} (unnumbered)",
                "section": section,
                "section_title": section_title,
                "number": number,
                "latex_label": None,
                "statement": statement,
                "proof_status": proof_status,
                "is_main_result": False,
                "novelty": novelty,
                "metadata": {
                    "source_type": "pdf",
                    "page": int(page_num),
                    "pdf_file": pdf_name,
                },
            }

            nodes.append(node)
            extracted_meta.append((node_id, kind, number))

            if len(nodes) >= max(1, args.max_nodes):
                break

        # Second pass: external dependencies from arXiv/DOI mentions inside extracted statements
        ext_key_to_id: dict[str, str] = {}

        def get_or_create_ext(kind_key: str, label_text: str, statement_text: str) -> str:
            if kind_key in ext_key_to_id:
                return ext_key_to_id[kind_key]
            slug = slugify(kind_key)
            base = make_node_id("0", "external_dependency", slug)
            nid = unique_node_id(node_ids, base)
            node_ids.add(nid)
            ext_key_to_id[kind_key] = nid
            nodes.append(
                {
                    "id": nid,
                    "kind": "external_dependency",
                    "label": label_text,
                    "section": "0",
                    "section_title": "External dependencies",
                    "number": "",
                    "latex_label": None,
                    "statement": statement_text,
                    "proof_status": "not_applicable",
                    "is_main_result": False,
                    "novelty": "classical",
                    "metadata": {"source_type": "pdf", "key": kind_key},
                }
            )
            return nid

        for n in nodes:
            if n.get("kind") == "external_dependency":
                continue
            stmt = str(n.get("statement") or "")
            src = n.get("id")
            if not isinstance(src, str):
                continue

            for m in ARXIV_RE.finditer(stmt):
                arx = m.group("id")
                key = f"arxiv:{arx}"
                tgt = get_or_create_ext(
                    key,
                    f"External dependency (arXiv:{arx})",
                    f"arXiv identifier referenced in PDF text: {arx}",
                )
                edges.append(
                    {
                        "source": src,
                        "target": tgt,
                        "kind": "cites_external",
                        "evidence": "external",
                        "detail": f"References arXiv:{arx}.",
                        "metadata": {"arxiv_id": arx},
                    }
                )

            for m in DOI_RE.finditer(stmt):
                doi = m.group("doi")
                key = f"doi:{doi}"
                tgt = get_or_create_ext(
                    key,
                    f"External dependency (DOI:{doi})",
                    f"DOI referenced in PDF text: {doi}",
                )
                edges.append(
                    {
                        "source": src,
                        "target": tgt,
                        "kind": "cites_external",
                        "evidence": "external",
                        "detail": f"References DOI:{doi}.",
                        "metadata": {"doi": doi},
                    }
                )

        # Second pass: internal references by kind+number
        kind_num_to_id: dict[tuple[str, str], str] = {}
        for nid, kind, num in extracted_meta:
            if num:
                kind_num_to_id[(kind, num)] = nid

        edge_seen: set[tuple[str, str, str, str]] = set()
        for n in nodes:
            src = n.get("id")
            if not isinstance(src, str):
                continue
            if n.get("kind") == "external_dependency":
                continue
            stmt = str(n.get("statement") or "")
            for m in REF_IN_TEXT_RE.finditer(stmt):
                pk = str(m.group("kind") or "").strip().lower()
                rk = PRINTED_KIND_TO_NODE_KIND.get(pk)
                rn = str(m.group("number") or "").strip()
                if not rk or not rn:
                    continue
                tgt = kind_num_to_id.get((rk, rn))
                if not tgt or tgt == src:
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
                        "detail": f"Explicit PDF reference: {KIND_TITLE.get(rk, rk.capitalize())} {rn}.",
                        "metadata": {"pdf_ref_kind": rk, "pdf_ref_number": rn},
                    }
                )

        # Choose main result
        main_id: str | None = None
        for n in nodes:
            if n.get("kind") == "theorem":
                lab = str(n.get("label") or "").lower()
                if "main" in lab:
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
            placeholder_id = unique_node_id(node_ids, make_node_id("0", "remark", "no-extracted-theorems"))
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
                    "statement": "No theorem-like statements were extracted from the PDF source.",
                    "proof_status": "not_applicable",
                    "is_main_result": True,
                    "novelty": "new",
                    "metadata": {"subkind": "placeholder", "source_type": "pdf", "pdf_file": pdf_name},
                }
            )
            main_id = placeholder_id

        for n in nodes:
            if n.get("id") == main_id:
                n["is_main_result"] = True
                break

        graph = {"schema_version": SCHEMA_VERSION, "nodes": nodes, "edges": edges}
        stats = compute_stats_from_graph(graph)
        attention = build_attention([n for n in nodes if isinstance(n, dict)], [e for e in edges if isinstance(e, dict)])

        main_node = next((n for n in nodes if n.get("id") == main_id), None)
        main_headline = first_sentence(str((main_node or {}).get("statement") or "Main result."))
        main_headline = main_headline or "Main result (auto-identified from PDF)."

        problem_question = "Auto-generated from PDF: identify the central question from the abstract/introduction."
        if abstract:
            problem_question = f"Auto-generated from abstract: {first_sentence(abstract)}" or problem_question

        index = {
            "schema_version": SCHEMA_VERSION,
            "problem_statement": {
                "question": problem_question,
                "motivation": "Auto-generated from PDF; please review the introduction for motivation and applications.",
                "context": "Auto-generated from PDF; related work and precise context may be incomplete without LaTeX cross-references.",
            },
            "innovation_assessment": {
                "summary": "Auto-generated from PDF; novelty assessment is conservative and may be incomplete.",
                "main_innovations": [],
                "prior_work_comparison": "Auto-generated from PDF; compare with cited literature in the bibliography.",
            },
            "clusters": [],
            "main_results": [
                {
                    "node_id": str(main_id),
                    "headline": main_headline,
                    "significance": "Auto-generated from PDF; significance requires human review of the introduction and discussion.",
                }
            ],
            "proof_strategies": [
                {
                    "target_node": str(main_id),
                    "strategy_summary": "Auto-generated from PDF; proof strategy is not reliably extractable without LaTeX structure.",
                    "key_steps": [
                        {
                            "step": 1,
                            "description": "Locate the full proof in the PDF and identify the main lemmas referenced by number.",
                            "uses": [],
                        }
                    ],
                    "noise_removed": "Skip routine reductions and standard estimates on first pass; focus on where new ideas enter.",
                }
            ],
            "summaries": [],
            "attention": attention,
            "unknowns": [
                {
                    "id": "unknown:1",
                    "description": "Bundle was built from PDF text extraction; theorem boundaries and dependencies may be incomplete.",
                    "search_hint": "Cross-check extracted statements against the PDF (page numbers in node.metadata.page).",
                    "scope": "paper",
                    "related_nodes": [],
                }
            ],
            "notation_index": [],
            "stats": stats,
        }

        t_end = now_iso_utc()
        manifest = {
            "schema_version": SCHEMA_VERSION,
            "created_at": t_end,
            "paper": {
                "title": title or f"Untitled ({pdf_name})",
                "authors": authors if authors else ["Unknown"],
                "year": int(year),
                "subject_area": "Mathematics (auto)",
                "source_type": "pdf",
                "source_files": [pdf_name],
                "version_note": "Parsed from PDF; cross-references may be incomplete.",
            },
            "scope": {"sections_included": ["all"], "analysis_level": "both"},
            "producer": {
                "agent": str(args.agent),
                "schema_version": SCHEMA_VERSION,
                "timestamp_start": t_start,
                "timestamp_end": t_end,
            },
        }

        out_dir = args.out.expanduser().resolve()
        out_dir.mkdir(parents=True, exist_ok=True)
        write_json(out_dir / "manifest.json", manifest)
        write_json(out_dir / "graph.json", graph)
        write_json(out_dir / "index.json", index)

        print(f"[build_bundle_from_pdf] wrote: {out_dir / 'manifest.json'}")
        print(f"[build_bundle_from_pdf] wrote: {out_dir / 'graph.json'}")
        print(f"[build_bundle_from_pdf] wrote: {out_dir / 'index.json'}")
    except (OSError, ValueError) as e:
        print(f"[build_bundle_from_pdf] FAIL: {e}")
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))

