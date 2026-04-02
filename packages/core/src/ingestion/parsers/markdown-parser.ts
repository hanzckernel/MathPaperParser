import { readFileSync } from 'node:fs';

import type { MathEdge } from '../../types/edge.js';
import type { MathNode, NodeId } from '../../types/node.js';
import {
  createEmptyPipelineDiagnostics,
  type DocumentInput,
  type ParsedDocument,
  type ParsedDocumentMetadata,
  type SectionMarker,
} from '../../types/pipeline.js';

const MARKDOWN_KIND_TO_NODE_KIND = {
  theorem: 'theorem',
  lemma: 'lemma',
  proposition: 'proposition',
  corollary: 'corollary',
  definition: 'definition',
  assumption: 'assumption',
  remark: 'remark',
  example: 'example',
  conjecture: 'conjecture',
  notation: 'notation',
} as const satisfies Record<string, MathNode['kind']>;

const NODE_KIND_TO_ABBREVIATION: Record<MathNode['kind'], string> = {
  section: 'sec',
  definition: 'def',
  theorem: 'thm',
  lemma: 'lem',
  proposition: 'prop',
  corollary: 'cor',
  assumption: 'asm',
  remark: 'rem',
  example: 'ex',
  conjecture: 'conj',
  notation: 'not',
  proof: 'proof',
  equation: 'eq',
  external_dependency: 'ext',
};

const TEXT_REFERENCE_RE =
  /\b(Theorem|Lemma|Proposition|Corollary|Definition|Assumption|Remark|Example|Conjecture|Notation)\s+([A-Z]?(?:\d+(?:\.\d+)*))\b/g;
