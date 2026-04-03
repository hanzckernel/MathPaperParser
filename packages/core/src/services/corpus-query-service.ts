import type { PaperParserBundle } from '../types/bundle.js';
import type { MathNode, MathNodeKind, NodeId } from '../types/node.js';
import type { CrossPaperLinkResult, CrossPaperMatch } from '../types/search.js';

const CORPUS_STOP_TERMS = new Set([
  'all',
  'alpha',
  'any',
  'about',
  'above',
  'after',
  'again',
  'along',
  'also',
  'beta',
  'begin',
  'below',
  'between',
  'bound',
  'bounded',
  'case',
  'cdot',
  'cite',
  'coro',
  'corollary',
  'delta',
  'denote',
  'definition',
  'epsilon',
  'eqn',
  'eqref',
  'equation',
  'example',
  'fig',
  'figure',
  'first',
  'for',
  'frac',
  'from',
  'gamma',
  'geq',
  'have',
  'infty',
  'into',
  'introduction',
  'latex',
  'lambda',
  'lemma',
  'leq',
  'left',
  'let',
  'main',
  'mathbb',
  'mathcal',
  'mathbf',
  'mathrm',
  'non',
  'orem',
  'over',
  'preliminaries',
  'proof',
  'proposition',
  'recall',
  'remark',
  'result',
  'right',
  'section',
  'send',
  'since',
  'show',
  'such',
  'tau',
  'that',
  'the',
  'theorem',
  'then',
  'theta',
  'there',
  'therefore',
  'thm',
  'thus',
  'under',
  'unless',
  'using',
  'varphi',
  'where',
  'which',
]);

const THEOREM_LIKE_KINDS = new Set<MathNodeKind>([
  'definition',
  'theorem',
  'lemma',
  'proposition',
  'corollary',
  'assumption',
  'remark',
  'example',
  'conjecture',
]);

const DEFAULT_LIMIT = 5;
const MIN_EVIDENCE_TERMS = 2;
const MAX_SOURCE_TERMS = 12;
const MAX_STATEMENT_CHARS = 240;

export interface CorpusBundleRecord {
  paperId: string;
  bundle: PaperParserBundle;
}

export interface CorpusQueryOptions {
  limit?: number;
}

function asNodeId(value: string): NodeId {
  return value as NodeId;
}

function candidateKindsFor(kind: MathNodeKind): Set<MathNodeKind> {
  if (THEOREM_LIKE_KINDS.has(kind)) {
    return THEOREM_LIKE_KINDS;
  }

  return new Set([kind]);
}

function normalizeToken(token: string): string {
  const lower = token.toLowerCase();
  if (lower.endsWith('us') || lower.endsWith('is')) {
    return lower;
  }
  if (lower.endsWith('ies') && lower.length > 4) {
    return `${lower.slice(0, -3)}y`;
  }
  if (lower.endsWith('s') && lower.length > 3 && !lower.endsWith('ss')) {
    return lower.slice(0, -1);
  }
  return lower;
}

function tokenize(text: string): string[] {
  return [...text.matchAll(/[A-Za-z][A-Za-z0-9]*/g)].map((match) => normalizeToken(match[0] ?? ''));
}

function collectNodeTerms(node: MathNode): Set<string> {
  const latexLabelTerms = (node.latexLabel ?? '').replace(/[:._-]+/g, ' ');
  const statementPreview = node.statement.slice(0, MAX_STATEMENT_CHARS);
  const text = [node.label, node.sectionTitle, latexLabelTerms, statementPreview].join(' ');
  const unique = new Set<string>();

  for (const token of tokenize(text)) {
    if (token.length < 3 || CORPUS_STOP_TERMS.has(token) || /^\d+$/u.test(token)) {
      continue;
    }
    unique.add(token);
  }

  return unique;
}

function stableSortTerms(terms: Set<string>, frequencies: Map<string, number>): string[] {
  return [...terms].sort((left, right) => {
    const frequencyDelta = (frequencies.get(left) ?? Number.MAX_SAFE_INTEGER) - (frequencies.get(right) ?? Number.MAX_SAFE_INTEGER);
    if (frequencyDelta !== 0) {
      return frequencyDelta;
    }
    return left.localeCompare(right);
  });
}

