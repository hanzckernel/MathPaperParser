import { basename } from 'node:path';

import type { MathEdge } from '../../types/edge.js';
import type { MathNode, NodeId } from '../../types/node.js';
import {
  createEmptyPipelineDiagnostics,
  type DocumentInput,
  type IngestionWarning,
  type ParsedDocument,
  type ParsedDocumentMetadata,
  type PipelineDiagnostics,
} from '../../types/pipeline.js';
import { flattenLatex } from '../flatten/latex-flattener.js';
import { extractFirstLatexCommand } from './latex-command-extractor.js';

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

const KIND_TITLE: Partial<Record<MathNode['kind'], string>> = {
  section: 'Section',
  definition: 'Definition',
  theorem: 'Theorem',
  lemma: 'Lemma',
  proposition: 'Proposition',
  corollary: 'Corollary',
  assumption: 'Assumption',
  remark: 'Remark',
  example: 'Example',
  conjecture: 'Conjecture',
  notation: 'Notation',
  proof: 'Proof',
  equation: 'Equation',
  external_dependency: 'External dependency',
};

const NEW_THEOREM_RE =
  /\\newtheorem(?<star>\*)?\{(?<env>[^}]+)\}(?:\[[^\]]+\])?\{(?<title>[^}]+)\}(?:\[[^\]]+\])?/g;
const BEGIN_ENV_RE = /\\begin\{(?<env>[A-Za-z][A-Za-z0-9*]*)\}\s*(?:\[(?<title>[^\]]+)\])?/u;
const ENV_TOKEN_RE = /\\(?<type>begin|end)\{(?<env>[A-Za-z][A-Za-z0-9*]*)\}(?:\s*\[(?<title>[^\]]+)\])?/gu;
const ABSTRACT_BEGIN_RE = /\\begin\{abstract\}/u;
const ABSTRACT_END_RE = /\\end\{abstract\}/u;
const SECTION_RE = /\\section\*?\{(?<title>[^}]*)\}/u;
const SUBSECTION_RE = /\\subsection\*?\{(?<title>[^}]*)\}/u;
const SUBSUBSECTION_RE = /\\subsubsection\*?\{(?<title>[^}]*)\}/u;
const APPENDIX_RE = /\\appendix\b/u;
const LABEL_RE = /\\label\{(?<label>[^}]+)\}/g;
const REF_RE = /\\(?<command>eqref|ref)\{(?<label>[^}]+)\}/g;
const UNSUPPORTED_REF_RE = /\\(?<command>Cref|cref)\{(?<label>[^}]+)\}/g;
const CITE_RE = /\\cite[a-zA-Z*]*\{(?<keys>[^}]+)\}/g;

interface ParsedReference {
  command: 'eqref' | 'ref';
  label: string;
}

interface UnsupportedParsedReference {
  command: 'Cref' | 'cref';
  label: string;
}

interface EnvSpec {
  kind: MathNode['kind'];
  printedTitle: string;
  numbered: boolean;
  subkind?: string;
}

interface HeadingState {
  appendixMode: boolean;
  sectionIndex: number;
  subsectionIndex: number;
  subsubsectionIndex: number;
  sectionLabel: string;
  sectionTitle: string;
  headingNumber: string;
  headingTitle: string;
  headingPath: string;
}

interface SourceLocation {
  sourcePath?: string;
  sourceLine?: number;
}

interface HeadingEvent {
  level: 1 | 2 | 3;
  number: string;
  title: string;
  path: string;
}

interface NestedEnvironmentBlock {
  envName: string;
  envTitle?: string;
  spec: EnvSpec;
  body: string;
  startIndex: number;
  endIndex: number;
  startLineOffset: number;
  endLineOffset: number;
}

function asNodeId(value: string): NodeId {
  return value as NodeId;
}

function nowIsoUtc(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function stripLineComment(line: string): string {
  let output = '';

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '%') {
      if (index > 0 && line[index - 1] === '\\') {
        output += character;
        continue;
      }

      break;
    }

    output += character;
  }

  return output;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'x';
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

