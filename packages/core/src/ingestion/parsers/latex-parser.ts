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
  external_dependency: 'ext',
};

const KIND_TITLE: Partial<Record<MathNode['kind'], string>> = {
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
  external_dependency: 'External dependency',
};

const NEW_THEOREM_RE =
  /\\newtheorem(?<star>\*)?\{(?<env>[^}]+)\}(?:\[[^\]]+\])?\{(?<title>[^}]+)\}(?:\[[^\]]+\])?/g;
const BEGIN_ENV_RE = /\\begin\{(?<env>[A-Za-z][A-Za-z0-9*]*)\}\s*(?:\[(?<title>[^\]]+)\])?/u;
const ABSTRACT_BEGIN_RE = /\\begin\{abstract\}/u;
const ABSTRACT_END_RE = /\\end\{abstract\}/u;
const SECTION_RE = /\\section\*?\{(?<title>[^}]*)\}/u;
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
  sectionLabel: string;
  sectionTitle: string;
  headingPath: string;
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

function updateHeading(state: HeadingState, line: string): void {
  if (APPENDIX_RE.test(line)) {
    state.appendixMode = true;
    state.sectionIndex = 0;
    state.sectionLabel = 'A';
    state.sectionTitle = '';
    state.headingPath = '';
    return;
  }

  const match = SECTION_RE.exec(line);
  if (!match?.groups?.title) {
    return;
  }

  const title = match.groups.title.replace(/\s+/g, ' ').trim();
  if (state.appendixMode) {
    state.sectionIndex += 1;
    const appendixIndex = state.sectionIndex - 1;
    state.sectionLabel = appendixIndex < 26 ? String.fromCharCode('A'.charCodeAt(0) + appendixIndex) : `App${state.sectionIndex}`;
  } else {
    state.sectionIndex += 1;
    state.sectionLabel = String(state.sectionIndex);
  }

  state.sectionTitle = title;
  state.headingPath = title;
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

  const body = rawText.includes('\\begin{document}') ? rawText.slice(rawText.indexOf('\\begin{document}')) : rawText;
  const heading: HeadingState = {
    appendixMode: false,
    sectionIndex: 0,
    sectionLabel: '0',
    sectionTitle: '',
    headingPath: '',
  };

  const sectionCounters = new Map<string, number>();
  let inEnvironment = false;
  let envName = '';
  let envTitle: string | undefined;
  let capture: string[] = [];
  let captureSection = '0';
  let captureSectionTitle = '';
  let captureHeadingPath = '';
  let pendingProofNodeIndex: number | undefined;

  for (const rawLine of body.split(/(?<=\n)/u)) {
    const uncommented = stripLineComment(rawLine);

    if (!inEnvironment) {
      updateHeading(heading, uncommented);

      if (pendingProofNodeIndex !== undefined) {
        const trimmed = uncommented.trim();
        if (trimmed) {
          const pendingNode = nodes[pendingProofNodeIndex];
          if (pendingNode) {
            if (trimmed.startsWith('\\begin{proof}')) {
              pendingNode.proofStatus = 'full';
            } else if (trimmed.startsWith('\\begin{proof}[') && trimmed.toLowerCase().includes('sketch')) {
              pendingNode.proofStatus = 'sketch';
            }
          }
          pendingProofNodeIndex = undefined;
        }
      }

      const beginMatch = BEGIN_ENV_RE.exec(uncommented);
      const candidateEnv = beginMatch?.groups?.env;
      if (!candidateEnv || !envSpecs.has(candidateEnv)) {
        continue;
      }

      inEnvironment = true;
      envName = candidateEnv;
      envTitle = beginMatch.groups?.title?.trim();
      capture = [uncommented.slice(beginMatch[0].length)];
      captureSection = heading.sectionLabel;
      captureSectionTitle = heading.sectionTitle;
      captureHeadingPath = heading.headingPath;
      continue;
    }

    const endToken = `\\end{${envName}}`;
    if (!uncommented.includes(endToken)) {
      capture.push(uncommented);
      continue;
    }

    capture.push(uncommented.slice(0, uncommented.indexOf(endToken)));

    const statementRaw = capture.join('').trim();
    const spec = envSpecs.get(envName);
    if (!spec) {
      inEnvironment = false;
      capture = [];
      envName = '';
      envTitle = undefined;
      continue;
    }

    const latexLabel = [...statementRaw.matchAll(LABEL_RE)].map((match) => match.groups?.label?.trim()).find(Boolean) ?? null;
    const refs = parseReferenceMatches<ParsedReference['command']>(statementRaw, REF_RE);
    const unsupportedRefs = parseReferenceMatches<UnsupportedParsedReference['command']>(
      statementRaw,
      UNSUPPORTED_REF_RE,
    );
    const citeKeys = [...statementRaw.matchAll(CITE_RE)]
      .flatMap((match) => (match.groups?.keys ?? '').split(','))
      .map((value) => value.trim())
      .filter(Boolean);

    const statement = statementRaw
      .replace(LABEL_RE, '')
      .replace(/\s+\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .trim();

    const counterKey = `${captureSection}:${spec.kind}`;
    const nextCount = (sectionCounters.get(counterKey) ?? 0) + 1;
    sectionCounters.set(counterKey, nextCount);
    const number = spec.numbered && captureSection !== '0' ? `${captureSection}.${nextCount}` : '';
    const slugSource = latexLabel ?? `${spec.kind}-${captureSection}-${nextCount}`;
    const slug = slugify(slugSource.replace(/^(thm|lem|prop|cor|def|conj|rem|not|exa)-/u, ''));
    const id = uniqueNodeId(nodeIds, createNodeId(captureSection, spec.kind, slug));
    const labelKind = KIND_TITLE[spec.kind] ?? spec.kind;
    const label = `${labelKind} ${number}`.trim() + (envTitle ? ` (${envTitle.replace(/\s+/g, ' ').trim()})` : '');

    const node: MathNode = {
      id,
      kind: spec.kind,
      label: label.trim(),
      section: captureSection,
      sectionTitle: captureSectionTitle,
      number,
      latexLabel,
      statement: statement || `(empty ${labelKind} statement)`,
      proofStatus: ['definition', 'assumption', 'notation', 'external_dependency'].includes(spec.kind)
        ? 'not_applicable'
        : 'deferred',
      isMainResult: false,
      novelty: spec.kind === 'definition' || spec.kind === 'notation' ? 'classical' : 'new',
      metadata: {
        env: envName,
        headingPath: captureHeadingPath,
        sourceFormat: 'latex',
        ...(spec.subkind ? { subkind: spec.subkind } : {}),
        ...(refs.length > 0 ? { refLabels: [...new Set(refs.map((ref) => ref.label))].sort() } : {}),
        ...(unsupportedRefs.length > 0
          ? { unsupportedRefLabels: [...new Set(unsupportedRefs.map((ref) => ref.label))].sort() }
          : {}),
        ...(citeKeys.length > 0 ? { citeKeys: [...new Set(citeKeys)].sort() } : {}),
      },
    };

    nodes.push(node);
    if (latexLabel) {
      labelToNodeId.set(latexLabel, id);
    }
    refsByNode.set(id, refs);
    unsupportedRefsByNode.set(id, unsupportedRefs);
    citesByNode.set(id, citeKeys);

    pendingProofNodeIndex =
      spec.kind === 'definition' || spec.kind === 'assumption' || spec.kind === 'notation' || spec.kind === 'external_dependency'
        ? undefined
        : nodes.length - 1;

    inEnvironment = false;
    envName = '';
    envTitle = undefined;
    capture = [];
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
