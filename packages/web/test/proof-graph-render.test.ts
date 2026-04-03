import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { BundleSerializer, EnrichmentSerializer, analyzeDocumentPath, createHeuristicEnrichment } from '@paperparser/core';

import { ExplorerPage, GraphPage } from '../src/components/dashboard-pages.js';
import { buildDashboardModel } from '../src/lib/dashboard-model.js';

describe('GraphPage', () => {
  it.each([
    {
      fixturePath: 'packages/core/test/fixtures/markdown/paper.md',
      selectedNodeId: 'sec1::thm:thm-main',
      expectedLabel: 'Theorem 2.1',
    },
    {
      fixturePath: 'packages/core/test/fixtures/latex/project/main.tex',
      selectedNodeId: 'sec1::thm:thm-fixture',
      expectedLabel: 'Theorem 1.1',
    },
  ])('renders an interactive graph/detail view for $fixturePath', ({ fixturePath, selectedNodeId, expectedLabel }) => {
    const bundle = BundleSerializer.toJsonBundle(analyzeDocumentPath(resolve(process.cwd(), fixturePath)));
    const model = buildDashboardModel(bundle);

    const html = renderToStaticMarkup(
      createElement(GraphPage, {
        model,
        selectedNodeId,
        onSelectNode: () => {},
      }),
    );

    expect(html).toContain('<svg');
    expect(html).toContain('Search graph');
    expect(html).toContain(expectedLabel);
    expect(html).toContain('data-math-render="typeset"');
    expect(html).toContain('data-math-surface="graph-detail-statement"');
    expect(html).not.toContain('still pending');
  });

  it('routes theorem explorer statements through the shared math rendering wrapper', () => {
    const bundle = BundleSerializer.toJsonBundle(analyzeDocumentPath(resolve(process.cwd(), 'packages/core/test/fixtures/markdown/paper.md')));
    const model = buildDashboardModel(bundle);

    const html = renderToStaticMarkup(
      createElement(ExplorerPage, {
        model,
        selectedNodeId: 'sec1::thm:thm-main',
        onSelectNode: () => {},
      }),
    );

    expect(html).toContain('Theorem Explorer');
    expect(html).toContain('data-math-render="typeset"');
    expect(html).toContain('data-math-surface="explorer-statement"');
    expect(html).toContain('Let $T$ be compact.');
  });

  it('renders filter controls for expanded canonical kinds', () => {
    const fixturePath = resolve(process.cwd(), 'packages/core/test/fixtures/latex/canonical-objects/main.tex');
    const bundle = BundleSerializer.toJsonBundle(analyzeDocumentPath(fixturePath));
    const theoremNodeId = bundle.graph.nodes.find((node) => node.latex_label === 'thm:main')?.id ?? null;
    const model = buildDashboardModel(bundle);

    const html = renderToStaticMarkup(
      createElement(GraphPage, {
        model,
        selectedNodeId: theoremNodeId,
        onSelectNode: () => {},
      }),
    );

    expect(html).toContain('section');
    expect(html).toContain('proof');
    expect(html).toContain('equation');
  });

  it('renders a structured explanation for the selected dependency edge', () => {
    const fixturePath = resolve(process.cwd(), 'packages/core/test/fixtures/latex/canonical-objects/main.tex');
    const bundle = BundleSerializer.toJsonBundle(analyzeDocumentPath(fixturePath));
    const theoremNodeId = bundle.graph.nodes.find((node) => node.latex_label === 'thm:main')?.id ?? null;
    const model = buildDashboardModel(bundle);

    const html = renderToStaticMarkup(
      createElement(GraphPage, {
        model,
        selectedNodeId: theoremNodeId,
        onSelectNode: () => {},
      }),
    );

    expect(html).toContain('Edge Explanation');
    expect(html).toContain('Why This Edge Exists');
    expect(html).toContain('Provenance');
    expect(html).toContain('explicit');
    expect(html).toContain('Evidence');
    expect(html).toContain('explicit_ref');
    expect(html).toContain('latexRef');
  });

  it('keeps agent-inferred edges hidden by default and can render their review metadata when enabled', () => {
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
    const selectedNodeId = 'sec1::thm:thm-main';
    const selectedAgentEdgeKey = 'sec1::thm:thm-main::sec1::lem:lem-key::uses_in_proof::inferred::agent_inferred';

    const defaultHtml = renderToStaticMarkup(
      createElement(GraphPage, {
        model,
        selectedNodeId,
        onSelectNode: () => {},
      }),
    );

    expect(defaultHtml).toContain('agent_inferred');
    expect(defaultHtml).not.toContain('Confidence');

    const enrichedHtml = renderToStaticMarkup(
      createElement(GraphPage, {
        model,
        selectedNodeId,
        onSelectNode: () => {},
        initialVisibleProvenance: ['explicit', 'structural', 'agent_inferred'],
        initialSelectedEdgeKey: selectedAgentEdgeKey,
      }),
    );

    expect(enrichedHtml).toContain('Confidence');
    expect(enrichedHtml).toContain('Review Status');
    expect(enrichedHtml).toContain('providerAgent');
    expect(enrichedHtml).toContain('agent_inferred');
  });
});
