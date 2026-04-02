import { EDGE_EVIDENCE_VALUES, MATH_EDGE_KINDS, type MathEdge } from './edge.js';
import { MATH_NODE_KINDS, type MathNode, type NodeId } from './node.js';

export type PaperSourceType = 'latex' | 'markdown' | 'pdf';
export type AnalysisLevel = 'bird_eye' | 'frog_eye' | 'both';
export type InnovationCalibration = 'significant' | 'incremental' | 'straightforward_extension';
export type AttentionDifficulty = 'low' | 'medium' | 'high';
export type UnknownScope = 'paper' | 'section' | 'proof_step';

export interface BundleManifestPaper {
  title: string;
  authors: string[];
  arxivId?: string;
  doi?: string;
  year: number;
  subjectArea: string;
  sourceType: PaperSourceType;
  sourceFiles: string[];
  versionNote?: string;
}

export interface BundleScope {
  sectionsIncluded: string[];
  analysisLevel: AnalysisLevel;
}

export interface BundleProducer {
  agent: string;
  schemaVersion: string;
  timestampStart: string;
  timestampEnd: string;
}

export interface BundleManifest {
  schemaVersion: string;
  createdAt: string;
  paper: BundleManifestPaper;
  scope: BundleScope;
  producer: BundleProducer;
}

export interface GraphBundle {
  schemaVersion: string;
  nodes: MathNode[];
  edges: MathEdge[];
}

export interface ProblemStatement {
  question: string;
  motivation: string;
  context: string;
}

export interface InnovationItem {
  description: string;
  calibration: InnovationCalibration;
  relatedNodes: NodeId[];
}

export interface InnovationAssessment {
  summary: string;
  mainInnovations: InnovationItem[];
  priorWorkComparison: string;
}

export interface ClusterSummary {
  id: string;
  label: string;
  section?: string;
  members: NodeId[];
  description: string;
}

export interface MainResult {
  nodeId: NodeId;
  headline: string;
  significance: string;
}

export interface ProofStrategyStep {
  step: number;
  description: string;
  uses: NodeId[];
}

export interface ProofStrategy {
  targetNode: NodeId;
  strategySummary: string;
  keySteps: ProofStrategyStep[];
  noiseRemoved?: string;
}

export interface SectionSummary {
  section: string;
  sectionTitle: string;
  summary: string;
}

export interface HighDependencyNodeAttention {
  nodeId: NodeId;
  inDegree: number;
  outDegree: number;
  note: string;
}

export interface DemandingProofAttention {
  nodeId: NodeId;
  reason: string;
  estimatedDifficulty: AttentionDifficulty;
}

export interface AttentionSummary {
  highDependencyNodes: HighDependencyNodeAttention[];
  demandingProofs: DemandingProofAttention[];
}

export interface UnknownItem {
  id: string;
  description: string;
  searchHint: string;
  scope: UnknownScope;
  relatedNodes: NodeId[];
}

export interface NotationEntry {
  symbol: string;
  meaning: string;
  introducedIn: NodeId;
}

export const BUNDLE_NODE_COUNT_KEYS = [...MATH_NODE_KINDS, 'total'] as const;
export const BUNDLE_EDGE_COUNT_KEYS = [...MATH_EDGE_KINDS, 'total'] as const;
export const BUNDLE_EVIDENCE_COUNT_KEYS = [...EDGE_EVIDENCE_VALUES] as const;

export type BundleNodeCounts = Record<(typeof BUNDLE_NODE_COUNT_KEYS)[number], number>;
export type BundleEdgeCounts = Record<(typeof BUNDLE_EDGE_COUNT_KEYS)[number], number>;
export type BundleEvidenceCounts = Record<(typeof BUNDLE_EVIDENCE_COUNT_KEYS)[number], number>;

export interface BundleStats {
  nodeCounts: BundleNodeCounts;
  edgeCounts: BundleEdgeCounts;
  evidenceBreakdown: BundleEvidenceCounts;
}

export interface PaperParserIndex {
  schemaVersion: string;
  problemStatement: ProblemStatement;
  innovationAssessment: InnovationAssessment;
  clusters: ClusterSummary[];
  mainResults: MainResult[];
  proofStrategies: ProofStrategy[];
  summaries: SectionSummary[];
  attention: AttentionSummary;
  unknowns: UnknownItem[];
  notationIndex: NotationEntry[];
  stats: BundleStats;
}

export interface PaperParserBundle {
  manifest: BundleManifest;
  graph: GraphBundle;
  index: PaperParserIndex;
}

export function createEmptyBundleStats(): BundleStats {
  return {
    nodeCounts: {
      section: 0,
      definition: 0,
      theorem: 0,
      lemma: 0,
      proposition: 0,
      corollary: 0,
      assumption: 0,
      remark: 0,
      example: 0,
      conjecture: 0,
      notation: 0,
      proof: 0,
      equation: 0,
      external_dependency: 0,
      total: 0,
    },
    edgeCounts: {
      contains: 0,
      proves: 0,
      uses_in_proof: 0,
      extends: 0,
      generalizes: 0,
      specializes: 0,
      equivalent_to: 0,
      cites_external: 0,
      total: 0,
    },
    evidenceBreakdown: {
      explicit_ref: 0,
      inferred: 0,
      external: 0,
    },
  };
}

export function createEmptyIndex(schemaVersion = '0.2.0'): PaperParserIndex {
  return {
    schemaVersion,
    problemStatement: {
      question: '',
      motivation: '',
      context: '',
    },
    innovationAssessment: {
      summary: '',
      mainInnovations: [],
      priorWorkComparison: '',
    },
    clusters: [],
    mainResults: [],
    proofStrategies: [],
    summaries: [],
    attention: {
      highDependencyNodes: [],
      demandingProofs: [],
    },
    unknowns: [],
    notationIndex: [],
    stats: createEmptyBundleStats(),
  };
}
