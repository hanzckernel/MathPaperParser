import type { MathEdge } from './edge.js';

export const ENRICHMENT_REVIEW_STATUS_VALUES = ['pending', 'accepted', 'rejected'] as const;

export type EnrichmentReviewStatus = (typeof ENRICHMENT_REVIEW_STATUS_VALUES)[number];

export interface EnrichmentProviderInfo {
  agent: string;
  model: string;
  promptVersion: string;
}

export interface EnrichmentBaseBundleInfo {
  schemaVersion: string;
  nodeCount: number;
  edgeCount: number;
}

export interface EnrichmentEdge extends Omit<MathEdge, 'evidence' | 'provenance'> {
  evidence: 'inferred';
  provenance: 'agent_inferred';
  confidence: number;
  reviewStatus: EnrichmentReviewStatus;
}

export interface PaperParserEnrichment {
  schemaVersion: string;
  paperId: string;
  createdAt: string;
  baseBundle: EnrichmentBaseBundleInfo;
  provider: EnrichmentProviderInfo;
  edges: EnrichmentEdge[];
}
