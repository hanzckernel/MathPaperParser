import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { BundleSerializer, analyzeDocumentPath } from '@paperparser/core';

import { GraphPage } from '../src/components/dashboard-pages.js';
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
    expect(html).not.toContain('still pending');
  });
});
