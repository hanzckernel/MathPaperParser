import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { flattenLatex } from '../src/index.js';

describe('flattenLatex', () => {
  it('inlines inputs recursively and reports missing assets', () => {
    const fixturePath = resolve(process.cwd(), 'packages/core/test/fixtures/latex/project/main.tex');
    const result = flattenLatex(fixturePath);

    expect(result.flatTex).toContain('% >>> BEGIN FILE: main.tex');
    expect(result.flatTex).toContain('% >>> BEGIN FILE: sections/prelim.tex');
    expect(result.flatTex).toContain('% >>> BEGIN FILE: appendix_note.tex');
    expect(result.flatTex).toContain('Every compact set in a Hausdorff space is closed.');
    expect(result.missingInputs).toEqual([]);
    expect(result.missingBibs).toEqual(['missing.bib']);
    expect(result.missingGraphics).toEqual(['figures/missing-figure']);
  });
});
