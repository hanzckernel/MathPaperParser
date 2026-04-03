import type { MainResult, PaperSourceType, ProofStrategy, SectionSummary } from './bundle.js';
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
  nodeKind: MathNode['kind'];
  label: string;
  number: string;
  section: string;
  sectionTitle: string;
  latexLabel: string | null;
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

export interface CrossPaperMatch {
  targetPaperId: string;
  targetPaperTitle: string;
  targetPaperSourceType: PaperSourceType;
  targetNodeId: NodeId;
  targetNodeKind: MathNode['kind'];
  targetLabel: string;
  targetNumber: string;
  targetSection: string;
  targetSectionTitle: string;
  targetLatexLabel: string | null;
  evidenceTerms: string[];
  detail: string;
  score: number;
}

export interface CrossPaperLinkResult {
  sourcePaperId: string;
  sourceNodeId: NodeId;
  matches: CrossPaperMatch[];
}
