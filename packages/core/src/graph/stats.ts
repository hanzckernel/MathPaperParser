import { createEmptyBundleStats, type BundleStats } from '../types/bundle.js';
import type { MathEdge } from '../types/edge.js';
import type { MathNode } from '../types/node.js';

export function computeBundleStats(nodes: Iterable<MathNode>, edges: Iterable<MathEdge>): BundleStats {
  const stats = createEmptyBundleStats();

  for (const node of nodes) {
    stats.nodeCounts[node.kind] += 1;
    stats.nodeCounts.total += 1;
  }

  for (const edge of edges) {
    stats.edgeCounts[edge.kind] += 1;
    stats.edgeCounts.total += 1;
    stats.evidenceBreakdown[edge.evidence] += 1;
  }

  return stats;
}
