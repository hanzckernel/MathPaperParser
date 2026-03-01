import { derived, writable } from "svelte/store";

import { validateBundleOrThrow } from "../lib/schema.js";
import { edgeKey, naturalCompare } from "../lib/graph-utils.js";
import { searchQuery, sectionFilter, selectedEvidence, selectedKinds, viewMode } from "./ui.js";

const INITIAL = {
  status: "idle",
  manifest: null,
  graph: null,
  index: null,
  warnings: [],
  error: null,
};

export const bundle = writable(INITIAL);

export async function loadBundle({ basePath = "./data" } = {}) {
  bundle.set({ ...INITIAL, status: "loading" });

  try {
    const [manifest, graph, index] = await Promise.all([
      fetch(`${basePath}/manifest.json`).then((r) => r.json()),
      fetch(`${basePath}/graph.json`).then((r) => r.json()),
      fetch(`${basePath}/index.json`).then((r) => r.json()),
    ]);

    const warnings = validateBundleOrThrow({ manifest, graph, index });
    bundle.set({ status: "ready", manifest, graph, index, warnings, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    bundle.set({ ...INITIAL, status: "error", error: message });
  }
}

export const graphData = derived(bundle, ($bundle) => {
  const nodes = Array.isArray($bundle.graph?.nodes) ? $bundle.graph.nodes : [];
  const edges = Array.isArray($bundle.graph?.edges) ? $bundle.graph.edges : [];

  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const edgeByKey = new Map(edges.map((e) => [edgeKey(e), e]));

  const outEdgesById = new Map();
  const inEdgesById = new Map();
  const degreesById = new Map(nodes.map((n) => [n.id, { in: 0, out: 0 }]));

  for (const e of edges) {
    const src = e.source;
    const tgt = e.target;

    const out = outEdgesById.get(src) ?? [];
    out.push(e);
    outEdgesById.set(src, out);

    const inn = inEdgesById.get(tgt) ?? [];
    inn.push(e);
    inEdgesById.set(tgt, inn);

    if (degreesById.has(src)) degreesById.get(src).out += 1;
    if (degreesById.has(tgt)) degreesById.get(tgt).in += 1;
  }

  const summaries = Array.isArray($bundle.index?.summaries) ? $bundle.index.summaries : [];
  const summaryBySection = new Map(summaries.map((s) => [s.section, s]));

  const bySection = new Map();
  for (const n of nodes) {
    if (!n?.section || n.section === "0") continue;
    const current = bySection.get(n.section) ?? [];
    current.push(n);
    bySection.set(n.section, current);
  }

  const sections = [];
  for (const [section, members] of bySection.entries()) {
    const summary = summaryBySection.get(section);
    const title =
      summary?.section_title ??
      members.find((m) => typeof m.section_title === "string" && m.section_title.length > 0)?.section_title ??
      "";

    const kindCounts = new Map();
    for (const n of members) {
      kindCounts.set(n.kind, (kindCounts.get(n.kind) ?? 0) + 1);
    }
    let dominantKind = "remark";
    let dominantCount = -1;
    for (const [k, c] of kindCounts.entries()) {
      if (c > dominantCount) {
        dominantKind = k;
        dominantCount = c;
      }
    }

    const sortedNodes = [...members].sort((a, b) => naturalCompare(a.number, b.number));
    sections.push({
      section,
      title,
      summary: summary?.summary ?? "",
      count: members.length,
      dominantKind,
      nodes: sortedNodes,
    });
  }

  sections.sort((a, b) => naturalCompare(a.section, b.section));

  const proofStrategies = Array.isArray($bundle.index?.proof_strategies) ? $bundle.index.proof_strategies : [];
  const proofStrategyByTarget = new Map(proofStrategies.map((ps) => [ps.target_node, ps]));

  const mainResultIds = new Set(nodes.filter((n) => n?.is_main_result).map((n) => n.id));

  return {
    nodes,
    edges,
    nodeById,
    edgeByKey,
    outEdgesById,
    inEdgesById,
    degreesById,
    sections,
    summaryBySection,
    proofStrategyByTarget,
    mainResultIds,
  };
});

export const nodeMap = derived(graphData, ($d) => $d.nodeById);
export const edgeMap = derived(graphData, ($d) => $d.edgeByKey);
export const outEdges = derived(graphData, ($d) => $d.outEdgesById);
export const inEdges = derived(graphData, ($d) => $d.inEdgesById);
export const degrees = derived(graphData, ($d) => $d.degreesById);
export const sections = derived(graphData, ($d) => $d.sections);
export const sectionCount = derived(sections, ($s) => $s.length);
export const proofStrategyMap = derived(graphData, ($d) => $d.proofStrategyByTarget);

export const graphView = derived(
  [graphData, selectedKinds, sectionFilter, selectedEvidence, searchQuery, viewMode],
  ([$d, $kinds, $section, $evidence, $q, $mode]) => {
    const kindSet = new Set($kinds);
    const evidenceSet = new Set($evidence);
    const q = ($q ?? "").trim().toLowerCase();

    // Bird-eye reduces the node universe; other filters are applied after.
    let universeIds = null;
    if ($mode === "bird_eye") {
      const mainIds = new Set($d.mainResultIds);
      const ids = new Set(mainIds);
      for (const e of $d.edges) {
        if (mainIds.has(e.source)) ids.add(e.target);
      }
      universeIds = ids;
    }

    const visibleNodes = [];
    const visibleNodeIds = new Set();

    for (const n of $d.nodes) {
      if (universeIds && !universeIds.has(n.id)) continue;
      if (!kindSet.has(n.kind)) continue;
      if ($section !== "all" && n.section !== $section) continue;
      visibleNodes.push(n);
      visibleNodeIds.add(n.id);
    }

    const preEvidenceEdges = $d.edges.filter((e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target));
    const visibleEdges = preEvidenceEdges
      .filter((e) => evidenceSet.has(e.evidence))
      .map((e) => ({ ...e, key: edgeKey(e) }));

    const hasVisibleEdge = new Set();
    const inDeg = new Map();
    const outDeg = new Map();
    for (const e of visibleEdges) {
      const src = typeof e.source === "string" ? e.source : e.source?.id;
      const tgt = typeof e.target === "string" ? e.target : e.target?.id;
      if (src) outDeg.set(src, (outDeg.get(src) ?? 0) + 1);
      if (tgt) inDeg.set(tgt, (inDeg.get(tgt) ?? 0) + 1);
      if (src) hasVisibleEdge.add(src);
      if (tgt) hasVisibleEdge.add(tgt);
    }

    const viewNodes = visibleNodes.map((n) => {
      const blob = `${n.label ?? ""} ${n.number ?? ""} ${n.statement ?? ""}`.toLowerCase();
      const matches = q.length === 0 ? true : blob.includes(q);
      const opacity = !matches ? 0.15 : hasVisibleEdge.has(n.id) ? 1.0 : 0.3;
      return {
        ...n,
        in_degree: inDeg.get(n.id) ?? 0,
        out_degree: outDeg.get(n.id) ?? 0,
        matches_search: matches,
        opacity,
      };
    });

    return {
      nodes: viewNodes,
      edges: visibleEdges,
      visibleNodeIds,
    };
  }
);
