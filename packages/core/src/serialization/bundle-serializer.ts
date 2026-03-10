import type {
  AttentionDifficulty,
  AttentionSummary,
  BundleManifest,
  BundleManifestPaper,
  BundleProducer,
  BundleScope,
  BundleStats,
  ClusterSummary,
  GraphBundle,
  HighDependencyNodeAttention,
  InnovationAssessment,
  InnovationItem,
  MainResult,
  NotationEntry,
  PaperParserBundle,
  PaperParserIndex,
  ProblemStatement,
  ProofStrategy,
  ProofStrategyStep,
  SectionSummary,
  UnknownItem,
} from '../types/bundle.js';
import type { MathEdge } from '../types/edge.js';
import type { MathNode, NodeId } from '../types/node.js';

export interface SerializedManifest {
  schema_version: string;
  created_at: string;
  paper: {
    title: string;
    authors: string[];
    arxiv_id?: string;
    doi?: string;
    year: number;
    subject_area: string;
    source_type: 'latex' | 'pdf';
    source_files: string[];
    version_note?: string;
  };
  scope: {
    sections_included: string[];
    analysis_level: 'bird_eye' | 'frog_eye' | 'both';
  };
  producer: {
    agent: string;
    schema_version: string;
    timestamp_start: string;
    timestamp_end: string;
  };
}

export interface SerializedGraph {
  schema_version: string;
  nodes: Array<{
    id: string;
    kind: MathNode['kind'];
    label: string;
    section: string;
    section_title: string;
    number: string;
    latex_label: string | null;
    statement: string;
    proof_status: MathNode['proofStatus'];
    is_main_result: boolean;
    novelty: MathNode['novelty'];
    metadata: Record<string, unknown>;
  }>;
  edges: Array<{
    source: string;
    target: string;
    kind: MathEdge['kind'];
    evidence: MathEdge['evidence'];
    detail: string;
    metadata: Record<string, unknown>;
    confidence?: number;
  }>;
}

export interface SerializedIndex {
  schema_version: string;
  problem_statement: {
    question: string;
    motivation: string;
    context: string;
  };
  innovation_assessment: {
    summary: string;
    main_innovations: Array<{
      description: string;
      calibration: InnovationItem['calibration'];
      related_nodes: string[];
    }>;
    prior_work_comparison: string;
  };
  clusters: Array<{
    id: string;
    label: string;
    section?: string;
    members: string[];
    description: string;
  }>;
  main_results: Array<{
    node_id: string;
    headline: string;
    significance: string;
  }>;
  proof_strategies: Array<{
    target_node: string;
    strategy_summary: string;
    key_steps: Array<{
      step: number;
      description: string;
      uses: string[];
    }>;
    noise_removed?: string;
  }>;
  summaries: Array<{
    section: string;
    section_title: string;
    summary: string;
  }>;
  attention: {
    high_dependency_nodes: Array<{
      node_id: string;
      in_degree: number;
      out_degree: number;
      note: string;
    }>;
    demanding_proofs: Array<{
      node_id: string;
      reason: string;
      estimated_difficulty: AttentionDifficulty;
    }>;
  };
  unknowns: Array<{
    id: string;
    description: string;
    search_hint: string;
    scope: UnknownItem['scope'];
    related_nodes: string[];
  }>;
  notation_index: Array<{
    symbol: string;
    meaning: string;
    introduced_in: string;
  }>;
  stats: {
    node_counts: BundleStats['nodeCounts'];
    edge_counts: BundleStats['edgeCounts'];
    evidence_breakdown: BundleStats['evidenceBreakdown'];
  };
}

export interface SerializedPaperParserBundle {
  manifest: SerializedManifest;
  graph: SerializedGraph;
  index: SerializedIndex;
}

function asNodeId(nodeId: string): NodeId {
  return nodeId as NodeId;
}

function fromPaper(paper: SerializedManifest['paper']): BundleManifestPaper {
  return {
    title: paper.title,
    authors: paper.authors,
    year: paper.year,
    subjectArea: paper.subject_area,
    sourceType: paper.source_type,
    sourceFiles: paper.source_files,
    ...(paper.arxiv_id ? { arxivId: paper.arxiv_id } : {}),
    ...(paper.doi ? { doi: paper.doi } : {}),
    ...(paper.version_note ? { versionNote: paper.version_note } : {}),
  };
}

