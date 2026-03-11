import type { MainResult, ProofStrategy, SectionSummary } from './bundle.js';
import type { MathEdge } from './edge.js';
import type { MathNode, NodeId } from './node.js';

export const SEARCH_MODES = ['keyword', 'semantic', 'hybrid'] as const;

export type SearchMode = (typeof SEARCH_MODES)[number];

export interface SearchQuery {
  text: string;
  mode?: SearchMode;
  limit?: number;
}

export interface SearchResult {
  nodeId: NodeId;
  score: number;
  mode: SearchMode;
  matchedText: string;
  excerpt?: string;
}

export interface NodeContext {
  node: MathNode;
  incomingEdges: MathEdge[];
  outgoingEdges: MathEdge[];
  dependencyChain: MathNode[];
  proofFlow: MathNode[];
  sectionSummary?: SectionSummary;
  clusterIds: string[];
  proofStrategy?: ProofStrategy;
}

export interface ImpactAnalysis {
  node: MathNode;
  incomingEdges: MathEdge[];
  dependentNodes: MathNode[];
  impactedMainResults: MainResult[];
}
