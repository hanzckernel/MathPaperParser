import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { BundleDataControls } from '../src/components/data-controls.js';

describe('BundleDataControls', () => {
  it('renders api-backed paper selection and upload guidance', () => {
    const html = renderToStaticMarkup(
      createElement(BundleDataControls, {
        sourceKind: 'api',
        apiBaseUrl: 'http://localhost:3000',
        selectedPaperId: 'fixture-markdown',
        apiListing: {
          latestPaperId: 'fixture-markdown',
          papers: [
            {
              paperId: 'fixture-markdown',
              title: 'Academic Markdown Fixture',
              sourceType: 'markdown',
              year: 2026,
              isLatest: true,
            },
            {
              paperId: 'fixture-latex',
              title: 'Tracked LaTeX Fixture',
              sourceType: 'latex',
              year: 2026,
              isLatest: false,
            },
          ],
        },
        uploadStatus: 'idle',
        uploadMessage: null,
        onRefreshPapers: () => {},
        onSelectedPaperChange: () => {},
        onPaperIdInputChange: () => {},
        pendingPaperId: 'uploaded-paper',
        onUploadFileChange: () => {},
        searchQuery: 'thm',
        searchResults: [
          {
            nodeId: 'sec1::thm:thm-main',
            nodeKind: 'theorem',
            label: 'Theorem 2.1',
            number: '2.1',
            section: '1',
            sectionTitle: 'Compactness',
            latexLabel: 'thm:thm-main',
            matchedText: 'Theorem 2.1',
            excerpt: 'Compactness theorem excerpt',
            href: '#/explorer/sec1%3A%3Athm%3Athm-main',
          },
        ],
        onSearchQueryChange: () => {},
      }),
    );

    expect(html).toContain('API Mode');
    expect(html).toContain('fixture-markdown');
    expect(html).toContain('Tracked LaTeX Fixture');
    expect(html).toContain('Upload .tex or .md');
    expect(html).toContain('PDF upload stays visible');
    expect(html).toContain('Search this paper');
    expect(html).toContain('Open in Explorer');
    expect(html).toContain('Compactness theorem excerpt');
  });
});