function fromScope(scope: SerializedManifest['scope']): BundleScope {
  return {
    sectionsIncluded: scope.sections_included,
    analysisLevel: scope.analysis_level,
  };
}

function fromProducer(producer: SerializedManifest['producer']): BundleProducer {
  return {
    agent: producer.agent,
    schemaVersion: producer.schema_version,
    timestampStart: producer.timestamp_start,
    timestampEnd: producer.timestamp_end,
  };
}

function fromNode(node: SerializedGraph['nodes'][number]): MathNode {
  return {
    id: asNodeId(node.id),
    kind: node.kind,
    label: node.label,
    section: node.section,
    sectionTitle: node.section_title,
    number: node.number,
    latexLabel: node.latex_label,
    statement: node.statement,
    proofStatus: node.proof_status,
    isMainResult: node.is_main_result,
    novelty: node.novelty,
    metadata: node.metadata,
  };
}

function fromEdge(edge: SerializedGraph['edges'][number]): MathEdge {
  return {
    source: asNodeId(edge.source),
    target: asNodeId(edge.target),
    kind: edge.kind,
    evidence: edge.evidence,
    detail: edge.detail,
    metadata: edge.metadata,
    ...(typeof edge.confidence === 'number' ? { confidence: edge.confidence } : {}),
  };
}

function fromProblemStatement(problemStatement: SerializedIndex['problem_statement']): ProblemStatement {
  return {
    question: problemStatement.question,
    motivation: problemStatement.motivation,
    context: problemStatement.context,
  };
}

function fromInnovationAssessment(
  innovationAssessment: SerializedIndex['innovation_assessment'],
): InnovationAssessment {
  return {
    summary: innovationAssessment.summary,
    mainInnovations: innovationAssessment.main_innovations.map(
      (innovation): InnovationItem => ({
        description: innovation.description,
        calibration: innovation.calibration,
        relatedNodes: innovation.related_nodes.map(asNodeId),
      }),
    ),
    priorWorkComparison: innovationAssessment.prior_work_comparison,
  };
}

function fromClusters(clusters: SerializedIndex['clusters']): ClusterSummary[] {
  return clusters.map(
    (cluster): ClusterSummary => ({
      id: cluster.id,
      label: cluster.label,
      members: cluster.members.map(asNodeId),
      description: cluster.description,
      ...(cluster.section ? { section: cluster.section } : {}),
    }),
  );
}

function fromMainResults(mainResults: SerializedIndex['main_results']): MainResult[] {
  return mainResults.map(
    (result): MainResult => ({
      nodeId: asNodeId(result.node_id),
      headline: result.headline,
      significance: result.significance,
    }),
  );
}

function fromProofStrategies(proofStrategies: SerializedIndex['proof_strategies']): ProofStrategy[] {
  return proofStrategies.map(
    (strategy): ProofStrategy => ({
      targetNode: asNodeId(strategy.target_node),
      strategySummary: strategy.strategy_summary,
      keySteps: strategy.key_steps.map(
        (step): ProofStrategyStep => ({
          step: step.step,
          description: step.description,
          uses: step.uses.map(asNodeId),
        }),
      ),
      ...(strategy.noise_removed ? { noiseRemoved: strategy.noise_removed } : {}),
    }),
  );
}

function fromSummaries(summaries: SerializedIndex['summaries']): SectionSummary[] {
  return summaries.map(
    (summary): SectionSummary => ({
      section: summary.section,
      sectionTitle: summary.section_title,
      summary: summary.summary,
    }),
  );
}

function fromAttention(attention: SerializedIndex['attention']): AttentionSummary {
  return {
    highDependencyNodes: attention.high_dependency_nodes.map(
      (item): HighDependencyNodeAttention => ({
        nodeId: asNodeId(item.node_id),
        inDegree: item.in_degree,
        outDegree: item.out_degree,
        note: item.note,
      }),
    ),
    demandingProofs: attention.demanding_proofs.map(
      (item) => ({
        nodeId: asNodeId(item.node_id),
        reason: item.reason,
        estimatedDifficulty: item.estimated_difficulty,
      }),
    ),
  };
}

