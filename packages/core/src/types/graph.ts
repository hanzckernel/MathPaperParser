import type { BundleStats } from './bundle.js';
import type { MathEdge } from './edge.js';
import type { MathNode, MathNodeKind, NodeId } from './node.js';

export interface IKnowledgeGraph<N, E> {
  addNode(node: N): void;
  getNode(id: string): N | undefined;
  hasNode(id: string): boolean;
  removeNode(id: string): boolean;
  addEdge(edge: E): void;
  getEdges(nodeId: string, direction: 'in' | 'out' | 'both'): E[];
  readonly nodeCount: number;
  readonly edgeCount: number;
  iterNodes(): IterableIterator<N>;
  iterEdges(): IterableIterator<E>;
  forEachNode(fn: (node: N) => void): void;
  forEachEdge(fn: (edge: E) => void): void;
  clear(): void;
}

export interface IMathKnowledgeGraph extends IKnowledgeGraph<MathNode, MathEdge> {
  getNodesByKind(kind: MathNodeKind): MathNode[];
  getNodesBySection(section: string): MathNode[];
  getMainResults(): MathNode[];
  getDependencyChain(nodeId: NodeId, depth?: number): MathNode[];
  getProofFlow(nodeId: NodeId): MathNode[];
  computeStats(): BundleStats;
}
