import { basename } from 'node:path';

import { computeBundleStats } from '../graph/stats.js';
import { createEmptyIndex, type BundleManifest, type PaperParserBundle, type PaperParserIndex, type SectionSummary } from '../types/bundle.js';
import type { MathEdge } from '../types/edge.js';
import type { MathNode, NodeId } from '../types/node.js';
import type { DocumentInput, ParsedDocument, PipelineDiagnostics, PipelineResult } from '../types/pipeline.js';

function nowIsoUtc(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function firstSentence(value: string): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return '';
  }

  for (const separator of ['. ', '? ', '! ']) {
    const index = normalized.indexOf(separator);
    if (index > 0 && index < 240) {
      return normalized.slice(0, index + 1).trim();
    }
  }

  return normalized.slice(0, 240).trim();
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'x';
}

function asNodeId(value: string): NodeId {
  return value as NodeId;
}

function createPlaceholderMainNode(nodes: MathNode[]): MathNode {
  const node: MathNode = {
    id: asNodeId('sec0::rem:no-extracted-main-result'),
    kind: 'remark',
    label: 'Remark (Auto-generated placeholder)',
    section: '0',
    sectionTitle: 'Front matter',
    number: '',
    latexLabel: null,
    statement: 'No theorem-like statements were extracted from the source.',
    proofStatus: 'not_applicable',
    isMainResult: true,
    novelty: 'new',
    metadata: {
      subkind: 'placeholder',
    },
  };
  nodes.push(node);
  return node;
}

function selectMainNode(nodes: MathNode[]): MathNode {
  const existingMain = nodes.find((node) => node.isMainResult);
  if (existingMain) {
    return existingMain;
  }

  const chosen =
    nodes.find((node) => node.kind === 'theorem' && `${node.label} ${node.latexLabel ?? ''}`.toLowerCase().includes('main')) ??
    nodes.find((node) => node.kind === 'theorem') ??
    nodes.at(0);

  if (chosen) {
    chosen.isMainResult = true;
    return chosen;
  }

  return createPlaceholderMainNode(nodes);
}

function buildSectionSummaries(nodes: MathNode[]): SectionSummary[] {
  const bySection = new Map<string, { title: string; kinds: Map<string, number> }>();

  for (const node of nodes) {
    if (node.section === '0') {
      continue;
    }

    const bucket = bySection.get(node.section) ?? {
      title: node.sectionTitle,
      kinds: new Map<string, number>(),
    };
    bucket.title = bucket.title || node.sectionTitle;
    bucket.kinds.set(node.kind, (bucket.kinds.get(node.kind) ?? 0) + 1);
    bySection.set(node.section, bucket);
  }

  return [...bySection.entries()]
    .sort(([left], [right]) => left.localeCompare(right, undefined, { numeric: true }))
    .map(([section, bucket]) => {
      const parts = [...bucket.kinds.entries()].map(([kind, count]) => `${count} ${kind}`);
      return {
        section,
        sectionTitle: bucket.title,
        summary: `Auto-generated: extracted ${parts.join(', ')} in this section.`,
      };
    });
}

