import type { CrossPaperLinkResult } from '@paperparser/core';

export interface ApiPaperSummary {
  paperId: string;
  title: string;
  sourceType: string;
  year: number;
  isLatest: boolean;
  warningCount: number;
  hasEnrichment: boolean;
}

export interface ApiPaperListing {
  latestPaperId: string | null;
  papers: ApiPaperSummary[];
}

export interface ApiUploadResult {
  paperId: string;
  sourceType: string;
  manifest: {
    paper: {
      title: string;
    };
  };
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/u, '');
}

async function fetchJson<T>(fetchImpl: typeof fetch, url: string, init?: RequestInit): Promise<T> {
  const response = await fetchImpl(url, init);
  if (!response.ok) {
    throw new Error(`Request failed for ${url}: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

export async function listApiPapers(baseUrl: string, fetchImpl: typeof fetch = fetch): Promise<ApiPaperListing> {
  return fetchJson<ApiPaperListing>(fetchImpl, `${trimTrailingSlash(baseUrl)}/api/papers`);
}

export async function getCrossPaperLinks(
  baseUrl: string,
  paperId: string,
  nodeId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<CrossPaperLinkResult> {
  return fetchJson<CrossPaperLinkResult>(
    fetchImpl,
    `${trimTrailingSlash(baseUrl)}/api/papers/${encodeURIComponent(paperId)}/related/${encodeURIComponent(nodeId)}`,
  );
}

export async function uploadSourceDocument(
  baseUrl: string,
  options: {
    file: File;
    paperId?: string;
  },
  fetchImpl: typeof fetch = fetch,
): Promise<ApiUploadResult> {
  const body = new FormData();
  body.set('file', options.file);
  if (options.paperId) {
    body.set('paperId', options.paperId);
  }

  return fetchJson<ApiUploadResult>(fetchImpl, `${trimTrailingSlash(baseUrl)}/api/papers`, {
    method: 'POST',
    body,
  });
}
