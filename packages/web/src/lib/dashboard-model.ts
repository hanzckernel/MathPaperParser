import type { SerializedPaperParserBundle } from '@paperparser/core';

export interface DashboardSection {
  section: string;
  title: string;
  summary: string;
  count: number;
  nodeIds: string[];
}

export interface DashboardMainResult {
  nodeId: string;
  label: string;
  headline: string;
  significance: string;
}

export interface DashboardModel {
  title: string;
  sourceType: string;
  authors: string[];
  year: number;
  problemStatement: SerializedPaperParserBundle['index']['problem_statement'];
  innovationAssessment: SerializedPaperParserBundle['index']['innovation_assessment'];
  attention: SerializedPaperParserBundle['index']['attention'];
  unknowns: SerializedPaperParserBundle['index']['unknowns'];
  notationIndex: SerializedPaperParserBundle['index']['notation_index'];
  stats: SerializedPaperParserBundle['index']['stats'];
  sections: DashboardSection[];
  sectionCount: number;
  mainResults: DashboardMainResult[];
  nodes: SerializedPaperParserBundle['graph']['nodes'];
  edges: SerializedPaperParserBundle['graph']['edges'];
  nodeById: Map<string, SerializedPaperParserBundle['graph']['nodes'][number]>;
  outgoingById: Map<string, SerializedPaperParserBundle['graph']['edges']>;
  incomingById: Map<string, SerializedPaperParserBundle['graph']['edges']>;
}

function naturalCompare(left: string, right: string): number {
  return left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' });
}

function buildSectionMap(bundle: SerializedPaperParserBundle): DashboardSection[] {
  const summaryBySection = new Map(bundle.index.summaries.map((summary) => [summary.section, summary]));
  const bySection = new Map<string, string[]>();

  for (const node of bundle.graph.nodes) {
    if (!node.section || node.section === '0') {
      continue;
    }

    const nodeIds = bySection.get(node.section) ?? [];
    nodeIds.push(node.id);
    bySection.set(node.section, nodeIds);
  }

  return [...bySection.entries()]
    .sort(([left], [right]) => naturalCompare(left, right))
    .map(([section, nodeIds]) => {
      const firstNode = bundle.graph.nodes.find((node) => node.id === nodeIds[0]);
      const summary = summaryBySection.get(section);

      return {
        section,
        title: summary?.section_title ?? firstNode?.section_title ?? '',
        summary: summary?.summary ?? '',
        count: nodeIds.length,
        nodeIds,
      };
    });
}

function buildEdgeIndex(
  edges: SerializedPaperParserBundle['graph']['edges'],
): Pick<DashboardModel, 'outgoingById' | 'incomingById'> {
  const outgoingById = new Map<string, SerializedPaperParserBundle['graph']['edges']>();
  const incomingById = new Map<string, SerializedPaperParserBundle['graph']['edges']>();

  for (const edge of edges) {
    const outgoing = outgoingById.get(edge.source) ?? [];
    outgoing.push(edge);
    outgoingById.set(edge.source, outgoing);

    const incoming = incomingById.get(edge.target) ?? [];
    incoming.push(edge);
    incomingById.set(edge.target, incoming);
  }

  return { outgoingById, incomingById };
}

export function buildDashboardModel(bundle: SerializedPaperParserBundle): DashboardModel {
  const nodeById = new Map(bundle.graph.nodes.map((node) => [node.id, node]));
  const { outgoingById, incomingById } = buildEdgeIndex(bundle.graph.edges);
  const sections = buildSectionMap(bundle);

  return {
    title: bundle.manifest.paper.title,
    sourceType: bundle.manifest.paper.source_type,
    authors: bundle.manifest.paper.authors,
    year: bundle.manifest.paper.year,
    problemStatement: bundle.index.problem_statement,
    innovationAssessment: bundle.index.innovation_assessment,
    attention: bundle.index.attention,
    unknowns: bundle.index.unknowns,
    notationIndex: bundle.index.notation_index,
    stats: bundle.index.stats,
    sections,
    sectionCount: sections.length,
    mainResults: bundle.index.main_results.map((result) => ({
      nodeId: result.node_id,
      label: nodeById.get(result.node_id)?.label ?? result.node_id,
      headline: result.headline,
      significance: result.significance,
    })),
    nodes: bundle.graph.nodes,
    edges: bundle.graph.edges,
    nodeById,
    outgoingById,
    incomingById,
  };
}
