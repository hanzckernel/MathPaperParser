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

  it('hardens the accepted milestone corpus without hiding explicit residual diagnostics', () => {
    const longNaliniPath = resolve(process.cwd(), 'ref/papers/long_nalini/arXiv-2502.12268v2/main.tex');
    const mediumMuellerPath = resolve(process.cwd(), 'ref/papers/medium_Mueller.flat.tex');
    const shortPetriPath = resolve(process.cwd(), 'ref/papers/short_Petri.tex');

    const longNalini = analyzeDocumentPath(longNaliniPath);
    const mediumMueller = analyzeDocumentPath(mediumMuellerPath);
    const shortPetri = analyzeDocumentPath(shortPetriPath);

    const longUnresolved = longNalini.diagnostics.warnings.filter((warning) => warning.code === 'unresolved_reference');
    const longUnsupported = longNalini.diagnostics.warnings.filter(
      (warning) => warning.code === 'unsupported_reference_command',
    );
    const mediumUnresolved = mediumMueller.diagnostics.warnings.filter(
      (warning) => warning.code === 'unresolved_reference',
    );
    const shortUnresolved = shortPetri.diagnostics.warnings.filter((warning) => warning.code === 'unresolved_reference');

    expect(longUnresolved.length).toBeLessThan(25);
    expect(longUnsupported).toHaveLength(2);
    expect(mediumUnresolved).toEqual([]);
    expect(shortUnresolved).toEqual([]);
    expect(shortPetri.diagnostics.warnings.map((warning) => warning.code)).toEqual([
      'missing_bibliography',
      'missing_graphics',
      'missing_graphics',
      'missing_graphics',
      'missing_graphics',
    ]);

    expect(() => new SchemaValidator().validateBundle(longNalini)).not.toThrow();
    expect(() => ConsistencyChecker.checkBundle(longNalini)).not.toThrow();
    expect(() => new SchemaValidator().validateBundle(mediumMueller)).not.toThrow();
    expect(() => ConsistencyChecker.checkBundle(mediumMueller)).not.toThrow();
    expect(() => new SchemaValidator().validateBundle(shortPetri)).not.toThrow();
    expect(() => ConsistencyChecker.checkBundle(shortPetri)).not.toThrow();
  });
});
