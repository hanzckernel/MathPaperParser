import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const EXPORTED_DASHBOARD_HTML = [
  'ref/runs/short_petri/parser-run/dashboard/index.html',
  'ref/runs/medium_mueller/parser-run/dashboard/index.html',
  'ref/runs/long_nalini/parser-run/dashboard/index.html',
  'ref/runs/ms_nextstage/parser-run/dashboard/index.html',
];

describe('exported dashboard shell', () => {
  it('mounts the React app into the root container', async () => {
    for (const relativePath of EXPORTED_DASHBOARD_HTML) {
      const html = await readFile(resolve(process.cwd(), relativePath), 'utf8');

      expect(html, relativePath).toContain('<div id="root"></div>');
      expect(html, relativePath).not.toContain('<div id="app"></div>');
    }
  });
});
