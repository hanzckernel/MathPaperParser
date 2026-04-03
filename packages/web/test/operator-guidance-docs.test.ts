import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('milestone acceptance proof and operator guidance docs', () => {
  it('publishes a dedicated v1.3 acceptance command at the repo root', async () => {
    const packageJson = JSON.parse(
      await readFile(resolve(process.cwd(), 'package.json'), 'utf8'),
    ) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts?.['test:acceptance:v1.3']).toBeDefined();
  });

  it('documents the current parse/render acceptance workflow while preserving the older export proof', async () => {
    const readme = await readFile(resolve(process.cwd(), 'README.md'), 'utf8');
    const userGuide = await readFile(resolve(process.cwd(), 'docs/user_guide.md'), 'utf8');

    expect(readme).toContain('test:acceptance:v1.3');
    expect(userGuide).toContain('test:acceptance:v1.3');
    expect(userGuide).toContain('test:acceptance:v1.2');
    expect(userGuide).toContain('MathJax');
    expect(userGuide).toContain('long_nalini');
  });
});
