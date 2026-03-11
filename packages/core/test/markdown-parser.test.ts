import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { parseAcademicMarkdown } from '../src/index.js';

describe('parseAcademicMarkdown', () => {
  it('extracts front matter, sections, theorem blocks, and explicit references', () => {
    const fixturePath = resolve(process.cwd(), 'packages/core/test/fixtures/markdown/paper.md');
    const parsed = parseAcademicMarkdown({
      kind: 'markdown',
      path: fixturePath,
      displayName: 'paper.md',
    });

    expect(parsed.metadata.title).toBe('Academic Markdown Fixture');
    expect(parsed.metadata.authors).toEqual(['A. Researcher']);
    expect(parsed.metadata.year).toBe(2026);
    expect(parsed.sections.map((section) => section.title)).toEqual(['Introduction', 'Notes']);

    const theoremNode = parsed.nodes.find((node) => node.id === 'sec1::thm:thm-main');
    const lemmaNode = parsed.nodes.find((node) => node.id === 'sec2::lem:lem-bounded');

    expect(theoremNode?.kind).toBe('theorem');
    expect(theoremNode?.number).toBe('2.1');
    expect(theoremNode?.statement).toContain('Let $T$ be compact.');

    expect(lemmaNode?.kind).toBe('lemma');
    expect(lemmaNode?.number).toBe('2.2');
    expect(parsed.edges).toEqual([
      expect.objectContaining({
        source: 'sec2::lem:lem-bounded',
        target: 'sec1::thm:thm-main',
        kind: 'uses_in_proof',
        evidence: 'explicit_ref',
      }),
    ]);
    expect(parsed.diagnostics.warnings).toEqual([]);
  });
});
