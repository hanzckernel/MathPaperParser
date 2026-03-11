import type { PaperParserBundle } from './bundle.js';
import type { MathEdge } from './edge.js';
import type { MathNode, NodeId } from './node.js';

export const DOCUMENT_SOURCE_KINDS = ['latex', 'markdown', 'pdf'] as const;
export const INGESTION_INPUT_KINDS = DOCUMENT_SOURCE_KINDS;
export const INGESTION_WARNING_SEVERITIES = ['info', 'warning', 'error'] as const;
export const PIPELINE_PHASE_NAMES = [
  'scan',
  'structure',
  'parse',
  'resolve',
  'cluster',
  'proof-flow',
] as const;

export type DocumentSourceKind = (typeof DOCUMENT_SOURCE_KINDS)[number];
export type IngestionInputKind = DocumentSourceKind;
export type IngestionWarningSeverity = (typeof INGESTION_WARNING_SEVERITIES)[number];
export type PipelinePhaseName = (typeof PIPELINE_PHASE_NAMES)[number];

export interface SectionMarker {
  section: string;
  title: string;
  level: number;
  sourceIndex: number;
}

export interface DocumentInput {
  kind: DocumentSourceKind;
  path: string;
  displayName: string;
  entryFile?: string;
  content?: string;
  sourceFiles?: string[];
}

export interface ParsedDocumentMetadata {
  title?: string;
  authors?: string[];
  year?: number;
  subjectArea?: string;
  arxivId?: string;
  doi?: string;
  versionNote?: string;
  abstract?: string;
  [key: string]: unknown;
}

export interface IngestionWarning {
  code: string;
  severity: IngestionWarningSeverity;
  message: string;
  phase: PipelinePhaseName;
  sourcePath?: string;
  line?: number;
  metadata?: Record<string, unknown>;
}

export interface PipelineDiagnostics {
  schemaVersion: string;
  warnings: IngestionWarning[];
}

export interface PipelineProgress {
  phase: PipelinePhaseName;
  percent: number;
  message: string;
  stats?: Record<string, number>;
}

export interface PipelineOptions {
  persist?: boolean;
  outputDir?: string;
  schemaVersion?: string;
  storePath?: string;
  paperId?: string;
}

export interface ParsedDocument {
  input: DocumentInput;
  rawText: string;
  sections: SectionMarker[];
  nodes: MathNode[];
  edges: MathEdge[];
  labelToNodeId: Map<string, NodeId>;
  metadata: ParsedDocumentMetadata;
  diagnostics: PipelineDiagnostics;
}

export interface PipelineContext extends ParsedDocument {
  inputKind: DocumentSourceKind;
}

export interface PipelineResult extends PaperParserBundle {
  input: DocumentInput;
  diagnostics: PipelineDiagnostics;
}

export interface DocumentParser {
  readonly kind: DocumentSourceKind;
  parse(input: DocumentInput, options?: PipelineOptions): Promise<ParsedDocument> | ParsedDocument;
}

export interface IngestionPipeline {
  analyze(input: DocumentInput, options?: PipelineOptions): Promise<PipelineResult> | PipelineResult;
}

export function createEmptyPipelineDiagnostics(schemaVersion = '0.2.0'): PipelineDiagnostics {
  return {
    schemaVersion,
    warnings: [],
  };
}
