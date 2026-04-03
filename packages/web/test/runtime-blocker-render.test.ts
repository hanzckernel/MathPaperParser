import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { RuntimeBlockerPage } from '../src/components/runtime-blocker.js';

describe('RuntimeBlockerPage', () => {
  it('renders a full-page unsupported static runtime blocker with an exact local-server command', () => {
    const html = renderToStaticMarkup(
      createElement(RuntimeBlockerPage, {
        title: 'Static export requires a local server',
        message:
          'Static dashboard exports must be served over HTTP. Start a local server in the export directory, for example: python3 -m http.server 8000',
      }),
    );

    expect(html).toContain('Static export requires a local server');
    expect(html).toContain('served over HTTP');
    expect(html).toContain('python3 -m http.server 8000');
    expect(html).toContain('data-runtime-blocker="true"');
  });
});
