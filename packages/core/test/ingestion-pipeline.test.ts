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

  it('extracts front matter from optional title arguments and nested author commands', () => {
    const fixturePath = resolve(process.cwd(), 'packages/core/test/fixtures/latex/gold-paper-regressions/front-matter.tex');
    const result = analyzeDocumentPath(fixturePath);

    expect(result.manifest.paper.title).toContain('Friedman--Ramanujan functions');
    expect(result.manifest.paper.title).toContain('random hyperbolic geometry');
    expect(result.manifest.paper.title).toContain('spectral gaps II');
    expect(result.manifest.paper.authors).toEqual(['Nalini Anantharaman', 'Laura Monk']);
    expect(result.diagnostics.warnings).toEqual([]);
  });

  it('emits explicit diagnostics for unresolved and unsupported reference commands', () => {
    const fixturePath = resolve(process.cwd(), 'packages/core/test/fixtures/latex/gold-paper-regressions/unsupported-refs.tex');
    const result = analyzeDocumentPath(fixturePath);
    const unresolvedWarnings = result.diagnostics.warnings.filter((warning) => warning.code === 'unresolved_reference');
    const unsupportedWarnings = result.diagnostics.warnings.filter(
      (warning) => warning.code === 'unsupported_reference_command',
    );

    expect(unresolvedWarnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          metadata: expect.objectContaining({ command: 'ref', label: 'thm:missing' }),
        }),
        expect.objectContaining({
          metadata: expect.objectContaining({ command: 'eqref', label: 'eq:missing' }),
        }),
      ]),
    );
    expect(unsupportedWarnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          metadata: expect.objectContaining({ command: 'cref', label: 'thm:main' }),
        }),
        expect.objectContaining({
          metadata: expect.objectContaining({ command: 'Cref', label: 'thm:main' }),
        }),
      ]),
    );
  });

  it('emits explicit diagnostics for missing required TeX includes', () => {
    const fixturePath = resolve(process.cwd(), 'packages/core/test/fixtures/latex/gold-paper-regressions/missing-input.tex');
    const result = analyzeDocumentPath(fixturePath);

    expect(result.diagnostics.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'missing_input',
          sourcePath: 'sections/missing-section',
        }),
      ]),
    );
  });

  it('extracts canonical section, proof, and equation objects with structural relations and anchors', () => {
    const fixturePath = resolve(process.cwd(), 'packages/core/test/fixtures/latex/canonical-objects/main.tex');
    const result = analyzeDocumentPath(fixturePath);

    const sectionNode = result.graph.nodes.find((node) => String(node.kind) === 'section');
    const definitionNode = result.graph.nodes.find((node) => node.latexLabel === 'def:base');
    const lemmaNode = result.graph.nodes.find((node) => node.latexLabel === 'lem:key');
    const propositionNode = result.graph.nodes.find((node) => node.latexLabel === 'prop:key');
    const theoremNode = result.graph.nodes.find((node) => node.latexLabel === 'thm:main');
    const proofNode = result.graph.nodes.find((node) => String(node.kind) === 'proof');
    const corollaryNode = result.graph.nodes.find((node) => node.latexLabel === 'cor:main');
    const equationNode = result.graph.nodes.find((node) => String(node.kind) === 'equation' && node.latexLabel === 'eq:key');
    const citationNode = result.graph.nodes.find(
      (node) => String(node.kind) === 'external_dependency' && node.metadata.citeKey === 'Foundations',
    );

    expect(sectionNode).toBeDefined();
    expect(definitionNode).toBeDefined();
    expect(lemmaNode).toBeDefined();
    expect(propositionNode).toBeDefined();
    expect(proofNode).toBeDefined();
    expect(corollaryNode).toBeDefined();
    expect(equationNode).toBeDefined();
    expect(citationNode).toBeDefined();
    expect(theoremNode).toEqual(
      expect.objectContaining({
        filePath: expect.stringContaining('canonical-objects/main.tex'),
        startLine: expect.any(Number),
        endLine: expect.any(Number),
      }),
    );
    expect(
      result.graph.edges.some(
        (edge) =>
          String(edge.kind) === 'contains' &&
          edge.source === sectionNode?.id &&
          edge.target === theoremNode?.id &&
          (edge as { provenance?: string }).provenance === 'structural',
      ),
    ).toBe(true);
    expect(
      result.graph.edges.some(
        (edge) =>
          String(edge.kind) === 'contains' &&
          edge.source === sectionNode?.id &&
          edge.target === proofNode?.id &&
          (edge as { provenance?: string }).provenance === 'structural',
      ),
    ).toBe(true);
    expect(
      result.graph.edges.some(
        (edge) =>
          String(edge.kind) === 'contains' &&
          edge.source === sectionNode?.id &&
          edge.target === definitionNode?.id &&
          (edge as { provenance?: string }).provenance === 'structural',
      ),
    ).toBe(true);
    expect(
      result.graph.edges.some(
        (edge) =>
          String(edge.kind) === 'proves' &&
          edge.source === proofNode?.id &&
          edge.target === theoremNode?.id &&
          (edge as { provenance?: string }).provenance === 'structural',
      ),
    ).toBe(true);
    expect(
      result.graph.edges.some(
        (edge) =>
          edge.kind === 'uses_in_proof' &&
          edge.source === theoremNode?.id &&
          edge.target === equationNode?.id &&
          (edge as { provenance?: string }).provenance === 'explicit' &&
          edge.evidence === 'explicit_ref' &&
          (edge.metadata as { latexRef?: string }).latexRef === 'eq:key',
      ),
    ).toBe(true);
    expect(
      result.graph.edges.some(
        (edge) =>
          edge.kind === 'uses_in_proof' &&
          edge.source === theoremNode?.id &&
          edge.target === propositionNode?.id &&
          (edge as { provenance?: string }).provenance === 'explicit' &&
          edge.evidence === 'explicit_ref' &&
          (edge.metadata as { latexRef?: string }).latexRef === 'prop:key',
      ),
    ).toBe(true);
    expect(
      result.graph.edges.some(
        (edge) =>
          edge.kind === 'cites_external' &&
          edge.source === propositionNode?.id &&
          edge.target === citationNode?.id &&
          (edge as { provenance?: string }).provenance === 'explicit' &&
          edge.evidence === 'external' &&
          (edge.metadata as { citeKey?: string }).citeKey === 'Foundations',
      ),
    ).toBe(true);
  });
});
