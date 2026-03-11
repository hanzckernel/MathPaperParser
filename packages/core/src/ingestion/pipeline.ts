import { basename, extname, resolve } from 'node:path';
import { existsSync, lstatSync } from 'node:fs';

import { buildBundleFromParsedDocument } from './bundle-builder.js';
import { parseLatexDocument } from './parsers/latex-parser.js';
import { parseAcademicMarkdown } from './parsers/markdown-parser.js';
import type {
  DocumentInput,
  DocumentParser,
  DocumentSourceKind,
  IngestionPipeline,
  PipelineOptions,
  PipelineResult,
} from '../types/pipeline.js';

function detectDocumentSourceKind(inputPath: string): DocumentSourceKind {
  const resolvedPath = resolve(inputPath);

  if (existsSync(resolvedPath) && lstatSync(resolvedPath).isDirectory()) {
    return 'latex';
  }

  const extension = extname(resolvedPath).toLowerCase();
  if (extension === '.md') {
    return 'markdown';
  }
  if (extension === '.pdf') {
    return 'pdf';
  }
  if (extension === '.tex' || extension === '.gz') {
    return 'latex';
  }

  throw new Error(`Unsupported document input: ${inputPath}`);
}

export function createDocumentInput(inputPath: string): DocumentInput {
  const resolvedPath = resolve(inputPath);
  const kind = detectDocumentSourceKind(resolvedPath);
  const isDirectory = existsSync(resolvedPath) && lstatSync(resolvedPath).isDirectory();

  return {
    kind,
    path: resolvedPath,
    displayName: isDirectory ? basename(resolvedPath) : basename(resolvedPath),
    ...(isDirectory ? { entryFile: 'main.tex', sourceFiles: ['main.tex'] } : { sourceFiles: [basename(resolvedPath)] }),
  };
}

class LatexDocumentParser implements DocumentParser {
  readonly kind = 'latex' as const;

  parse(input: DocumentInput) {
    return parseLatexDocument(input);
  }
}

class MarkdownDocumentParser implements DocumentParser {
  readonly kind = 'markdown' as const;

  parse(input: DocumentInput) {
    return parseAcademicMarkdown(input);
  }
}

export class DefaultIngestionPipeline implements IngestionPipeline {
  private readonly parsers: Record<'latex' | 'markdown', DocumentParser> = {
    latex: new LatexDocumentParser(),
    markdown: new MarkdownDocumentParser(),
  };

  analyze(input: DocumentInput, _options?: PipelineOptions): PipelineResult {
    if (input.kind === 'pdf') {
      throw new Error('PDF ingestion is not implemented in alpha yet.');
    }

    const parser = this.parsers[input.kind];
    const parsed = parser.parse(input);
    if (parsed instanceof Promise) {
      throw new Error('Async document parsers are not supported yet.');
    }
    return buildBundleFromParsedDocument(parsed);
  }
}

export function analyzeDocumentPath(inputPath: string, options?: PipelineOptions): PipelineResult {
  const pipeline = new DefaultIngestionPipeline();
  return pipeline.analyze(createDocumentInput(inputPath), options);
}