function normalizeLatexInlineText(value: string): string {
  return value
    .replace(/\\protect\b/gu, '')
    .replace(/\\\\/gu, ' ')
    .replace(/~/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
}

function stripSimpleLatexCommands(value: string, commandNames: string[]): string {
  if (commandNames.length === 0) {
    return value;
  }

  const pattern = new RegExp(`\\\\(?:${commandNames.join('|')})\\s*\\{[^{}]*\\}`, 'gu');
  return value.replace(pattern, '');
}

function parseReferenceMatches<TCommand extends string>(
  statement: string,
  expression: RegExp,
): Array<{ command: TCommand; label: string }> {
  return [...statement.matchAll(expression)].flatMap((match) => {
    const command = match.groups?.command?.trim() as TCommand | undefined;
    const labels = (match.groups?.label ?? '')
      .split(',')
      .map((label) => label.trim())
      .filter(Boolean);

    if (!command) {
      return [];
    }

    return labels.map((label) => ({ command, label }));
  });
}

function kindFromPrintedTitle(title: string): EnvSpec | undefined {
  const normalized = title.trim().toLowerCase();

  if (normalized.includes('theorem')) return { kind: 'theorem', printedTitle: title, numbered: true };
  if (normalized.includes('lemma')) return { kind: 'lemma', printedTitle: title, numbered: true };
  if (normalized.includes('proposition')) return { kind: 'proposition', printedTitle: title, numbered: true };
  if (normalized.includes('corollary')) return { kind: 'corollary', printedTitle: title, numbered: true };
  if (normalized.includes('definition')) return { kind: 'definition', printedTitle: title, numbered: true };
  if (normalized.includes('conjecture')) return { kind: 'conjecture', printedTitle: title, numbered: true };
  if (normalized.includes('notation')) return { kind: 'notation', printedTitle: title, numbered: true };
  if (normalized.includes('assumption') || normalized.includes('hypothesis')) {
    return { kind: 'assumption', printedTitle: title, numbered: true };
  }
  if (normalized.includes('remark') || normalized.includes('reminder')) {
    return { kind: 'remark', printedTitle: title, numbered: true, subkind: title.trim() };
  }
  if (normalized.includes('example')) return { kind: 'example', printedTitle: title, numbered: true };
  if (normalized.includes('exercise')) return { kind: 'example', printedTitle: title, numbered: true, subkind: 'exercise' };
  if (normalized.includes('question') || normalized.includes('open') || normalized.includes('problem')) {
    return { kind: 'conjecture', printedTitle: title, numbered: true, subkind: title.trim() };
  }
  if (normalized.includes('algorithm')) return { kind: 'remark', printedTitle: title, numbered: true, subkind: 'algorithm' };

  return undefined;
}

function parseNewtheoremEnvironments(tex: string): Map<string, EnvSpec> {
  const envs = new Map<string, EnvSpec>();

  for (const match of tex.matchAll(NEW_THEOREM_RE)) {
    const env = match.groups?.env?.trim();
    const title = match.groups?.title?.trim();
    if (!env || !title) {
      continue;
    }

    const kindSpec = kindFromPrintedTitle(title);
    if (!kindSpec) {
      continue;
    }

    envs.set(env, {
      ...kindSpec,
      numbered: match.groups?.star === undefined,
    });
  }

  const defaults: Array<[string, MathNode['kind']]> = [
    ['theorem', 'theorem'],
    ['lemma', 'lemma'],
    ['proposition', 'proposition'],
    ['corollary', 'corollary'],
    ['definition', 'definition'],
    ['conjecture', 'conjecture'],
    ['remark', 'remark'],
    ['example', 'example'],
    ['notation', 'notation'],
    ['assumption', 'assumption'],
    ['algorithm', 'remark'],
    ['question', 'conjecture'],
    ['open', 'conjecture'],
    ['exo', 'example'],
  ];

  for (const [env, kind] of defaults) {
    if (!envs.has(env)) {
      envs.set(env, {
        kind,
        printedTitle: KIND_TITLE[kind] ?? env,
        numbered: true,
      });
    }
  }

  return envs;
}

function extractTitleAndAuthors(tex: string): { title: string; authors: string[] } {
  const titleCommand = extractFirstLatexCommand(tex, 'title');
  const authorCommand = extractFirstLatexCommand(tex, 'author');
  const title = titleCommand?.requiredArg ? normalizeLatexInlineText(titleCommand.requiredArg) : 'Untitled (auto-extracted)';
  const authorRaw = authorCommand?.requiredArg ?? '';
  const authors = authorRaw
    .split(/\s+(?:\\\\and|\\and|and)\s+/u)
    .map((author) => stripSimpleLatexCommands(author, ['textsuperscript', 'thanks']))
    .map((author) => author.replace(/[{}]/gu, ''))
    .map((author) => normalizeLatexInlineText(author))
    .filter(Boolean);

  return {
    title,
    authors: authors.length > 0 ? authors : ['Unknown (auto-extracted)'],
  };
}

function extractAbstract(tex: string): string {
  const lines = tex.split(/\r?\n/u);
  let inAbstract = false;
  const output: string[] = [];

  for (const line of lines) {
    const uncommented = stripLineComment(line);
    if (!inAbstract && ABSTRACT_BEGIN_RE.test(uncommented)) {
      inAbstract = true;
      continue;
    }
    if (inAbstract && ABSTRACT_END_RE.test(uncommented)) {
      break;
    }
    if (inAbstract) {
      output.push(uncommented);
    }
  }

  return output.join(' ').replace(/\s+/g, ' ').trim();
}

function extractArxivId(value: string): string | undefined {
  return value.match(/([0-9]{4}\.[0-9]{4,5}(v[0-9]+)?)/u)?.[1];
}

function yearFromArxivId(arxivId?: string): number | undefined {
  if (!arxivId) {
    return undefined;
  }

  const match = arxivId.match(/^(?<yy>[0-9]{2})[0-9]{2}\./u);
  if (!match?.groups?.yy) {
    return undefined;
  }

  return 2000 + Number.parseInt(match.groups.yy, 10);
}

function normalizeHeadingTitle(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function currentSectionNumber(state: HeadingState): string {
  return state.sectionLabel;
}

function currentSubsectionNumber(state: HeadingState): string {
  return `${state.sectionLabel}.${state.subsectionIndex}`;
}

function updateHeading(state: HeadingState, line: string): HeadingEvent | undefined {
  if (APPENDIX_RE.test(line)) {
    state.appendixMode = true;
    state.sectionIndex = 0;
    state.subsectionIndex = 0;
    state.subsubsectionIndex = 0;
    state.sectionLabel = 'A';
    state.sectionTitle = '';
    state.headingNumber = '';
    state.headingTitle = '';
    state.headingPath = '';
    return undefined;
  }

  const sectionMatch = SECTION_RE.exec(line);
  if (sectionMatch?.groups?.title) {
    const title = normalizeHeadingTitle(sectionMatch.groups.title);
    if (state.appendixMode) {
      state.sectionIndex += 1;
      const appendixIndex = state.sectionIndex - 1;
      state.sectionLabel = appendixIndex < 26 ? String.fromCharCode('A'.charCodeAt(0) + appendixIndex) : `App${state.sectionIndex}`;
    } else {
      state.sectionIndex += 1;
      state.sectionLabel = String(state.sectionIndex);
    }

    state.subsectionIndex = 0;
    state.subsubsectionIndex = 0;
    state.sectionTitle = title;
    state.headingNumber = state.sectionLabel;
    state.headingTitle = title;
    state.headingPath = title;
    return {
      level: 1,
      number: state.headingNumber,
      title,
      path: state.headingPath,
    };
  }

  const subsectionMatch = SUBSECTION_RE.exec(line);
  if (subsectionMatch?.groups?.title && state.sectionLabel !== '0') {
    const title = normalizeHeadingTitle(subsectionMatch.groups.title);
    state.subsectionIndex += 1;
    state.subsubsectionIndex = 0;
    state.headingNumber = currentSubsectionNumber(state);
    state.headingTitle = title;
    state.headingPath = state.sectionTitle ? `${state.sectionTitle} / ${title}` : title;
    return {
      level: 2,
      number: state.headingNumber,
      title,
      path: state.headingPath,
    };
  }

  const subsubsectionMatch = SUBSUBSECTION_RE.exec(line);
  if (subsubsectionMatch?.groups?.title && state.sectionLabel !== '0') {
    const title = normalizeHeadingTitle(subsubsectionMatch.groups.title);
    state.subsubsectionIndex += 1;
    const number =
      state.subsectionIndex > 0
        ? `${currentSubsectionNumber(state)}.${state.subsubsectionIndex}`
        : `${currentSectionNumber(state)}.${state.subsubsectionIndex}`;
    state.headingNumber = number;
    state.headingTitle = title;
    state.headingPath =
      state.subsectionIndex > 0 && state.headingTitle
        ? `${state.sectionTitle} / ${title}`
        : state.sectionTitle
          ? `${state.sectionTitle} / ${title}`
          : title;
    return {
      level: 3,
      number,
      title,
      path: state.headingPath,
    };
  }

  return undefined;
}

function createNodeId(section: string, kind: MathNode['kind'], slug: string): NodeId {
  return asNodeId(`sec${section}::${NODE_KIND_TO_ABBREVIATION[kind]}:${slug}`);
}

function uniqueNodeId(existing: Set<string>, baseId: string): NodeId {
  if (!existing.has(baseId)) {
    existing.add(baseId);
    return asNodeId(baseId);
  }

  for (let index = 2; index < 10_000; index += 1) {
    const candidate = `${baseId}-${index}`;
    if (!existing.has(candidate)) {
      existing.add(candidate);
      return asNodeId(candidate);
    }
  }

  throw new Error(`Unable to generate unique node id for ${baseId}`);
}

function missingAssetWarnings(flattened: ReturnType<typeof flattenLatex>): IngestionWarning[] {
  const warnings: IngestionWarning[] = [];

  for (const missingBib of flattened.missingBibs) {
    warnings.push({
      code: 'missing_bibliography',
      severity: 'warning',
      message: `Missing bibliography file: ${missingBib}`,
      phase: 'scan',
      sourcePath: missingBib,
    });
  }

  for (const missingGraphic of flattened.missingGraphics) {
    warnings.push({
      code: 'missing_graphics',
      severity: 'warning',
      message: `Missing graphic include: ${missingGraphic}`,
      phase: 'scan',
      sourcePath: missingGraphic,
    });
  }

  for (const missingInput of flattened.missingInputs) {
    warnings.push({
      code: 'missing_input',
      severity: 'warning',
      message: `Missing input/include: ${missingInput}`,
      phase: 'scan',
      sourcePath: missingInput,
    });
  }

  return warnings;
}

function createDiagnostics(
  flattened: ReturnType<typeof flattenLatex>,
  warnings: IngestionWarning[] = [],
): PipelineDiagnostics {
  return {
    ...createEmptyPipelineDiagnostics('0.2.0'),
    warnings: [...missingAssetWarnings(flattened), ...warnings],
  };
}

function resolveEnvironmentSpec(envName: string, envSpecs: Map<string, EnvSpec>): EnvSpec | undefined {
  if (envName === 'proof') {
    return {
      kind: 'proof',
      printedTitle: 'Proof',
      numbered: false,
    };
  }

  if (
    ['equation', 'align', 'gather', 'multline', 'eqnarray'].includes(envName) ||
    ['equation*', 'align*', 'gather*', 'multline*', 'eqnarray*'].includes(envName)
  ) {
    return {
      kind: 'equation',
      printedTitle: 'Equation',
      numbered: !envName.endsWith('*'),
    };
  }

  return envSpecs.get(envName);
}

function locationFields(start?: SourceLocation, end?: SourceLocation): Pick<MathNode, 'filePath' | 'startLine' | 'endLine'> {
  if (!start?.sourcePath || typeof start.sourceLine !== 'number' || start.sourceLine < 1) {
    return {};
  }

  if (end?.sourcePath === start.sourcePath && typeof end.sourceLine === 'number' && end.sourceLine >= start.sourceLine) {
    return {
      filePath: start.sourcePath,
      startLine: start.sourceLine,
      endLine: end.sourceLine,
    };
  }

  return {
    filePath: start.sourcePath,
    startLine: start.sourceLine,
    endLine: start.sourceLine,
  };
}

function offsetLocation(location: SourceLocation | undefined, lineOffset: number): SourceLocation | undefined {
  if (!location?.sourcePath || typeof location.sourceLine !== 'number') {
    return location;
  }

  return {
    sourcePath: location.sourcePath,
    sourceLine: location.sourceLine + lineOffset,
  };
}

function buildLineStarts(text: string): number[] {
  const starts = [0];

  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === '\n') {
      starts.push(index + 1);
    }
  }

  return starts;
}

