import { describe, expect, it, vi } from 'vitest';

import { getCrossPaperLinks, listApiPapers, uploadSourceDocument } from '../src/lib/api-client.js';

describe('web api client', () => {
  it('lists stored papers from the serve api', async () => {
    const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>();
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          latestPaperId: 'fixture-markdown',
          papers: [
            {
              paperId: 'fixture-markdown',
              title: 'Academic Markdown Fixture',
              sourceType: 'markdown',
              year: 2026,
              isLatest: true,
              warningCount: 0,
              hasEnrichment: false,
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const listing = await listApiPapers('http://localhost:3000', fetchMock as typeof fetch);

    expect(listing.latestPaperId).toBe('fixture-markdown');
    expect(listing.papers[0]?.sourceType).toBe('markdown');
    expect(listing.papers[0]?.warningCount).toBe(0);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://localhost:3000/api/papers');
  });

  it('loads explainable cross-paper links for a selected node', async () => {
    const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>();
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          sourcePaperId: 'fixture-markdown',
          sourceNodeId: 'sec1::thm:thm-main',
          matches: [
            {
              targetPaperId: 'fixture-latex',
              targetPaperTitle: 'Tracked LaTeX Fixture',
              targetPaperSourceType: 'latex',
              targetNodeId: 'sec1::thm:thm-fixture',
              targetNodeKind: 'theorem',
              targetLabel: 'Theorem 1.1',
              targetNumber: '1.1',
              targetSection: '1',
              targetSectionTitle: 'Preliminaries',
              targetLatexLabel: 'thm:fixture',
              evidenceTerms: ['compact', 'set'],
              detail: 'Shared distinctive terms: compact, set.',
              score: 3,
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const related = await getCrossPaperLinks(
      'http://localhost:3000',
      'fixture-markdown',
      'sec1::thm:thm-main',
      fetchMock as typeof fetch,
    );

    expect(related.sourcePaperId).toBe('fixture-markdown');
    expect(related.matches[0]?.targetPaperId).toBe('fixture-latex');
    expect(related.matches[0]?.evidenceTerms).toEqual(['compact', 'set']);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'http://localhost:3000/api/papers/fixture-markdown/related/sec1%3A%3Athm%3Athm-main',
    );
  });

  it('uploads a source document as multipart form data', async () => {
    const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>();
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          paperId: 'uploaded-markdown',
          sourceType: 'markdown',
          manifest: {
            paper: {
              title: 'Academic Markdown Fixture',
            },
          },
        }),
        { status: 201 },
      ),
    );

    const file = new File(['# Upload fixture'], 'paper.md', { type: 'text/markdown' });
    const uploaded = await uploadSourceDocument(
      'http://localhost:3000',
      {
        file,
        paperId: 'uploaded-markdown',
      },
      fetchMock as typeof fetch,
    );

    expect(uploaded.paperId).toBe('uploaded-markdown');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe('http://localhost:3000/api/papers');
    expect(init?.method).toBe('POST');
    expect(init?.body).toBeInstanceOf(FormData);

    const body = init?.body as FormData;
    expect(body.get('paperId')).toBe('uploaded-markdown');
    const uploadedFile = body.get('file');
    expect(uploadedFile).toBeInstanceOf(File);
    expect((uploadedFile as File).name).toBe('paper.md');
  });
});
