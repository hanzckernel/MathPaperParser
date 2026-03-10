import type { NodeId } from './node.js';

export const MATH_EDGE_KINDS = [
  'uses_in_proof',
  'extends',
  'generalizes',
  'specializes',
  'equivalent_to',
  'cites_external',
] as const;

export const EDGE_EVIDENCE_VALUES = [
  'explicit_ref',
  'inferred',
  'external',
] as const;

export type MathEdgeKind = (typeof MATH_EDGE_KINDS)[number];
export type EdgeEvidence = (typeof EDGE_EVIDENCE_VALUES)[number];

export interface MathEdge {
  source: NodeId;
  target: NodeId;
  kind: MathEdgeKind;
  evidence: EdgeEvidence;
  detail: string;
  metadata: Record<string, unknown>;
  confidence?: number;
}