function lineOffsetForIndex(lineStarts: number[], index: number): number {
  let low = 0;
  let high = lineStarts.length - 1;
  let best = 0;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const lineStart = lineStarts[mid] ?? 0;
    if (lineStart <= index) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return best;
}

function extractSupportedNestedBlocks(
  text: string,
  envSpecs: Map<string, EnvSpec>,
): { topLevelText: string; blocks: NestedEnvironmentBlock[] } {
  const lineStarts = buildLineStarts(text);
  const blocks: NestedEnvironmentBlock[] = [];
  const stack: Array<{
    envName: string;
    envTitle?: string;
    spec: EnvSpec;
    startIndex: number;
    contentStart: number;
  }> = [];
  const topLevelSegments: string[] = [];
  let topLevelCursor = 0;

  for (const match of text.matchAll(ENV_TOKEN_RE)) {
    const envName = match.groups?.env?.trim();
    const type = match.groups?.type?.trim();
    if (!envName || !type || typeof match.index !== 'number') {
      continue;
    }

    if (type === 'begin') {
      const spec = resolveEnvironmentSpec(envName, envSpecs);
      if (!spec) {
        continue;
      }

      if (stack.length === 0) {
        topLevelSegments.push(text.slice(topLevelCursor, match.index));
      }

      stack.push({
        envName,
        spec,
        startIndex: match.index,
        contentStart: match.index + match[0].length,
        ...(match.groups?.title?.trim() ? { envTitle: match.groups.title.trim() } : {}),
      });
      continue;
    }

    const current = stack.at(-1);
    if (!current || current.envName !== envName) {
      continue;
    }

    stack.pop();
    blocks.push({
      envName: current.envName,
      spec: current.spec,
      body: text.slice(current.contentStart, match.index),
      startIndex: current.startIndex,
      endIndex: match.index + match[0].length,
      startLineOffset: lineOffsetForIndex(lineStarts, current.startIndex),
      endLineOffset: lineOffsetForIndex(lineStarts, match.index + match[0].length),
      ...(current.envTitle ? { envTitle: current.envTitle } : {}),
    });

    if (stack.length === 0) {
      topLevelCursor = match.index + match[0].length;
    }
  }

  if (stack.length > 0) {
    return { topLevelText: text, blocks: [] };
  }

  topLevelSegments.push(text.slice(topLevelCursor));
  return {
    topLevelText: topLevelSegments.join(''),
    blocks: blocks.sort((left, right) => left.startIndex - right.startIndex || left.endIndex - right.endIndex),
  };
}

