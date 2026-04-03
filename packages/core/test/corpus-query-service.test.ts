import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { CorpusQueryService, analyzeDocumentPath } from '../src/index.js';

describe('CorpusQueryService', () => {
  it('returns explainable related nodes across stored papers', () => {
    const markdownPath = resolve(process.cwd(), 'packages/core/test/fixtures/markdown/paper.md');
    const latexPath = resolve(process.cwd(), 'packages/core/test/fixtures/latex/project/main.tex');
    const service = new CorpusQueryService([
      {
        paperId: 'fixture-markdown',
        bundle: analyzeDocumentPath(markdownPath),
      },
      {
        paperId: 'fixture-latex',
        bundle: analyzeDocumentPath(latexPath),
      },
    ]);

    const related = service.getRelatedNodes('fixture-markdown', 'sec1::thm:thm-main', { limit: 3 });

    expect(related.sourcePaperId).toBe('fixture-markdown');
    expect(related.sourceNodeId).toBe('sec1::thm:thm-main');
    expect(related.matches[0]?.targetPaperId).toBe('fixture-latex');
    expect(related.matches[0]?.targetNodeId).toBe('sec1::thm:thm-fixture');
    expect(related.matches[0]?.targetNodeKind).toBe('theorem');
    expect(related.matches[0]?.evidenceTerms).toEqual(expect.arrayContaining(['compact', 'set']));
    expect(related.matches.every((match) => match.targetPaperId !== 'fixture-markdown')).toBe(true);
    expect(related.matches.every((match) => match.evidenceTerms.length >= 2)).toBe(true);
  });
});
