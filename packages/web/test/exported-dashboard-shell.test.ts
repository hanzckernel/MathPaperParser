import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const EXPORTED_DASHBOARD_HTML = [
  'ref/runs/short_petri/parser-run/dashboard/index.html',
  'ref/runs/medium_mueller/parser-run/dashboard/index.html',
  'ref/runs/long_nalini/parser-run/dashboard/index.html',
  'ref/runs/ms_nextstage/parser-run/dashboard/index.html',
];

const SUPPORTED_SAMPLE_EXPORTS = [
  'ref/runs/short_petri/parser-run/dashboard',
  'ref/runs/medium_mueller/parser-run/dashboard',
  'ref/runs/long_nalini/parser-run/dashboard',
];

describe('exported dashboard shell', () => {
  it('mounts the React app into the root container', async () => {
    for (const relativePath of EXPORTED_DASHBOARD_HTML) {
      const html = await readFile(resolve(process.cwd(), relativePath), 'utf8');

      expect(html, relativePath).toContain('<div id="root"></div>');
      expect(html, relativePath).not.toContain('<div id="app"></div>');
    }
  });

  it('keeps the checked-in TeX sample exports aligned with the current static dashboard contract', async () => {
    for (const relativeDir of SUPPORTED_SAMPLE_EXPORTS) {
      const html = await readFile(resolve(process.cwd(), relativeDir, 'index.html'), 'utf8');
      const enrichment = await readFile(resolve(process.cwd(), relativeDir, 'data', 'enrichment.json'), 'utf8');
      const assets = await readdir(resolve(process.cwd(), relativeDir, 'assets'));
      const appBundles = assets.filter((entry) => /^index-.*\.js$/u.test(entry));
      const mathBundles = assets.filter((entry) => /^tex-chtml-nofont-.*\.js$/u.test(entry));

      expect(html, relativeDir).not.toContain('katex');
      expect(html, relativeDir).not.toContain('fonts.googleapis.com');
      expect(appBundles, relativeDir).toHaveLength(1);
      expect(mathBundles, relativeDir).toHaveLength(1);
      expect(assets.filter((entry) => entry.endsWith('.css')), relativeDir).toHaveLength(0);
      expect(enrichment.trim(), relativeDir).toBe('null');
    }
  });
});