function buildFrequencyIndex(records: CorpusBundleRecord[]): Map<string, number> {
  const frequencies = new Map<string, number>();

  for (const record of records) {
    for (const node of record.bundle.graph.nodes) {
      const terms = collectNodeTerms(node);
      for (const term of terms) {
        frequencies.set(term, (frequencies.get(term) ?? 0) + 1);
      }
    }
  }

  return frequencies;
}

function detailForEvidence(evidenceTerms: string[]): string {
  return `Shared distinctive terms: ${evidenceTerms.join(', ')}.`;
}

export class CorpusQueryService {
  private readonly paperById = new Map<string, CorpusBundleRecord>();
  private readonly termFrequency: Map<string, number>;
  private readonly termsByPaperId = new Map<string, Map<NodeId, Set<string>>>();

  constructor(records: CorpusBundleRecord[]) {
    this.termFrequency = buildFrequencyIndex(records);

    for (const record of records) {
      this.paperById.set(record.paperId, record);
      const nodeTerms = new Map<NodeId, Set<string>>();
      for (const node of record.bundle.graph.nodes) {
        nodeTerms.set(node.id, collectNodeTerms(node));
      }
      this.termsByPaperId.set(record.paperId, nodeTerms);
    }
  }

  getRelatedNodes(sourcePaperId: string, nodeId: string, options: CorpusQueryOptions = {}): CrossPaperLinkResult {
    const sourceRecord = this.paperById.get(sourcePaperId);
    if (!sourceRecord) {
      throw new Error(`Unknown paper id: ${sourcePaperId}`);
    }

    const sourceNode = sourceRecord.bundle.graph.nodes.find((candidate) => candidate.id === nodeId);
    if (!sourceNode) {
      throw new Error(`Unknown node id ${nodeId} in paper ${sourcePaperId}`);
    }

    const sourceTerms = this.termsByPaperId.get(sourcePaperId)?.get(sourceNode.id) ?? new Set<string>();
    const rankedSourceTerms = stableSortTerms(sourceTerms, this.termFrequency).slice(0, MAX_SOURCE_TERMS);
    const candidateKinds = candidateKindsFor(sourceNode.kind);
    const matches: CrossPaperMatch[] = [];

    for (const [paperId, record] of this.paperById.entries()) {
      if (paperId === sourcePaperId) {
        continue;
      }

      const targetTermsByNodeId = this.termsByPaperId.get(paperId);
      if (!targetTermsByNodeId) {
        continue;
      }

      for (const targetNode of record.bundle.graph.nodes) {
        if (!candidateKinds.has(targetNode.kind)) {
          continue;
        }

        const targetTerms = targetTermsByNodeId.get(targetNode.id) ?? new Set<string>();
        const evidenceTerms = rankedSourceTerms.filter((term) => targetTerms.has(term));
        if (evidenceTerms.length < MIN_EVIDENCE_TERMS) {
          continue;
        }

        const score =
          evidenceTerms.reduce((sum, term) => sum + 1 / Math.max(1, this.termFrequency.get(term) ?? 1), 0) +
          (targetNode.kind === sourceNode.kind ? 0.75 : 0);

        matches.push({
          targetPaperId: paperId,
          targetPaperTitle: record.bundle.manifest.paper.title,
          targetPaperSourceType: record.bundle.manifest.paper.sourceType,
          targetNodeId: targetNode.id,
          targetNodeKind: targetNode.kind,
          targetLabel: targetNode.label,
          targetNumber: targetNode.number,
          targetSection: targetNode.section,
          targetSectionTitle: targetNode.sectionTitle,
          targetLatexLabel: targetNode.latexLabel,
          evidenceTerms,
          detail: detailForEvidence(evidenceTerms),
          score: Number(score.toFixed(4)),
        });
      }
    }

    matches.sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      const paperDelta = left.targetPaperId.localeCompare(right.targetPaperId);
      if (paperDelta !== 0) {
        return paperDelta;
      }
      return left.targetNodeId.localeCompare(right.targetNodeId);
    });

    return {
      sourcePaperId,
      sourceNodeId: asNodeId(nodeId),
      matches: matches.slice(0, options.limit ?? DEFAULT_LIMIT),
    };
  }
}
