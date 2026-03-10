export const MATH_NODE_KINDS = [
  'definition',
  'theorem',
  'lemma',
  'proposition',
  'corollary',
  'assumption',
  'remark',
  'example',
  'conjecture',
  'notation',
  'external_dependency',
] as const;

export const PROOF_STATUS_VALUES = [
  'full',
  'sketch',
  'deferred',
  'external',
  'not_applicable',
] as const;

export const NOVELTY_VALUES = [
  'new',
  'classical',
  'extended',
  'folklore',
] as const;

export type MathNodeKind = (typeof MATH_NODE_KINDS)[number];
export type ProofStatus = (typeof PROOF_STATUS_VALUES)[number];
export type Novelty = (typeof NOVELTY_VALUES)[number];
export type NodeId = string & { readonly __brand: unique symbol };

export interface MathNode {
  id: NodeId;
  kind: MathNodeKind;
  label: string;
  section: string;
  sectionTitle: string;
  number: string;
  latexLabel: string | null;
  statement: string;
  proofStatus: ProofStatus;
  isMainResult: boolean;
  novelty: Novelty;
  metadata: Record<string, unknown>;
  filePath?: string;
  startLine?: number;
  endLine?: number;
}
