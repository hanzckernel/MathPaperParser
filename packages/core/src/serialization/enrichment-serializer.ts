import type { PaperParserEnrichment } from '../types/enrichment.js';

export interface SerializedEnrichmentArtifact {
  schema_version: string;
  paper_id: string;
  created_at: string;
  base_bundle: {
    schema_version: string;
    node_count: number;
    edge_count: number;
  };
  provider: {
    agent: string;
    model: string;
    prompt_version: string;
  };
  edges: Array<{
    source: string;
    target: string;
    kind: PaperParserEnrichment['edges'][number]['kind'];
    evidence: 'inferred';
    provenance: 'agent_inferred';
    detail: string;
    metadata: Record<string, unknown>;
    confidence: number;
    review_status: PaperParserEnrichment['edges'][number]['reviewStatus'];
  }>;
}

export class EnrichmentSerializer {
  static toJsonArtifact(enrichment: PaperParserEnrichment): SerializedEnrichmentArtifact {
    return {
      schema_version: enrichment.schemaVersion,
      paper_id: enrichment.paperId,
      created_at: enrichment.createdAt,
      base_bundle: {
        schema_version: enrichment.baseBundle.schemaVersion,
        node_count: enrichment.baseBundle.nodeCount,
        edge_count: enrichment.baseBundle.edgeCount,
      },
      provider: {
        agent: enrichment.provider.agent,
        model: enrichment.provider.model,
        prompt_version: enrichment.provider.promptVersion,
      },
      edges: enrichment.edges.map((edge) => ({
        source: edge.source,
        target: edge.target,
        kind: edge.kind,
        evidence: edge.evidence,
        provenance: edge.provenance,
        detail: edge.detail,
        metadata: edge.metadata,
        confidence: edge.confidence,
        review_status: edge.reviewStatus,
      })),
    };
  }
}
