import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  ConsistencyChecker,
  SchemaValidator,
  analyzeDocumentPath,
} from '../src/index.js';

describe('gold paper latex ingestion', () => {
  it('analyzes the real gold paper with trustworthy front matter', () => {
    const fixturePath = resolve(process.cwd(), 'ref/papers/long_nalini/arXiv-2502.12268v2/main.tex');
    const result = analyzeDocumentPath(fixturePath);
    const warningCodes = result.diagnostics.warnings.map((warning) => warning.code);

    expect(result.input.kind).toBe('latex');
    expect(result.manifest.paper.title).toContain('Friedman--Ramanujan functions');
    expect(result.manifest.paper.title).toContain('random hyperbolic geometry');
    expect(result.manifest.paper.title).toContain('spectral gaps II');
    expect(result.manifest.paper.authors).toEqual(
      expect.arrayContaining(['Nalini Anantharaman', 'Laura Monk']),
    );
    expect(
      result.graph.nodes.some((node) =>
        ['definition', 'theorem', 'lemma', 'proposition', 'corollary'].includes(node.kind),
      ),
    ).toBe(true);
    expect(warningCodes).not.toContain('missing_input');

    expect(() => new SchemaValidator().validateBundle(result)).not.toThrow();
    expect(() => ConsistencyChecker.checkBundle(result)).not.toThrow();
  });
});
