import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { BundleQueryService, analyzeDocumentPath } from '../src/index.js';

describe('BundleQueryService', () => {
  it('returns deterministic keyword hits for theorem-like nodes', () => {
    const fixturePath = resolve(process.cwd(), 'packages/core/test/fixtures/markdown/paper.md');
    const bundle = analyzeDocumentPath(fixturePath);
    const service = new BundleQueryService(bundle);

    const results = service.search({
      text: 'compact main result',
      limit: 2,
    });

    expect(results).toHaveLength(2);
    expect(results[0]?.nodeId).toBe('sec1::thm:thm-main');
    expect(results[0]?.mode).toBe('keyword');
    expect(results[0]?.matchedText).toContain('Theorem 2.1');
    expect(results[0]?.nodeKind).toBe('theorem');
    expect(results[0]?.label).toContain('Theorem 2.1');
    expect(results[0]?.number).toBe('2.1');
    expect(results[0]?.section).toBe('1');
  });

  it('matches object identity fields such as theorem numbers and latex labels', () => {
    const fixturePath = resolve(process.cwd(), 'packages/core/test/fixtures/latex/project/main.tex');
    const bundle = analyzeDocumentPath(fixturePath);
    const service = new BundleQueryService(bundle);

    const numberResults = service.search({
      text: '1.1',
      limit: 1,
    });
    expect(numberResults[0]?.nodeId).toBe('sec1::thm:thm-fixture');
    expect(numberResults[0]?.number).toBe('1.1');

    const latexLabelResults = service.search({
      text: 'thm:fixture',
      limit: 1,
    });
    expect(latexLabelResults[0]?.nodeId).toBe('sec1::thm:thm-fixture');
    expect(latexLabelResults[0]?.latexLabel).toBe('thm:fixture');
  });

  it('returns node context and reverse impact from the stored graph structure', () => {
    const fixturePath = resolve(process.cwd(), 'packages/core/test/fixtures/markdown/paper.md');
    const bundle = analyzeDocumentPath(fixturePath);
    const service = new BundleQueryService(bundle);

    const context = service.getContext('sec2::lem:lem-bounded');
    expect(context.node.id).toBe('sec2::lem:lem-bounded');
    expect(context.outgoingEdges).toHaveLength(1);
    expect(context.outgoingEdges[0]?.target).toBe('sec1::thm:thm-main');
    expect(context.dependencyChain.map((node) => node.id)).toEqual(['sec1::thm:thm-main']);
    expect(context.sectionSummary?.section).toBe('2');
    expect(context.clusterIds).toEqual(['cluster:section-2']);

    const impact = service.getImpact('sec1::thm:thm-main');
    expect(impact.node.id).toBe('sec1::thm:thm-main');
    expect(impact.incomingEdges).toHaveLength(1);
    expect(impact.dependentNodes.map((node) => node.id)).toEqual(['sec2::lem:lem-bounded']);
    expect(impact.impactedMainResults).toEqual([]);
  });

  it('keeps structural edges visible in context but excludes them from dependency and impact traversal', () => {
    const fixturePath = resolve(process.cwd(), 'packages/core/test/fixtures/latex/project/main.tex');
    const bundle = analyzeDocumentPath(fixturePath);
    const service = new BundleQueryService(bundle);

    const context = service.getContext('sec1::thm:thm-fixture');
    expect(context.incomingEdges.some((edge) => edge.kind === 'contains')).toBe(true);
    expect(context.dependencyChain).toEqual([]);

    const impact = service.getImpact('sec1::thm:thm-fixture');
    expect(impact.incomingEdges).toEqual([]);
    expect(impact.dependentNodes).toEqual([]);
  });
});
