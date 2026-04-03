import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('milestone acceptance proof and operator guidance docs', () => {
  it('publishes a dedicated v1.2 acceptance command at the repo root', async () => {
    const packageJson = JSON.parse(
      await readFile(resolve(process.cwd(), 'package.json'), 'utf8'),
    ) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts?.['test:acceptance:v1.2']).toBeDefined();
  });

  it('documents the static export contract, HTTP serving requirement, and MathJax behavior', async () => {
    const readme = await readFile(resolve(process.cwd(), 'README.md'), 'utf8');
    const userGuide = await readFile(resolve(process.cwd(), 'docs/user_guide.md'), 'utf8');

    expect(readme).toContain('test:acceptance:v1.2');
    expect(userGuide).toContain('data/enrichment.json');
    expect(userGuide).toContain('file://');
    expect(userGuide).toContain('python3 -m http.server 8000');
    expect(userGuide).toContain('MathJax');
  });
});
