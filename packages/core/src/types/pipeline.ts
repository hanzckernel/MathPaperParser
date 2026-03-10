import type { PaperParserBundle } from './bundle.js';
import type { MathEdge } from './edge.js';
import type { MathNode, NodeId } from './node.js';

export const INGESTION_INPUT_KINDS = ['latex', 'markdown', 'pdf'] as const;
export const PIPELINE_PHASE_NAMES = [
  'scan',
  'structure',
  'parse',
  'resolve',
  'cluster',
  'proof-flow',
] as const;

export type IngestionInputKind = (typeof INGESTION_INPUT_KINDS)[number];
export type PipelinePhaseName = (typeof PIPELINE_PHASE_NAMES)[number];

export interface SectionMarker {
  section: string;
  title: string;
  level: number;
  sourceIndex: number;
}

export interface PipelineProgress {
  phase: PipelinePhaseName;
  percent: number;
  message: string;
  stats?: Record<string, number>;
}

export interface PipelineOptions {
  inputKind?: IngestionInputKind;
  persist?: boolean;
  outputDir?: string;
  schemaVersion?: string;
}

export interface PipelineContext {
  inputPath: string;
  inputKind: IngestionInputKind;
  rawText: string;
  sections: SectionMarker[];
  nodes: MathNode[];
  edges: MathEdge[];
  labelToNodeId: Map<string, NodeId>;
  metadata: Record<string, unknown>;
}

export interface PipelineResult extends PaperParserBundle {}