function buildAttention(nodes: MathNode[], edges: MathEdge[]): PaperParserIndex['attention'] {
  const inDegree = new Map<string, number>();
  const outDegree = new Map<string, number>();

  for (const edge of edges) {
    outDegree.set(edge.source, (outDegree.get(edge.source) ?? 0) + 1);
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  }

  const highDependencyNodes = nodes
    .map((node) => {
      const inbound = inDegree.get(node.id) ?? 0;
      const outbound = outDegree.get(node.id) ?? 0;
      return {
        nodeId: node.id,
        inDegree: inbound,
        outDegree: outbound,
        score: inbound + outbound,
      };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 5)
    .map((item) => ({
      nodeId: item.nodeId,
      inDegree: item.inDegree,
      outDegree: item.outDegree,
      note: `Auto-detected high degree (in=${item.inDegree}, out=${item.outDegree}).`,
    }));

  const demandingProofs = nodes
    .filter((node) => !['definition', 'notation', 'external_dependency', 'assumption'].includes(node.kind))
    .map((node) => ({ nodeId: node.id, length: node.statement.length }))
    .sort((left, right) => right.length - left.length)
    .slice(0, 5)
    .map((item): PaperParserIndex['attention']['demandingProofs'][number] => {
      const estimatedDifficulty = item.length > 2000 ? 'high' : item.length > 800 ? 'medium' : 'low';

      return {
        nodeId: item.nodeId,
        reason: `Auto-ranked by statement length (${item.length} chars).`,
        estimatedDifficulty,
      };
    });

  return {
    highDependencyNodes,
    demandingProofs,
  };
}

function buildProofStrategies(mainNode: MathNode, edges: MathEdge[]): PaperParserIndex['proofStrategies'] {
  const directDependencies = edges
    .filter((edge) => edge.source === mainNode.id && edge.kind === 'uses_in_proof')
    .map((edge) => edge.target);

  return [
    {
      targetNode: mainNode.id,
      strategySummary:
        directDependencies.length > 0
          ? 'Auto-generated: the main result is organized around explicitly referenced dependencies.'
          : 'Auto-generated: no explicit dependency chain was extracted for the main result.',
      keySteps: [
        {
          step: 1,
          description:
            directDependencies.length > 0
              ? 'Reduce the proof to the directly referenced supporting statements.'
              : 'Read the main statement first; explicit proof dependencies were not extracted.',
          uses: [...new Set(directDependencies)],
        },
      ],
      noiseRemoved: 'Auto-generated first-pass strategy; routine proof details were not summarized.',
    },
  ];
}

function buildClusters(nodes: MathNode[]): PaperParserIndex['clusters'] {
  const bySection = new Map<string, MathNode[]>();

  for (const node of nodes) {
    const bucket = bySection.get(node.section) ?? [];
    bucket.push(node);
    bySection.set(node.section, bucket);
  }

  return [...bySection.entries()].map(([section, members]) => ({
    id: `cluster:${slugify(section === '0' ? 'front-matter' : `section-${section}`)}`,
    label: section === '0' ? 'Front matter' : `Section ${section}`,
    ...(section === '0' ? {} : { section }),
    members: members.map((member) => member.id),
    description:
      section === '0'
        ? 'Nodes collected from front matter, citations, or auto-generated placeholders.'
        : `Auto-generated cluster for section ${section}.`,
  }));
}

function buildNotationIndex(nodes: MathNode[]): PaperParserIndex['notationIndex'] {
  return nodes
    .filter((node) => node.kind === 'notation')
    .map((node) => ({
      symbol: firstSentence(node.label) || node.label,
      meaning: firstSentence(node.statement) || node.statement,
      introducedIn: node.id,
    }));
}

function manifestFromParsedDocument(input: DocumentInput, parsed: ParsedDocument): BundleManifest {
  const title = typeof parsed.metadata.title === 'string' && parsed.metadata.title.trim() ? parsed.metadata.title.trim() : input.displayName;
  const authors =
    Array.isArray(parsed.metadata.authors) && parsed.metadata.authors.length > 0
      ? parsed.metadata.authors.map((author) => String(author))
      : ['Unknown'];
  const year =
    typeof parsed.metadata.year === 'number' && Number.isFinite(parsed.metadata.year)
      ? parsed.metadata.year
      : new Date().getUTCFullYear();
  const subjectArea =
    typeof parsed.metadata.subjectArea === 'string' && parsed.metadata.subjectArea.trim()
      ? parsed.metadata.subjectArea.trim()
      : 'Unspecified Mathematics';

  return {
    schemaVersion: '0.2.0',
    createdAt: nowIsoUtc(),
    paper: {
      title,
      authors,
      ...(typeof parsed.metadata.arxivId === 'string' && parsed.metadata.arxivId ? { arxivId: parsed.metadata.arxivId } : {}),
      ...(typeof parsed.metadata.doi === 'string' && parsed.metadata.doi ? { doi: parsed.metadata.doi } : {}),
      year,
      subjectArea,
      sourceType: input.kind,
      sourceFiles: input.sourceFiles ?? [basename(input.path)],
      ...(typeof parsed.metadata.versionNote === 'string' && parsed.metadata.versionNote
        ? { versionNote: parsed.metadata.versionNote }
        : {}),
    },
    scope: {
      sectionsIncluded: ['all'],
      analysisLevel: 'both',
    },
    producer: {
      agent: 'paperparser-v2/core',
      schemaVersion: '0.2.0',
      timestampStart: nowIsoUtc(),
      timestampEnd: nowIsoUtc(),
    },
  };
}

export function buildBundleFromParsedDocument(parsed: ParsedDocument, diagnostics?: PipelineDiagnostics): PipelineResult {
  const nodes = [...parsed.nodes];
  const edges = [...parsed.edges];
  const mainNode = selectMainNode(nodes);
  const stats = computeBundleStats(nodes, edges);
  const summaries = buildSectionSummaries(nodes);
  const attention = buildAttention(nodes, edges);
  const proofStrategies = buildProofStrategies(mainNode, edges);

  const bundle: PaperParserBundle = {
    manifest: manifestFromParsedDocument(parsed.input, parsed),
    graph: {
      schemaVersion: '0.2.0',
      nodes,
      edges,
    },
    index: {
      ...createEmptyIndex('0.2.0'),
      problemStatement: {
        question:
          firstSentence(typeof parsed.metadata.abstract === 'string' ? parsed.metadata.abstract : '') ||
          `What is established in ${mainNode.label}?`,
        motivation:
          firstSentence(typeof parsed.metadata.abstract === 'string' ? parsed.metadata.abstract : '') ||
          'Auto-generated first-pass summary from parsed source structure.',
        context:
          parsed.input.kind === 'markdown'
            ? 'Auto-generated from academic Markdown structure.'
            : 'Auto-generated from LaTeX structure.',
      },
      innovationAssessment: {
        summary: 'Auto-generated first-pass novelty summary based on extracted main results and dependencies.',
        mainInnovations: [
          {
            description: `Highlights the extracted main result ${mainNode.label}.`,
            calibration: 'incremental',
            relatedNodes: [mainNode.id],
          },
        ],
        priorWorkComparison: 'Prior-work comparison has not been inferred yet in this first-pass pipeline.',
      },
      clusters: buildClusters(nodes),
      mainResults: [
        {
          nodeId: mainNode.id,
          headline: firstSentence(mainNode.statement) || mainNode.label,
          significance: `Auto-generated significance note for ${mainNode.label}.`,
        },
      ],
      proofStrategies,
      summaries,
      attention,
      unknowns: [],
      notationIndex: buildNotationIndex(nodes),
      stats,
    },
  };

  return {
    ...bundle,
    input: parsed.input,
    diagnostics: diagnostics ?? parsed.diagnostics,
  };
}