function fromUnknowns(unknowns: SerializedIndex['unknowns']): UnknownItem[] {
  return unknowns.map(
    (unknown): UnknownItem => ({
      id: unknown.id,
      description: unknown.description,
      searchHint: unknown.search_hint,
      scope: unknown.scope,
      relatedNodes: unknown.related_nodes.map(asNodeId),
    }),
  );
}

function fromNotationIndex(notationIndex: SerializedIndex['notation_index']): NotationEntry[] {
  return notationIndex.map(
    (entry): NotationEntry => ({
      symbol: entry.symbol,
      meaning: entry.meaning,
      introducedIn: asNodeId(entry.introduced_in),
    }),
  );
}

function fromStats(stats: SerializedIndex['stats']): BundleStats {
  return {
    nodeCounts: stats.node_counts,
    edgeCounts: stats.edge_counts,
    evidenceBreakdown: stats.evidence_breakdown,
  };
}

function toPaper(paper: BundleManifestPaper): SerializedManifest['paper'] {
  return {
    title: paper.title,
    authors: paper.authors,
    year: paper.year,
    subject_area: paper.subjectArea,
    source_type: paper.sourceType,
    source_files: paper.sourceFiles,
    ...(paper.arxivId ? { arxiv_id: paper.arxivId } : {}),
    ...(paper.doi ? { doi: paper.doi } : {}),
    ...(paper.versionNote ? { version_note: paper.versionNote } : {}),
  };
}

function toScope(scope: BundleScope): SerializedManifest['scope'] {
  return {
    sections_included: scope.sectionsIncluded,
    analysis_level: scope.analysisLevel,
  };
}

function toProducer(producer: BundleProducer): SerializedManifest['producer'] {
  return {
    agent: producer.agent,
    schema_version: producer.schemaVersion,
    timestamp_start: producer.timestampStart,
    timestamp_end: producer.timestampEnd,
  };
}

function toNode(node: MathNode): SerializedGraph['nodes'][number] {
  return {
    id: node.id,
    kind: node.kind,
    label: node.label,
    section: node.section,
    section_title: node.sectionTitle,
    number: node.number,
    latex_label: node.latexLabel,
    statement: node.statement,
    proof_status: node.proofStatus,
    is_main_result: node.isMainResult,
    novelty: node.novelty,
    metadata: node.metadata,
  };
}

function toEdge(edge: MathEdge): SerializedGraph['edges'][number] {
  return {
    source: edge.source,
    target: edge.target,
    kind: edge.kind,
    evidence: edge.evidence,
    detail: edge.detail,
    metadata: edge.metadata,
    ...(typeof edge.confidence === 'number' ? { confidence: edge.confidence } : {}),
  };
}

function toProblemStatement(problemStatement: ProblemStatement): SerializedIndex['problem_statement'] {
  return {
    question: problemStatement.question,
    motivation: problemStatement.motivation,
    context: problemStatement.context,
  };
}

function toInnovationAssessment(
  innovationAssessment: InnovationAssessment,
): SerializedIndex['innovation_assessment'] {
  return {
    summary: innovationAssessment.summary,
    main_innovations: innovationAssessment.mainInnovations.map((innovation) => ({
      description: innovation.description,
      calibration: innovation.calibration,
      related_nodes: innovation.relatedNodes,
    })),
    prior_work_comparison: innovationAssessment.priorWorkComparison,
  };
}

function toClusters(clusters: ClusterSummary[]): SerializedIndex['clusters'] {
  return clusters.map((cluster) => ({
    id: cluster.id,
    label: cluster.label,
    members: cluster.members,
    description: cluster.description,
    ...(cluster.section ? { section: cluster.section } : {}),
  }));
}

function toMainResults(mainResults: MainResult[]): SerializedIndex['main_results'] {
  return mainResults.map((result) => ({
    node_id: result.nodeId,
    headline: result.headline,
    significance: result.significance,
  }));
}

function toProofStrategies(proofStrategies: ProofStrategy[]): SerializedIndex['proof_strategies'] {
  return proofStrategies.map((strategy) => ({
    target_node: strategy.targetNode,
    strategy_summary: strategy.strategySummary,
    key_steps: strategy.keySteps.map((step) => ({
      step: step.step,
      description: step.description,
      uses: step.uses,
    })),
    ...(strategy.noiseRemoved ? { noise_removed: strategy.noiseRemoved } : {}),
  }));
}

