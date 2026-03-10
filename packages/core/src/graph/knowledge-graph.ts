import { computeBundleStats } from './stats.js';
import type { BundleStats } from '../types/bundle.js';
import type { MathEdge } from '../types/edge.js';
import type { IMathKnowledgeGraph } from '../types/graph.js';
import type { MathNode, MathNodeKind, NodeId } from '../types/node.js';

function addToIndex(index: Map<string, Set<NodeId>>, key: string, nodeId: NodeId): void {
  const nodeIds = index.get(key) ?? new Set<NodeId>();
  nodeIds.add(nodeId);
  index.set(key, nodeIds);
}

function removeFromIndex(index: Map<string, Set<NodeId>>, key: string, nodeId: NodeId): void {
  const nodeIds = index.get(key);
  if (!nodeIds) {
    return;
  }

  nodeIds.delete(nodeId);
  if (nodeIds.size === 0) {
    index.delete(key);
  }
}

export class MathKnowledgeGraph implements IMathKnowledgeGraph {
  private readonly nodes = new Map<NodeId, MathNode>();
  private readonly outgoing = new Map<NodeId, MathEdge[]>();
  private readonly incoming = new Map<NodeId, MathEdge[]>();
  private readonly kindIndex = new Map<string, Set<NodeId>>();
  private readonly sectionIndex = new Map<string, Set<NodeId>>();

  get nodeCount(): number {
    return this.nodes.size;
  }

  get edgeCount(): number {
    let count = 0;
    for (const edges of this.outgoing.values()) {
      count += edges.length;
    }
    return count;
  }

  addNode(node: MathNode): void {
    if (this.nodes.has(node.id)) {
      throw new Error(`Node already exists: ${node.id}`);
    }

    this.nodes.set(node.id, node);
    addToIndex(this.kindIndex, node.kind, node.id);
    addToIndex(this.sectionIndex, node.section, node.id);
  }

  getNode(id: string): MathNode | undefined {
    return this.nodes.get(id as NodeId);
  }

  hasNode(id: string): boolean {
    return this.nodes.has(id as NodeId);
  }

  removeNode(id: string): boolean {
    const nodeId = id as NodeId;
    const node = this.nodes.get(nodeId);
    if (!node) {
      return false;
    }

    for (const edge of this.getEdges(nodeId, 'both')) {
      this.removeEdge(edge);
    }

    this.nodes.delete(nodeId);
    removeFromIndex(this.kindIndex, node.kind, nodeId);
    removeFromIndex(this.sectionIndex, node.section, nodeId);
    return true;
  }

  addEdge(edge: MathEdge): void {
    if (!this.nodes.has(edge.source) || !this.nodes.has(edge.target)) {
      throw new Error(`Edge references unknown nodes: ${edge.source} -> ${edge.target}`);
    }

    this.outgoing.set(edge.source, [...(this.outgoing.get(edge.source) ?? []), edge]);
    this.incoming.set(edge.target, [...(this.incoming.get(edge.target) ?? []), edge]);
  }

  getEdges(nodeId: string, direction: 'in' | 'out' | 'both'): MathEdge[] {
    const typedNodeId = nodeId as NodeId;
    if (direction === 'in') {
      return [...(this.incoming.get(typedNodeId) ?? [])];
    }
    if (direction === 'out') {
      return [...(this.outgoing.get(typedNodeId) ?? [])];
    }
    return [...(this.outgoing.get(typedNodeId) ?? []), ...(this.incoming.get(typedNodeId) ?? [])];
  }

  *iterNodes(): IterableIterator<MathNode> {
    yield* this.nodes.values();
  }

  *iterEdges(): IterableIterator<MathEdge> {
    for (const edges of this.outgoing.values()) {
      for (const edge of edges) {
        yield edge;
      }
    }
  }

  forEachNode(fn: (node: MathNode) => void): void {
    for (const node of this.nodes.values()) {
      fn(node);
    }
  }

  forEachEdge(fn: (edge: MathEdge) => void): void {
    for (const edge of this.iterEdges()) {
      fn(edge);
    }
  }

  clear(): void {
    this.nodes.clear();
    this.outgoing.clear();
    this.incoming.clear();
    this.kindIndex.clear();
    this.sectionIndex.clear();
  }

  getNodesByKind(kind: MathNodeKind): MathNode[] {
    return this.materializeNodes(this.kindIndex.get(kind));
  }

  getNodesBySection(section: string): MathNode[] {
    return this.materializeNodes(this.sectionIndex.get(section));
  }

  getMainResults(): MathNode[] {
    return [...this.nodes.values()].filter((node) => node.isMainResult);
  }

  getDependencyChain(nodeId: NodeId, depth = Number.POSITIVE_INFINITY): MathNode[] {
    return this.traverseDependencies(nodeId, depth);
  }

  getProofFlow(nodeId: NodeId): MathNode[] {
    return this.traverseDependencies(nodeId, Number.POSITIVE_INFINITY);
  }

  computeStats(): BundleStats {
    return computeBundleStats(this.iterNodes(), this.iterEdges());
  }

  private materializeNodes(nodeIds?: Set<NodeId>): MathNode[] {
    if (!nodeIds) {
      return [];
    }

    const nodes: MathNode[] = [];
    for (const nodeId of nodeIds) {
      const node = this.nodes.get(nodeId);
      if (node) {
        nodes.push(node);
      }
    }
    return nodes;
  }

  private traverseDependencies(startNodeId: NodeId, depthLimit: number): MathNode[] {
    if (!this.nodes.has(startNodeId)) {
      return [];
    }

    const visited = new Set<NodeId>([startNodeId]);
    const queue: Array<{ nodeId: NodeId; depth: number }> = [{ nodeId: startNodeId, depth: 0 }];
    const dependencies: MathNode[] = [];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current || current.depth >= depthLimit) {
        continue;
      }

      for (const edge of this.outgoing.get(current.nodeId) ?? []) {
        if (visited.has(edge.target)) {
          continue;
        }

        visited.add(edge.target);
        const targetNode = this.nodes.get(edge.target);
        if (!targetNode) {
          continue;
        }

        dependencies.push(targetNode);
        queue.push({ nodeId: edge.target, depth: current.depth + 1 });
      }
    }

    return dependencies;
  }

  private removeEdge(edgeToRemove: MathEdge): void {
    this.outgoing.set(
      edgeToRemove.source,
      (this.outgoing.get(edgeToRemove.source) ?? []).filter((edge) => edge !== edgeToRemove),
    );
    this.incoming.set(
      edgeToRemove.target,
      (this.incoming.get(edgeToRemove.target) ?? []).filter((edge) => edge !== edgeToRemove),
    );

    if ((this.outgoing.get(edgeToRemove.source) ?? []).length === 0) {
      this.outgoing.delete(edgeToRemove.source);
    }
    if ((this.incoming.get(edgeToRemove.target) ?? []).length === 0) {
      this.incoming.delete(edgeToRemove.target);
    }
  }
}
