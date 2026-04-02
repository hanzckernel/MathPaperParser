import type { PaperParserBundle } from '../types/bundle.js';
import type { MathEdge } from '../types/edge.js';
import type { PaperParserEnrichment } from '../types/enrichment.js';
import type { MathNode } from '../types/node.js';

const REVIEWABLE_SOURCE_KINDS = new Set<MathNode['kind']>([
  'theorem',
  'lemma',
  'proposition',
  'corollary',
  'definition',
  'conjecture',
  'example',
  'remark',
]);

const EXCLUDED_TARGET_KINDS = new Set<MathNode['kind']>(['section', 'proof', 'external_dependency']);
const STRUCTURAL_EDGE_KINDS = new Set<MathEdge['kind']>(['contains', 'proves']);
const MAX_DEPTH = 3;
const MAX_CANDIDATES_PER_SOURCE = 3;

const HEURISTIC_PROVIDER = {
  agent: 'paperparser-v2/heuristic-reviewer',
  model: 'local-transitive-v1',
  promptVersion: 'chain-review-v1',
} as const;

interface TraversalState {
  node: MathNode;
  pathEdges: MathEdge[];
  pathNodes: MathNode[];
}

function nowIsoUtc(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function edgeKey(source: string, target: string, kind: string): string {
  return `${source}::${target}::${kind}`;
}

function relationKey(source: string, target: string): string {
  return `${source}::${target}`;
}

function compareNodes(left: MathNode, right: MathNode): number {
  return left.id.localeCompare(right.id);
}

function compareEdges(left: MathEdge, right: MathEdge): number {
  return (
    left.source.localeCompare(right.source) ||
    left.target.localeCompare(right.target) ||
    left.kind.localeCompare(right.kind) ||
    left.detail.localeCompare(right.detail)
  );
}

function candidateConfidence(depth: number): number {
  return Number(Math.max(0.42, 0.84 - Math.max(0, depth - 2) * 0.16).toFixed(2));
}

function buildDetail(sourceNode: MathNode, targetNode: MathNode, bridgeNodes: MathNode[]): string {
  const bridgeLabels = bridgeNodes.map((node) => node.label).join(' -> ');
  return `Local heuristic reviewer inferred a transitive dependency from ${sourceNode.label} to ${targetNode.label} via ${bridgeLabels}.`;
}

function buildAdjacency(bundle: PaperParserBundle): {
  adjacency: Map<string, MathEdge[]>;
  directRelationPairs: Set<string>;
} {
  const adjacency = new Map<string, MathEdge[]>();
  const directRelationPairs = new Set<string>();

  for (const edge of bundle.graph.edges.slice().sort(compareEdges)) {
    if (edge.provenance === 'structural' || STRUCTURAL_EDGE_KINDS.has(edge.kind)) {
      continue;
    }

    directRelationPairs.add(relationKey(edge.source, edge.target));
    const current = adjacency.get(edge.source) ?? [];
    current.push(edge);
    adjacency.set(edge.source, current);
  }

  return { adjacency, directRelationPairs };
}

function collectCandidatesForSource(
  sourceNode: MathNode,
  nodesById: Map<string, MathNode>,
  adjacency: Map<string, MathEdge[]>,
  directRelationPairs: Set<string>,
): PaperParserEnrichment['edges'] {
  const queue: TraversalState[] = [{ node: sourceNode, pathEdges: [], pathNodes: [sourceNode] }];
  const shortestDepthByNode = new Map<string, number>([[sourceNode.id, 0]]);
  const candidates: PaperParserEnrichment['edges'] = [];
  const seenCandidateKeys = new Set<string>();

  while (queue.length > 0 && candidates.length < MAX_CANDIDATES_PER_SOURCE) {
    const current = queue.shift();
    if (!current) {
      break;
    }

    if (current.pathEdges.length >= MAX_DEPTH) {
      continue;
    }

    const outgoing = (adjacency.get(current.node.id) ?? []).slice().sort(compareEdges);
    for (const edge of outgoing) {
      const nextNode = nodesById.get(edge.target);
      if (!nextNode) {
        continue;
      }
      if (EXCLUDED_TARGET_KINDS.has(nextNode.kind) || nextNode.id === sourceNode.id) {
        continue;
      }

      const nextDepth = current.pathEdges.length + 1;
      const bestKnownDepth = shortestDepthByNode.get(nextNode.id);
      if (bestKnownDepth !== undefined && bestKnownDepth <= nextDepth) {
        continue;
      }

      shortestDepthByNode.set(nextNode.id, nextDepth);
      const nextPathEdges = [...current.pathEdges, edge];
      const nextPathNodes = [...current.pathNodes, nextNode];
      queue.push({ node: nextNode, pathEdges: nextPathEdges, pathNodes: nextPathNodes });

      if (nextDepth < 2) {
        continue;
      }

      const candidateRelation = relationKey(sourceNode.id, nextNode.id);
      if (directRelationPairs.has(candidateRelation) || seenCandidateKeys.has(candidateRelation)) {
        continue;
      }

      const bridgeNodes = nextPathNodes.slice(1, -1);
      candidates.push({
        source: sourceNode.id,
        target: nextNode.id,
        kind: 'uses_in_proof',
        evidence: 'inferred',
        provenance: 'agent_inferred',
        confidence: candidateConfidence(nextDepth),
        reviewStatus: 'pending',
        detail: buildDetail(sourceNode, nextNode, bridgeNodes),
        metadata: {
          supportPath: nextPathNodes.map((node) => node.id),
          supportKinds: nextPathEdges.map((pathEdge) => pathEdge.kind),
          bridgeNodeIds: bridgeNodes.map((node) => node.id),
          bridgeLabels: bridgeNodes.map((node) => node.label),
          providerAgent: HEURISTIC_PROVIDER.agent,
          providerModel: HEURISTIC_PROVIDER.model,
          promptVersion: HEURISTIC_PROVIDER.promptVersion,
          inference: 'transitive_dependency_chain',
        },
      });
      seenCandidateKeys.add(candidateRelation);

      if (candidates.length >= MAX_CANDIDATES_PER_SOURCE) {
        break;
      }
    }
  }

  return candidates;
}

export function createHeuristicEnrichment(
  bundle: PaperParserBundle,
  options: {
    paperId: string;
    createdAt?: string;
  },
): PaperParserEnrichment {
  const nodes = bundle.graph.nodes.slice().sort(compareNodes);
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const { adjacency, directRelationPairs } = buildAdjacency(bundle);
  const edges: PaperParserEnrichment['edges'] = [];

  for (const node of nodes) {
    if (!REVIEWABLE_SOURCE_KINDS.has(node.kind)) {
      continue;
    }

    edges.push(...collectCandidatesForSource(node, nodesById, adjacency, directRelationPairs));
  }

  edges.sort(
    (left, right) =>
      edgeKey(left.source, left.target, left.kind).localeCompare(edgeKey(right.source, right.target, right.kind)) ||
      left.detail.localeCompare(right.detail),
  );

  return {
    schemaVersion: bundle.manifest.schemaVersion,
    paperId: options.paperId,
    createdAt: options.createdAt ?? nowIsoUtc(),
    baseBundle: {
      schemaVersion: bundle.graph.schemaVersion,
      nodeCount: bundle.graph.nodes.length,
      edgeCount: bundle.graph.edges.length,
    },
    provider: { ...HEURISTIC_PROVIDER },
    edges,
  };
}
