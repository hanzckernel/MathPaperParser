import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  ConsistencyChecker,
  SchemaValidator,
  analyzeDocumentPath,
} from '../src/index.js';

describe('analyzeDocumentPath', () => {
  it('builds a schema-valid markdown bundle from the tracked fixture', () => {
    const fixturePath = resolve(process.cwd(), 'packages/core/test/fixtures/markdown/paper.md');
    const result = analyzeDocumentPath(fixturePath);

    expect(result.input.kind).toBe('markdown');
    expect(result.manifest.schemaVersion).toBe('0.2.0');
    expect(result.manifest.paper.sourceType).toBe('markdown');
    expect(result.manifest.paper.sourceFiles).toEqual(['paper.md']);
    expect(result.graph.nodes.some((node) => node.kind === 'theorem')).toBe(true);
    expect(result.index.mainResults).toHaveLength(1);
    expect(result.diagnostics.warnings).toEqual([]);

    expect(() => new SchemaValidator().validateBundle(result)).not.toThrow();
    expect(() => ConsistencyChecker.checkBundle(result)).not.toThrow();
  });

  it('builds a schema-valid latex bundle and preserves missing-asset diagnostics', () => {
    const fixturePath = resolve(process.cwd(), 'packages/core/test/fixtures/latex/project/main.tex');
    const result = analyzeDocumentPath(fixturePath);

    expect(result.input.kind).toBe('latex');
    expect(result.manifest.paper.sourceType).toBe('latex');
    expect(result.manifest.paper.sourceFiles).toEqual(['main.tex']);
    expect(result.graph.nodes.some((node) => node.latexLabel === 'thm:fixture')).toBe(true);
    expect(result.diagnostics.warnings.map((warning) => warning.code)).toEqual([
      'missing_bibliography',
      'missing_graphics',
    ]);

    expect(() => new SchemaValidator().validateBundle(result)).not.toThrow();
    expect(() => ConsistencyChecker.checkBundle(result)).not.toThrow();
  });
});