function createPlaceholderNode(existingIds: Set<string>): MathNode {
  const id = uniqueNodeId(existingIds, 'sec0::rem:no-extracted-theorems');

  return {
    id,
    kind: 'remark',
    label: 'Remark (Auto-generated placeholder)',
    section: '0',
    sectionTitle: 'Front matter',
    number: '',
    latexLabel: null,
    statement: 'No theorem-like environments were extracted from the LaTeX source.',
    proofStatus: 'not_applicable',
    isMainResult: true,
    novelty: 'new',
    metadata: {
      subkind: 'placeholder',
      sourceFormat: 'latex',
    },
  };
}

export function parseLatexDocument(input: DocumentInput): ParsedDocument {
  const flattened = flattenLatex(input.path);
  const rawText = flattened.flatTex;
  const { title, authors } = extractTitleAndAuthors(rawText);
  const abstract = extractAbstract(rawText);
  const arxivId = extractArxivId(input.path) ?? extractArxivId(rawText);
  const year = yearFromArxivId(arxivId) ?? new Date().getUTCFullYear();
  const envSpecs = parseNewtheoremEnvironments(rawText);

  const labelToNodeId = new Map<string, NodeId>();
  const refsByNode = new Map<NodeId, ParsedReference[]>();
  const unsupportedRefsByNode = new Map<NodeId, UnsupportedParsedReference[]>();
  const citesByNode = new Map<NodeId, string[]>();
  const nodeIds = new Set<string>();
  const nodes: MathNode[] = [];
  const edges: MathEdge[] = [];

  const rawLines = rawText.split(/(?<=\n)/u);
  const bodyStartIndex = rawLines.findIndex((line) => line.includes('\\begin{document}'));
  const bodyLines = bodyStartIndex >= 0 ? rawLines.slice(bodyStartIndex) : rawLines;
  const bodyLineMap = bodyStartIndex >= 0 ? flattened.lineMap.slice(bodyStartIndex) : flattened.lineMap;
  const heading: HeadingState = {
    appendixMode: false,
    sectionIndex: 0,
    subsectionIndex: 0,
    subsubsectionIndex: 0,
    sectionLabel: '0',
    sectionTitle: '',
    headingNumber: '',
    headingTitle: '',
    headingPath: '',
  };

  const sectionCounters = new Map<string, number>();
  let inEnvironment = false;
  let envName = '';
  let envTitle: string | undefined;
  let envDepth = 0;
  let capture: string[] = [];
  let captureSection = '0';
  let captureSectionTitle = '';
  let captureHeadingPath = '';
  let captureStartLocation: SourceLocation | undefined;
  let captureEndLocation: SourceLocation | undefined;
  let captureProofTargetId: NodeId | undefined;
  let pendingProofTargetId: NodeId | undefined;
  let pendingSectionNodeId: NodeId | undefined;
  const sectionNodeIds = new Map<string, NodeId>();
  const proofTargetsByNodeId = new Map<NodeId, NodeId>();

  const createSectionNode = (event: HeadingEvent, sourceLocation: SourceLocation | undefined, latexLabel: string | null): NodeId => {
    const sectionId = uniqueNodeId(
      nodeIds,
      createNodeId(
        event.number,
        'section',
        slugify(latexLabel ?? event.title ?? `section-${event.number}`),
      ),
    );
    const sectionNode: MathNode = {
      id: sectionId,
      kind: 'section',
      label: `Section ${event.number}`,
      section: heading.sectionLabel,
      sectionTitle: event.title,
      number: event.number,
      latexLabel,
      statement: event.title || `Section ${event.number}`,
      proofStatus: 'not_applicable',
      isMainResult: false,
      novelty: 'classical',
      metadata: {
        headingLevel: event.level,
        headingPath: event.path,
        topSection: heading.sectionLabel,
        sourceFormat: 'latex',
      },
      ...locationFields(sourceLocation, sourceLocation),
    };

    nodes.push(sectionNode);
    if (event.level === 1) {
      sectionNodeIds.set(heading.sectionLabel, sectionId);
    }

    if (latexLabel) {
      labelToNodeId.set(latexLabel, sectionId);
    }

    return sectionId;
  };

  const registerEnvironmentNode = (params: {
    envName: string;
    envTitle?: string;
    statementRaw: string;
    section: string;
    sectionTitle: string;
    headingPath: string;
    startLocation?: SourceLocation;
    endLocation?: SourceLocation;
    proofTargetId?: NodeId;
    allowProofAttachment?: boolean;
  }): MathNode | undefined => {
    const spec = resolveEnvironmentSpec(params.envName, envSpecs);
    if (!spec) {
      return undefined;
    }

    const { topLevelText, blocks } = extractSupportedNestedBlocks(params.statementRaw, envSpecs);
    const latexLabel = [...topLevelText.matchAll(LABEL_RE)].map((match) => match.groups?.label?.trim()).find(Boolean) ?? null;
    const refs = parseReferenceMatches<ParsedReference['command']>(topLevelText, REF_RE);
    const unsupportedRefs = parseReferenceMatches<UnsupportedParsedReference['command']>(
      topLevelText,
      UNSUPPORTED_REF_RE,
    );
    const citeKeys = [...topLevelText.matchAll(CITE_RE)]
      .flatMap((match) => (match.groups?.keys ?? '').split(','))
      .map((value) => value.trim())
      .filter(Boolean);

    const statement = topLevelText
      .replace(LABEL_RE, '')
      .replace(/\s+\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .trim();

    const counterKey = `${params.section}:${spec.kind}`;
    const nextCount = (sectionCounters.get(counterKey) ?? 0) + 1;
    sectionCounters.set(counterKey, nextCount);
    const number = spec.numbered && params.section !== '0' ? `${params.section}.${nextCount}` : '';
    const slugSource = latexLabel ?? `${spec.kind}-${params.section}-${nextCount}`;
    const slug = slugify(slugSource.replace(/^(thm|lem|prop|cor|def|conj|rem|not|exa)-/u, ''));
    const id = uniqueNodeId(nodeIds, createNodeId(params.section, spec.kind, slug));
    const labelKind = KIND_TITLE[spec.kind] ?? spec.kind;
    const label = `${labelKind} ${number}`.trim() + (params.envTitle ? ` (${params.envTitle.replace(/\s+/g, ' ').trim()})` : '');
    const proofStatus =
      spec.kind === 'proof'
        ? params.envTitle && params.envTitle.toLowerCase().includes('sketch')
          ? 'sketch'
          : 'full'
        : ['section', 'definition', 'assumption', 'notation', 'equation', 'external_dependency'].includes(spec.kind)
          ? 'not_applicable'
          : 'deferred';

    const node: MathNode = {
      id,
      kind: spec.kind,
      label: label.trim(),
      section: params.section,
      sectionTitle: params.sectionTitle,
      number,
      latexLabel,
      statement: statement || `(empty ${labelKind} statement)`,
      proofStatus,
      isMainResult: false,
      novelty: ['section', 'definition', 'notation', 'external_dependency'].includes(spec.kind) ? 'classical' : 'new',
      metadata: {
        env: params.envName,
        headingPath: params.headingPath,
        sourceFormat: 'latex',
        ...(spec.subkind ? { subkind: spec.subkind } : {}),
        ...(refs.length > 0 ? { refLabels: [...new Set(refs.map((ref) => ref.label))].sort() } : {}),
        ...(unsupportedRefs.length > 0
          ? { unsupportedRefLabels: [...new Set(unsupportedRefs.map((ref) => ref.label))].sort() }
          : {}),
        ...(citeKeys.length > 0 ? { citeKeys: [...new Set(citeKeys)].sort() } : {}),
      },
      ...locationFields(params.startLocation, params.endLocation),
    };

    nodes.push(node);
    if (latexLabel) {
      labelToNodeId.set(latexLabel, id);
    }
    refsByNode.set(id, refs);
    unsupportedRefsByNode.set(id, unsupportedRefs);
    citesByNode.set(id, citeKeys);

    if (spec.kind === 'proof' && params.allowProofAttachment !== false && params.proofTargetId) {
      proofTargetsByNodeId.set(id, params.proofTargetId);
      const proofTargetNode = nodes.find((candidate) => candidate.id === params.proofTargetId);
      if (proofTargetNode) {
        proofTargetNode.proofStatus = node.proofStatus;
      }
    }

    for (const block of blocks) {
      const startLocation = offsetLocation(params.startLocation, block.startLineOffset);
      const endLocation = offsetLocation(params.startLocation, block.endLineOffset);
      registerEnvironmentNode({
        envName: block.envName,
        statementRaw: block.body,
        section: params.section,
        sectionTitle: params.sectionTitle,
        headingPath: params.headingPath,
        allowProofAttachment: false,
        ...(block.envTitle ? { envTitle: block.envTitle } : {}),
        ...(startLocation ? { startLocation } : {}),
        ...(endLocation ? { endLocation } : {}),
      });
    }

    return node;
  };

  for (const [lineIndex, rawLine] of bodyLines.entries()) {
    const sourceLocation = bodyLineMap[lineIndex];
    const uncommented = stripLineComment(rawLine);
    const trimmed = uncommented.trim();

    if (!inEnvironment) {
      const headingEvent = updateHeading(heading, uncommented);

      if (headingEvent) {
        const latexLabel = [...uncommented.matchAll(LABEL_RE)].map((match) => match.groups?.label?.trim()).find(Boolean) ?? null;
        const sectionId = createSectionNode(headingEvent, sourceLocation, latexLabel);
        if (latexLabel) {
          pendingSectionNodeId = undefined;
        } else {
          pendingSectionNodeId = sectionId;
        }
      } else if (pendingSectionNodeId && trimmed.startsWith('\\label{')) {
        const latexLabel = [...uncommented.matchAll(LABEL_RE)].map((match) => match.groups?.label?.trim()).find(Boolean) ?? null;
        if (latexLabel) {
          const sectionNode = nodes.find((node) => node.id === pendingSectionNodeId);
          if (sectionNode && !sectionNode.latexLabel) {
            sectionNode.latexLabel = latexLabel;
            labelToNodeId.set(latexLabel, pendingSectionNodeId);
          }
        }
      } else if (pendingSectionNodeId && trimmed) {
        pendingSectionNodeId = undefined;
      }

      const beginMatch = BEGIN_ENV_RE.exec(uncommented);
      const candidateEnv = beginMatch?.groups?.env;
      const beginSpec = candidateEnv ? resolveEnvironmentSpec(candidateEnv, envSpecs) : undefined;
      if (!candidateEnv || !beginSpec) {
        continue;
      }

      inEnvironment = true;
      envName = candidateEnv;
      envTitle = beginMatch.groups?.title?.trim();
      envDepth = 1;
      const remainder = uncommented.slice(beginMatch[0].length);
      capture = [remainder];
      captureSection = heading.sectionLabel;
      captureSectionTitle = heading.sectionTitle;
      captureHeadingPath = heading.headingPath;
      captureStartLocation = sourceLocation;
      captureEndLocation = sourceLocation;
      captureProofTargetId = beginSpec.kind === 'proof' ? pendingProofTargetId : undefined;

      const sameLineEndToken = `\\end{${envName}}`;
      const sameEnvPattern = new RegExp(`\\\\begin\\{${escapeRegExp(envName)}\\}`, 'g');
      const sameEnvEndPattern = new RegExp(`\\\\end\\{${escapeRegExp(envName)}\\}`, 'g');
      const sameLineBeginCount = [...remainder.matchAll(sameEnvPattern)].length;
      const sameLineEndMatches = [...remainder.matchAll(sameEnvEndPattern)];
      envDepth += sameLineBeginCount - sameLineEndMatches.length;

      if (sameLineEndMatches.length > 0 && envDepth <= 0) {
        const closingMatch = sameLineEndMatches.at(-1);
        const closingIndex = typeof closingMatch?.index === 'number' ? closingMatch.index : remainder.indexOf(sameLineEndToken);
        capture = [remainder.slice(0, closingIndex)];
        const node = registerEnvironmentNode({
          envName,
          statementRaw: capture.join(''),
          section: captureSection,
          sectionTitle: captureSectionTitle,
          headingPath: captureHeadingPath,
          ...(envTitle ? { envTitle } : {}),
          ...(captureStartLocation ? { startLocation: captureStartLocation } : {}),
          ...(captureEndLocation ? { endLocation: captureEndLocation } : {}),
          ...(captureProofTargetId ? { proofTargetId: captureProofTargetId } : {}),
        });

        pendingProofTargetId =
          node && !['definition', 'assumption', 'notation', 'external_dependency', 'section', 'proof', 'equation'].includes(node.kind)
            ? node.id
            : undefined;

        inEnvironment = false;
        envName = '';
        envTitle = undefined;
        envDepth = 0;
        capture = [];
        captureStartLocation = undefined;
        captureEndLocation = undefined;
        captureProofTargetId = undefined;
      }
      continue;
    }

    captureEndLocation = sourceLocation;
    const endToken = `\\end{${envName}}`;
    const sameEnvPattern = new RegExp(`\\\\begin\\{${escapeRegExp(envName)}\\}`, 'g');
    const sameEnvEndPattern = new RegExp(`\\\\end\\{${escapeRegExp(envName)}\\}`, 'g');
    const beginMatches = [...uncommented.matchAll(sameEnvPattern)];
    const endMatches = [...uncommented.matchAll(sameEnvEndPattern)];
    const nextDepth = envDepth + beginMatches.length - endMatches.length;

    if (endMatches.length === 0 || nextDepth > 0) {
      envDepth = nextDepth;
      capture.push(uncommented);
      continue;
    }

    const closingMatch = endMatches.at(-1);
    const closingIndex = typeof closingMatch?.index === 'number' ? closingMatch.index : uncommented.indexOf(endToken);
    capture.push(uncommented.slice(0, closingIndex));

    const node = registerEnvironmentNode({
      envName,
      statementRaw: capture.join(''),
      section: captureSection,
      sectionTitle: captureSectionTitle,
      headingPath: captureHeadingPath,
      ...(envTitle ? { envTitle } : {}),
      ...(captureStartLocation ? { startLocation: captureStartLocation } : {}),
      ...(captureEndLocation ? { endLocation: captureEndLocation } : {}),
      ...(captureProofTargetId ? { proofTargetId: captureProofTargetId } : {}),
    });

    pendingProofTargetId =
      node && !['definition', 'assumption', 'notation', 'external_dependency', 'section', 'proof', 'equation'].includes(node.kind)
        ? node.id
        : undefined;

    inEnvironment = false;
    envName = '';
    envTitle = undefined;
    envDepth = 0;
    capture = [];
    captureStartLocation = undefined;
    captureEndLocation = undefined;
    captureProofTargetId = undefined;
  }

  const citationNodeIds = new Map<string, NodeId>();
  for (const citeKey of [...new Set([...citesByNode.values()].flat())].sort()) {
    const citeId = uniqueNodeId(nodeIds, createNodeId('0', 'external_dependency', slugify(citeKey)));
    citationNodeIds.set(citeKey, citeId);
    nodes.push({
      id: citeId,
      kind: 'external_dependency',
      label: `External dependency (${citeKey})`,
      section: '0',
      sectionTitle: 'External dependencies',
      number: '',
      latexLabel: null,
      statement: `Citation key: ${citeKey}`,
      proofStatus: 'not_applicable',
      isMainResult: false,
      novelty: 'classical',
      metadata: {
        citeKey,
        sourceFormat: 'latex',
      },
    });
  }

  const edgeKeys = new Set<string>();
  for (const node of nodes) {
    if (node.kind === 'section' || node.section === '0') {
      continue;
    }

    const sectionNodeId = sectionNodeIds.get(node.section);
    if (!sectionNodeId) {
      continue;
    }

    const edgeKey = `${sectionNodeId}->${node.id}->contains->structural`;
    if (edgeKeys.has(edgeKey)) {
      continue;
    }

    edgeKeys.add(edgeKey);
    edges.push({
      source: sectionNodeId,
      target: node.id,
      kind: 'contains',
      evidence: 'inferred',
      provenance: 'structural',
      detail: `Section ${node.section} contains ${node.label}.`,
      metadata: {},
    });
  }

  for (const [proofNodeId, targetNodeId] of proofTargetsByNodeId.entries()) {
    const edgeKey = `${proofNodeId}->${targetNodeId}->proves->structural`;
    if (edgeKeys.has(edgeKey)) {
      continue;
    }

    edgeKeys.add(edgeKey);
    edges.push({
      source: proofNodeId,
      target: targetNodeId,
      kind: 'proves',
      evidence: 'inferred',
      provenance: 'structural',
      detail: 'Structural proof attachment to the preceding theorem-like statement.',
      metadata: {},
    });
  }

  const diagnosticWarnings: IngestionWarning[] = [];
  for (const node of nodes) {
    for (const ref of refsByNode.get(node.id) ?? []) {
      const target = labelToNodeId.get(ref.label);
      if (!target) {
        diagnosticWarnings.push({
          code: 'unresolved_reference',
          severity: 'warning',
          message: `Unresolved \\${ref.command}{${ref.label}} reference.`,
          phase: 'resolve',
          sourcePath: input.path,
          metadata: {
            command: ref.command,
            label: ref.label,
            sourceNodeId: node.id,
          },
        });
        continue;
      }

      const edgeKey = `${node.id}->${target}->uses_in_proof->explicit_ref`;
      if (edgeKeys.has(edgeKey)) {
        continue;
      }

      edgeKeys.add(edgeKey);
      edges.push({
        source: node.id,
        target,
        kind: 'uses_in_proof',
        evidence: 'explicit_ref',
        provenance: 'explicit',
        detail: `Explicit reference via \\${ref.command}{${ref.label}}.`,
        metadata: {
          latexRef: ref.label,
          latexCommand: ref.command,
        },
      });
    }

    for (const unsupportedRef of unsupportedRefsByNode.get(node.id) ?? []) {
      diagnosticWarnings.push({
        code: 'unsupported_reference_command',
        severity: 'warning',
        message: `Unsupported reference command \\${unsupportedRef.command}{${unsupportedRef.label}}.`,
        phase: 'resolve',
        sourcePath: input.path,
        metadata: {
          command: unsupportedRef.command,
          label: unsupportedRef.label,
          sourceNodeId: node.id,
        },
      });
    }

    for (const citeKey of citesByNode.get(node.id) ?? []) {
      const target = citationNodeIds.get(citeKey);
      if (!target) {
        continue;
      }

      const edgeKey = `${node.id}->${target}->cites_external->external`;
      if (edgeKeys.has(edgeKey)) {
        continue;
      }

      edgeKeys.add(edgeKey);
      edges.push({
        source: node.id,
        target,
        kind: 'cites_external',
        evidence: 'external',
        provenance: 'explicit',
        detail: `Cites \\cite{${citeKey}}.`,
        metadata: {
          citeKey,
        },
      });
    }
  }

  const mainNode =
    nodes.find((node) => node.kind === 'theorem' && ((node.latexLabel ?? '').toLowerCase().includes('main') || node.label.toLowerCase().includes('main'))) ??
    nodes.find((node) => node.kind === 'theorem') ??
    nodes.at(0);

  if (mainNode) {
    mainNode.isMainResult = true;
  } else {
    nodes.push(createPlaceholderNode(nodeIds));
  }

  const metadata: ParsedDocumentMetadata = {
    title,
    authors,
    abstract,
    year,
    subjectArea: 'Unspecified Mathematics',
    versionNote: `Generated from LaTeX source at ${basename(input.path)} on ${nowIsoUtc()}`,
    ...(arxivId ? { arxivId } : {}),
  };

  return {
    input,
    rawText,
    sections: [],
    nodes,
    edges,
    labelToNodeId,
    metadata,
    diagnostics: createDiagnostics(flattened, diagnosticWarnings),
  };
}
