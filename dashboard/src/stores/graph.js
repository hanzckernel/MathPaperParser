import { derived, writable } from "svelte/store";

import { validateBundleOrThrow } from "../lib/schema.js";

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

export const nodeMap = derived(bundle, ($bundle) => {
  const nodes = $bundle.graph?.nodes;
  if (!Array.isArray(nodes)) return new Map();
  return new Map(nodes.map((n) => [n.id, n]));
});

export const sections = derived(bundle, ($bundle) => {
  const nodes = $bundle.graph?.nodes;
  if (!Array.isArray(nodes)) return [];

  const bySection = new Map();
  for (const n of nodes) {
    if (!n?.section || n.section === "0") continue;
    const current = bySection.get(n.section) ?? [];
    current.push(n);
    bySection.set(n.section, current);
  }

  const summaryBySection = new Map(
    ($bundle.index?.summaries ?? []).map((s) => [s.section, { title: s.section_title, summary: s.summary }])
  );

  const out = [];
  for (const [section, members] of bySection.entries()) {
    const meta = summaryBySection.get(section);
    const title =
      meta?.title ??
      members.find((m) => typeof m.section_title === "string" && m.section_title.length > 0)?.section_title ??
      "";
    out.push({ section, title, count: members.length });
  }

  out.sort((a, b) => a.section.localeCompare(b.section, undefined, { numeric: true, sensitivity: "base" }));
  return out;
});