function toSummaries(summaries: SectionSummary[]): SerializedIndex['summaries'] {
  return summaries.map((summary) => ({
    section: summary.section,
    section_title: summary.sectionTitle,
    summary: summary.summary,
  }));
}

function toAttention(attention: AttentionSummary): SerializedIndex['attention'] {
  return {
    high_dependency_nodes: attention.highDependencyNodes.map((item) => ({
      node_id: item.nodeId,
      in_degree: item.inDegree,
      out_degree: item.outDegree,
      note: item.note,
    })),
    demanding_proofs: attention.demandingProofs.map((item) => ({
      node_id: item.nodeId,
      reason: item.reason,
      estimated_difficulty: item.estimatedDifficulty,
    })),
  };
}

function toUnknowns(unknowns: UnknownItem[]): SerializedIndex['unknowns'] {
  return unknowns.map((unknown) => ({
    id: unknown.id,
    description: unknown.description,
    search_hint: unknown.searchHint,
    scope: unknown.scope,
    related_nodes: unknown.relatedNodes,
  }));
}

function toNotationIndex(notationIndex: NotationEntry[]): SerializedIndex['notation_index'] {
  return notationIndex.map((entry) => ({
    symbol: entry.symbol,
    meaning: entry.meaning,
    introduced_in: entry.introducedIn,
  }));
}

function toStats(stats: BundleStats): SerializedIndex['stats'] {
  return {
    node_counts: stats.nodeCounts,
    edge_counts: stats.edgeCounts,
    evidence_breakdown: stats.evidenceBreakdown,
  };
}

export class BundleSerializer {
  static fromJsonBundle(bundle: SerializedPaperParserBundle): PaperParserBundle {
    const manifest: BundleManifest = {
      schemaVersion: bundle.manifest.schema_version,
      createdAt: bundle.manifest.created_at,
      paper: fromPaper(bundle.manifest.paper),
      scope: fromScope(bundle.manifest.scope),
      producer: fromProducer(bundle.manifest.producer),
    };

    const graph: GraphBundle = {
      schemaVersion: bundle.graph.schema_version,
      nodes: bundle.graph.nodes.map(fromNode),
      edges: bundle.graph.edges.map(fromEdge),
    };

    const index: PaperParserIndex = {
      schemaVersion: bundle.index.schema_version,
      problemStatement: fromProblemStatement(bundle.index.problem_statement),
      innovationAssessment: fromInnovationAssessment(bundle.index.innovation_assessment),
      clusters: fromClusters(bundle.index.clusters),
      mainResults: fromMainResults(bundle.index.main_results),
      proofStrategies: fromProofStrategies(bundle.index.proof_strategies),
      summaries: fromSummaries(bundle.index.summaries),
      attention: fromAttention(bundle.index.attention),
      unknowns: fromUnknowns(bundle.index.unknowns),
      notationIndex: fromNotationIndex(bundle.index.notation_index),
      stats: fromStats(bundle.index.stats),
    };

    return { manifest, graph, index };
  }

  static toJsonBundle(bundle: PaperParserBundle): SerializedPaperParserBundle {
    return {
      manifest: {
        schema_version: bundle.manifest.schemaVersion,
        created_at: bundle.manifest.createdAt,
        paper: toPaper(bundle.manifest.paper),
        scope: toScope(bundle.manifest.scope),
        producer: toProducer(bundle.manifest.producer),
      },
      graph: {
        schema_version: bundle.graph.schemaVersion,
        nodes: bundle.graph.nodes.map(toNode),
        edges: bundle.graph.edges.map(toEdge),
      },
      index: {
        schema_version: bundle.index.schemaVersion,
        problem_statement: toProblemStatement(bundle.index.problemStatement),
        innovation_assessment: toInnovationAssessment(bundle.index.innovationAssessment),
        clusters: toClusters(bundle.index.clusters),
        main_results: toMainResults(bundle.index.mainResults),
        proof_strategies: toProofStrategies(bundle.index.proofStrategies),
        summaries: toSummaries(bundle.index.summaries),
        attention: toAttention(bundle.index.attention),
        unknowns: toUnknowns(bundle.index.unknowns),
        notation_index: toNotationIndex(bundle.index.notationIndex),
        stats: toStats(bundle.index.stats),
      },
    };
  }
}
