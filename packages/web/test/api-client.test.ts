import { describe, expect, it, vi } from 'vitest';

import { listApiPapers, uploadSourceDocument } from '../src/lib/api-client.js';

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
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const listing = await listApiPapers('http://localhost:3000', fetchMock as typeof fetch);

    expect(listing.latestPaperId).toBe('fixture-markdown');
    expect(listing.papers[0]?.sourceType).toBe('markdown');
    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://localhost:3000/api/papers');
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
