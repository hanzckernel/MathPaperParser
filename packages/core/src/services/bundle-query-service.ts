import { MathKnowledgeGraph } from '../graph/knowledge-graph.js';
import { runKeywordSearch } from '../search/keyword-search.js';
import type { PaperParserBundle } from '../types/bundle.js';
import type { MathEdge } from '../types/edge.js';
import type { MathNode, NodeId } from '../types/node.js';
import type { ImpactAnalysis, NodeContext, SearchQuery, SearchResult } from '../types/search.js';

function asNodeId(value: string): NodeId {
  return value as NodeId;
}

function dedupeNodes(nodes: MathNode[]): MathNode[] {
  const seen = new Set<NodeId>();
  const unique: MathNode[] = [];

  for (const node of nodes) {
    if (seen.has(node.id)) {
      continue;
    }
    seen.add(node.id);
    unique.push(node);
  }

  return unique;
}

export class BundleQueryService {
  private readonly graph = new MathKnowledgeGraph();

  constructor(private readonly bundle: PaperParserBundle) {
    for (const node of bundle.graph.nodes) {
      this.graph.addNode(node);
    }
    for (const edge of bundle.graph.edges) {
      this.graph.addEdge(edge);
    }
  }

  search(query: SearchQuery): SearchResult[] {
    return runKeywordSearch(this.graph.iterNodes(), {
      mode: 'keyword',
      ...query,
    });
  }

  getContext(nodeId: string): NodeContext {
    const node = this.requireNode(nodeId);
    const sectionSummary = this.bundle.index.summaries.find((summary) => summary.section === node.section);
    const proofStrategy = this.bundle.index.proofStrategies.find((strategy) => strategy.targetNode === node.id);

    return {
      node,
      incomingEdges: this.graph.getEdges(node.id, 'in'),
      outgoingEdges: this.graph.getEdges(node.id, 'out'),
      dependencyChain: this.graph.getDependencyChain(node.id),
      proofFlow: this.graph.getProofFlow(node.id),
      clusterIds: this.bundle.index.clusters.filter((cluster) => cluster.members.includes(node.id)).map((cluster) => cluster.id),
      ...(sectionSummary ? { sectionSummary } : {}),
      ...(proofStrategy ? { proofStrategy } : {}),
    };
  }

  getImpact(nodeId: string): ImpactAnalysis {
    const node = this.requireNode(nodeId);
    const incomingEdges = this.graph.getDependencyEdges(node.id, 'in');
    const dependentNodes = this.collectDependents(node.id);
    const dependentNodeIds = new Set(dependentNodes.map((dependent) => dependent.id));

    return {
      node,
      incomingEdges,
      dependentNodes,
      impactedMainResults: this.bundle.index.mainResults.filter((result) => dependentNodeIds.has(result.nodeId)),
    };
  }

  private requireNode(nodeId: string): MathNode {
    const node = this.graph.getNode(nodeId);
    if (!node) {
      throw new Error(`Unknown node id: ${nodeId}`);
    }

    return node;
  }

  private collectDependents(nodeId: NodeId): MathNode[] {
    const queue: NodeId[] = [nodeId];
    const visited = new Set<NodeId>([nodeId]);
    const dependents: MathNode[] = [];

    while (queue.length > 0) {
      const currentNodeId = queue.shift();
      if (!currentNodeId) {
        continue;
      }

      for (const edge of this.graph.getDependencyEdges(currentNodeId, 'in')) {
        const dependentId = asNodeId(edge.source);
        if (visited.has(dependentId)) {
          continue;
        }

        visited.add(dependentId);
        const dependent = this.graph.getNode(dependentId);
        if (!dependent) {
          continue;
        }

        dependents.push(dependent);
        queue.push(dependentId);
      }
    }

    return dedupeNodes(dependents);
  }
}