const FRAGMENT_LINK_RE = /\[[^\]]+]\(#([A-Za-z0-9:_-]+)\)/g;
type MarkdownKindToken = keyof typeof MARKDOWN_KIND_TO_NODE_KIND;

interface ParsedFrontMatter {
  metadata: ParsedDocumentMetadata;
  body: string;
}

interface HeaderInfo {
  kind: MathNode['kind'];
  number: string;
  title?: string;
  anchor?: string;
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

function kindFromToken(token: string): MathNode['kind'] | undefined {
  if (token in MARKDOWN_KIND_TO_NODE_KIND) {
    return MARKDOWN_KIND_TO_NODE_KIND[token as MarkdownKindToken];
  }

  return undefined;
}

function parseScalar(value: string): string | number {
  if (/^\d+$/u.test(value.trim())) {
    return Number.parseInt(value.trim(), 10);
  }

  return value.trim();
}

function parseFrontMatter(rawText: string): ParsedFrontMatter {
  if (!rawText.startsWith('---\n')) {
    return {
      metadata: {},
      body: rawText,
    };
  }

  const lines = rawText.split(/\r?\n/u);
  let index = 1;
  const metadata: ParsedDocumentMetadata = {};

  while (index < lines.length) {
    const line = lines[index] ?? '';
    if (line.trim() === '---') {
      return {
        metadata,
        body: lines.slice(index + 1).join('\n'),
      };
    }

    const keyMatch = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/u);
    if (!keyMatch) {
      index += 1;
      continue;
    }

    const rawKey = keyMatch[1];
    const rawValue = keyMatch[2];
    if (!rawKey || rawValue === undefined) {
      index += 1;
      continue;
    }

    const key = rawKey.trim();
    const value = rawValue.trim();

    const metadataKey =
      key === 'subject_area'
        ? 'subjectArea'
        : key === 'arxiv_id'
          ? 'arxivId'
          : key === 'version_note'
            ? 'versionNote'
            : key;

    if (value !== '') {
      metadata[metadataKey] = parseScalar(value);
      index += 1;
      continue;
    }

    const arrayItems: string[] = [];
    index += 1;
    while (index < lines.length) {
      const itemLine = lines[index] ?? '';
      const itemMatch = itemLine.match(/^\s*-\s+(.*)$/u);
      if (!itemMatch) {
        break;
      }
      const itemValue = itemMatch[1];
      if (itemValue) {
        arrayItems.push(itemValue.trim());
      }
      index += 1;
    }
    metadata[metadataKey] = arrayItems;
  }

  return {
    metadata,
    body: rawText,
  };
}

function stripAnchorSuffix(value: string): { text: string; anchor?: string } {
  const match = value.match(/^(.*?)(?:\s+\{#([^}]+)\})\s*$/u);
  if (!match) {
    return { text: value.trim() };
  }

  const text = match[1] ?? '';
  const anchor = match[2];
  return {
    text: text.trim(),
    ...(anchor ? { anchor: anchor.trim() } : {}),
  };
}

function parseHeader(line: string, fallbackKind?: MathNode['kind'], fallbackAnchor?: string): HeaderInfo | undefined {
  const { text, anchor } = stripAnchorSuffix(line);
  const headerMatch = text.match(
    /^(Theorem|Lemma|Proposition|Corollary|Definition|Assumption|Remark|Example|Conjecture|Notation)\b(?:\s+([A-Z]?(?:\d+(?:\.\d+)*)))?(?:\s*\(([^)]+)\))?\.?\s*$/u,
  );

  if (!headerMatch) {
    if (!fallbackKind) {
      return undefined;
    }

    return {
      kind: fallbackKind,
      number: '',
      ...((fallbackAnchor ?? anchor) ? { anchor: fallbackAnchor ?? anchor } : {}),
    };
  }

  const kindToken = (headerMatch[1] ?? '').toLowerCase();
  const kind = kindFromToken(kindToken);
  if (!kind) {
    return undefined;
  }

  const title = headerMatch[3]?.trim();
  const resolvedAnchor = fallbackAnchor ?? anchor;
  return {
    kind,
    number: (headerMatch[2] ?? '').trim(),
    ...(title ? { title } : {}),
    ...(resolvedAnchor ? { anchor: resolvedAnchor } : {}),
  };
}

function createNodeId(section: string, kind: MathNode['kind'], slug: string): NodeId {
  return asNodeId(`sec${section}::${NODE_KIND_TO_ABBREVIATION[kind]}:${slug}`);
}

function createNode(
  header: HeaderInfo,
  statementLines: string[],
  section: string,
  sectionTitle: string,
  blockType: 'blockquote' | 'admonition',
): MathNode {
  const slug = header.anchor
    ? slugify(header.anchor)
    : slugify(`${header.kind}-${header.number || statementLines.at(0) || 'node'}`);
  const labelPrefix = header.kind.charAt(0).toUpperCase() + header.kind.slice(1);
  const labelNumber = header.number ? ` ${header.number}` : '';
  const labelTitle = header.title ? ` (${header.title})` : '';

  return {
    id: createNodeId(section, header.kind, slug),
    kind: header.kind,
    label: `${labelPrefix}${labelNumber}${labelTitle}`.trim(),
    section,
    sectionTitle,
    number: header.number,
    latexLabel: null,
    statement: statementLines.join('\n').trim(),
    proofStatus:
      header.kind === 'definition' || header.kind === 'assumption' || header.kind === 'notation'
        ? 'not_applicable'
        : 'deferred',
    isMainResult: false,
    novelty: header.kind === 'definition' || header.kind === 'notation' ? 'classical' : 'new',
    metadata: {
      blockType,
      sourceFormat: 'markdown',
      ...(header.anchor ? { anchor: header.anchor } : {}),
    },
  };
}

function parseMarkdownText(input: DocumentInput): string {
  if (input.content) {
    return input.content;
  }

  return readFileSync(input.path, 'utf8');
}

function collectBlockquote(lines: string[], startIndex: number): { consumed: number; content: string[] } {
  const content: string[] = [];
  let index = startIndex;

  while (index < lines.length) {
    const line = lines[index] ?? '';
    if (!line.trimStart().startsWith('>')) {
      break;
    }

    content.push(line.replace(/^\s*>\s?/u, '').trimEnd());
    index += 1;
  }

  return { consumed: index - startIndex, content };
}

function collectAdmonition(lines: string[], startIndex: number): { consumed: number; header: string; content: string[] } {
  const startLine = lines[startIndex] ?? '';
  const header = startLine.trim();
  const content: string[] = [];
  let index = startIndex + 1;

  while (index < lines.length) {
    const line = lines[index] ?? '';
    if (line.trim() === ':::') {
      break;
    }

    content.push(line.trimEnd());
    index += 1;
  }

  return {
    consumed: Math.min(lines.length - startIndex, index - startIndex + 1),
    header,
    content,
  };
}

export function parseAcademicMarkdown(input: DocumentInput): ParsedDocument {
  const rawText = parseMarkdownText(input);
  const { metadata, body } = parseFrontMatter(rawText);
  const diagnostics = createEmptyPipelineDiagnostics('0.2.0');
  const sections: SectionMarker[] = [];
  const nodes: MathNode[] = [];
  const edges: MathEdge[] = [];
  const labelToNodeId = new Map<string, NodeId>();
  const numberToNodeId = new Map<string, NodeId>();

  const lines = body.split(/\r?\n/u);
  let sectionCounter = 0;
  let currentSection = '0';
  let currentSectionTitle = 'Front matter';

  const registerNode = (node: MathNode): void => {
    nodes.push(node);
    const anchor = typeof node.metadata.anchor === 'string' ? node.metadata.anchor : undefined;
    if (anchor) {
      labelToNodeId.set(anchor, node.id);
    }
    if (node.number) {
      numberToNodeId.set(`${node.kind}:${node.number}`, node.id);
    }
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? '';

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/u);
    if (headingMatch) {
      sectionCounter += 1;
      const headingText = headingMatch[2] ?? '';
      const headingLevel = headingMatch[1]?.length ?? 1;
      const { text } = stripAnchorSuffix(headingText);
      currentSection = String(sectionCounter);
      currentSectionTitle = text.trim();
      sections.push({
        section: currentSection,
        title: currentSectionTitle,
        level: headingLevel,
        sourceIndex: index,
      });
      continue;
    }

    if (line.trimStart().startsWith('>')) {
      const blockquote = collectBlockquote(lines, index);
      index += blockquote.consumed - 1;
      const nonEmptyLines = blockquote.content.map((item) => item.trim()).filter(Boolean);
      if (nonEmptyLines.length === 0) {
        continue;
      }

      const header = parseHeader(nonEmptyLines[0] ?? '');
      if (!header) {
        continue;
      }

      const node = createNode(header, nonEmptyLines.slice(1), currentSection, currentSectionTitle, 'blockquote');
      registerNode(node);
      continue;
    }

    const admonitionMatch = line.match(/^:::\s*([A-Za-z_]+)(?:\s+\{#([^}]+)\})?\s*$/u);
    if (admonitionMatch) {
      const admonition = collectAdmonition(lines, index);
      index += admonition.consumed - 1;

      const kindToken = (admonitionMatch[1] ?? '').toLowerCase();
      const fallbackKind = kindFromToken(kindToken);
      if (!fallbackKind) {
        continue;
      }

      const nonEmptyLines = admonition.content.map((item) => item.trim()).filter(Boolean);
      const anchor = admonitionMatch[2];
      const header = parseHeader(nonEmptyLines[0] ?? '', fallbackKind, anchor);
      if (!header) {
        continue;
      }

      const statementLines = header.number || header.title ? nonEmptyLines.slice(1) : nonEmptyLines;
      const node = createNode(header, statementLines, currentSection, currentSectionTitle, 'admonition');
      registerNode(node);
    }
  }

  const mainResult = nodes.find((node) => String(node.metadata.anchor ?? '').includes('main')) ?? nodes.find((node) => node.kind === 'theorem');
  if (mainResult) {
    mainResult.isMainResult = true;
  }

  const edgeKeys = new Set<string>();
  for (const node of nodes) {
    const statement = node.statement;

    FRAGMENT_LINK_RE.lastIndex = 0;
    for (const match of statement.matchAll(FRAGMENT_LINK_RE)) {
      const anchor = match[1];
      if (!anchor) {
        continue;
      }

      const target = labelToNodeId.get(anchor);
      if (!target) {
        continue;
      }

      const key = `${node.id}->${target}->uses_in_proof->explicit_ref`;
      if (edgeKeys.has(key)) {
        continue;
      }
      edgeKeys.add(key);
      edges.push({
        source: node.id,
        target,
        kind: 'uses_in_proof',
        evidence: 'explicit_ref',
        provenance: 'explicit',
        detail: `Explicit markdown link to #${anchor}.`,
        metadata: {
          anchor,
        },
      });
    }

    TEXT_REFERENCE_RE.lastIndex = 0;
    for (const match of statement.matchAll(TEXT_REFERENCE_RE)) {
      const kindToken = (match[1] ?? '').toLowerCase();
      const kind = kindFromToken(kindToken);
      const number = match[2];
      if (!kind || !number) {
        continue;
      }

      const target = numberToNodeId.get(`${kind}:${number}`);
      if (!target) {
        continue;
      }

      const key = `${node.id}->${target}->uses_in_proof->explicit_ref`;
      if (edgeKeys.has(key)) {
        continue;
      }
      edgeKeys.add(key);
      edges.push({
        source: node.id,
        target,
        kind: 'uses_in_proof',
        evidence: 'explicit_ref',
        provenance: 'explicit',
        detail: `Explicit textual reference to ${match[1]} ${number}.`,
        metadata: {
          reference: `${match[1]} ${number}`,
        },
      });
    }
  }

  return {
    input,
    rawText,
    sections,
    nodes,
    edges,
    labelToNodeId,
    metadata,
    diagnostics,
  };
}
