import type { SerializedEnrichmentArtifact, SerializedPaperParserBundle } from '@paperparser/core';

export interface StaticBundleSource {
  kind: 'static';
  basePath: string;
}

export interface ApiBundleSource {
  kind: 'api';
  baseUrl: string;
  paperId: string;
}

export type BundleSource = StaticBundleSource | ApiBundleSource;

export interface LoadedSerializedPaperData {
  bundle: SerializedPaperParserBundle;
  enrichment?: SerializedEnrichmentArtifact;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/u, '');
}

function asSearchParams(search: string): URLSearchParams {
  return new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
}

async function fetchJson<T>(fetchImpl: typeof fetch, url: string): Promise<T> {
  const response = await fetchImpl(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

async function fetchOptionalJson<T>(fetchImpl: typeof fetch, url: string): Promise<T | undefined> {
  const response = await fetchImpl(url);
  if (response.status === 404) {
    return undefined;
  }
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

async function resolveLatestPaperId(fetchImpl: typeof fetch, baseUrl: string): Promise<string> {
  const listing = await fetchJson<{ latestPaperId: string | null }>(fetchImpl, `${trimTrailingSlash(baseUrl)}/api/papers`);
  if (!listing.latestPaperId) {
    throw new Error(`No latest paper is available from ${baseUrl}.`);
  }

  return listing.latestPaperId;
}

export function resolveBundleSource(search: string): BundleSource {
  const params = asSearchParams(search);
  const api = params.get('api');
  if (api) {
    return {
      kind: 'api',
      baseUrl: trimTrailingSlash(api),
      paperId: params.get('paper') ?? 'latest',
    };
  }

  return {
    kind: 'static',
    basePath: params.get('data') ?? './data',
  };
}

export async function loadSerializedPaperData(
  source: BundleSource,
  fetchImpl: typeof fetch = fetch,
): Promise<LoadedSerializedPaperData> {
  if (source.kind === 'static') {
    const basePath = trimTrailingSlash(source.basePath);
    const [manifest, graph, index, enrichment] = await Promise.all([
      fetchJson<SerializedPaperParserBundle['manifest']>(fetchImpl, `${basePath}/manifest.json`),
      fetchJson<SerializedPaperParserBundle['graph']>(fetchImpl, `${basePath}/graph.json`),
      fetchJson<SerializedPaperParserBundle['index']>(fetchImpl, `${basePath}/index.json`),
      fetchOptionalJson<SerializedEnrichmentArtifact>(fetchImpl, `${basePath}/enrichment.json`),
    ]);

    return {
      bundle: { manifest, graph, index },
      ...(enrichment ? { enrichment } : {}),
    };
  }

  const paperId = source.paperId === 'latest' ? await resolveLatestPaperId(fetchImpl, source.baseUrl) : source.paperId;
  const baseUrl = `${trimTrailingSlash(source.baseUrl)}/api/papers/${encodeURIComponent(paperId)}`;
  const [manifest, graph, index, enrichment] = await Promise.all([
    fetchJson<SerializedPaperParserBundle['manifest']>(fetchImpl, `${baseUrl}/manifest`),
    fetchJson<SerializedPaperParserBundle['graph']>(fetchImpl, `${baseUrl}/graph`),
    fetchJson<SerializedPaperParserBundle['index']>(fetchImpl, `${baseUrl}/index`),
    fetchOptionalJson<SerializedEnrichmentArtifact>(fetchImpl, `${baseUrl}/enrichment`),
  ]);

  return {
    bundle: { manifest, graph, index },
    ...(enrichment ? { enrichment } : {}),
  };
}

export async function loadSerializedBundle(
  source: BundleSource,
  fetchImpl: typeof fetch = fetch,
): Promise<SerializedPaperParserBundle> {
  return (await loadSerializedPaperData(source, fetchImpl)).bundle;
}
