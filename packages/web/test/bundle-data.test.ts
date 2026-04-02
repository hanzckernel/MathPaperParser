import { resolve } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { BundleSerializer, EnrichmentSerializer, analyzeDocumentPath, createHeuristicEnrichment } from '@paperparser/core';

import { buildDashboardModel } from '../src/lib/dashboard-model.js';
import { loadSerializedBundle, resolveBundleSource } from '../src/lib/data-source.js';

describe('web bundle data source', () => {
  it('defaults to static exported bundle loading and resolves API mode from search params', () => {
    expect(resolveBundleSource('')).toEqual({
      kind: 'static',
      basePath: './data',
    });

    expect(resolveBundleSource('?api=http://localhost:3000&paper=fixture-markdown')).toEqual({
      kind: 'api',
      baseUrl: 'http://localhost:3000',
      paperId: 'fixture-markdown',
    });
  });

  it('loads a static bundle from manifest/graph/index files', async () => {
    const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>();
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ schema_version: '0.2.0', paper: { title: 'Static Title' } }), { status: 200 }),
    );
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ schema_version: '0.2.0', nodes: [], edges: [] }), { status: 200 }),
    );
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ schema_version: '0.2.0', main_results: [], stats: {} }), { status: 200 }),
    );
    fetchMock.mockResolvedValueOnce(new Response('not found', { status: 404, statusText: 'Not Found' }));

    const bundle = await loadSerializedBundle(
      {
        kind: 'static',
        basePath: '/export/data',
      },
      fetchMock as typeof fetch,
    );

    expect(bundle.manifest.paper.title).toBe('Static Title');
    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      '/export/data/manifest.json',
      '/export/data/graph.json',
      '/export/data/index.json',
      '/export/data/enrichment.json',
    ]);
  });

  it('builds a dashboard model from a serialized bundle', () => {
    const fixturePath = resolve(process.cwd(), 'packages/core/test/fixtures/markdown/paper.md');
    const bundle = BundleSerializer.toJsonBundle(analyzeDocumentPath(fixturePath));

    const model = buildDashboardModel(bundle);

    expect(model.title).toBe('Academic Markdown Fixture');
    expect(model.sourceType).toBe('markdown');
    expect(model.mainResults[0]?.nodeId).toBe('sec1::thm:thm-main');
    expect(model.mainResults[0]?.label).toContain('Theorem 2.1');
    expect(model.sections.map((section) => section.section)).toEqual(['1', '2']);
    expect(model.sectionCount).toBe(2);
  });

  it('builds a dashboard model from a latex bundle', () => {
    const fixturePath = resolve(process.cwd(), 'packages/core/test/fixtures/latex/project/main.tex');
    const bundle = BundleSerializer.toJsonBundle(analyzeDocumentPath(fixturePath));

    const model = buildDashboardModel(bundle);

    expect(model.title).toBe('Tracked LaTeX Fixture');
    expect(model.sourceType).toBe('latex');
    expect(model.mainResults[0]?.nodeId).toBe('sec1::thm:thm-fixture');
    expect(model.sections.map((section) => section.section)).toEqual(['1']);
    expect(model.nodes.some((node) => node.latex_label === 'thm:fixture')).toBe(true);
  });

  it('preserves expanded canonical kinds and provenance in the dashboard model', () => {
    const fixturePath = resolve(process.cwd(), 'packages/core/test/fixtures/latex/canonical-objects/main.tex');
    const bundle = BundleSerializer.toJsonBundle(analyzeDocumentPath(fixturePath));

    const model = buildDashboardModel(bundle);

    expect(model.nodes.some((node) => String(node.kind) === 'section')).toBe(true);
    expect(model.nodes.some((node) => String(node.kind) === 'proof')).toBe(true);
    expect(model.nodes.some((node) => String(node.kind) === 'equation')).toBe(true);
    expect(model.edges.some((edge) => (edge as { provenance?: string }).provenance === 'structural')).toBe(true);
    expect(
      model.edges.some(
        (edge) =>
          edge.kind === 'cites_external' &&
          (edge as { provenance?: string }).provenance === 'explicit' &&
          (edge.metadata as { citeKey?: string }).citeKey === 'Foundations',
      ),
    ).toBe(true);
  });

  it('merges optional enrichment edges into the dashboard model without dropping deterministic edges', () => {
    const fixturePath = resolve(process.cwd(), 'packages/core/test/fixtures/latex/canonical-objects/main.tex');
    const bundle = analyzeDocumentPath(fixturePath);
    const serializedBundle = BundleSerializer.toJsonBundle(bundle);
    const serializedEnrichment = EnrichmentSerializer.toJsonArtifact(
      createHeuristicEnrichment(bundle, {
        paperId: 'fixture-canonical',
        createdAt: '2026-04-02T12:00:00Z',
      }),
    );

    const model = buildDashboardModel(serializedBundle, serializedEnrichment);

    expect(model.edges.some((edge) => (edge as { provenance?: string }).provenance === 'structural')).toBe(true);
    expect(
      model.edges.some(
        (edge) =>
          (edge as { provenance?: string }).provenance === 'agent_inferred' &&
          typeof (edge as { confidence?: number }).confidence === 'number' &&
          (edge as { review_status?: string }).review_status === 'pending',
      ),
    ).toBe(true);
  });
});
