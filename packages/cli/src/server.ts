import { mkdirSync, writeFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { basename, isAbsolute, join, resolve } from 'node:path';

import {
  BundleQueryService,
  BundleSerializer,
  ConsistencyChecker,
  CorpusQueryService,
  SchemaValidator,
  analyzeDocumentPath,
} from '@paperparser/core';

import {
  derivePaperId,
  listStoredPapers,
  readBundleFromStore,
  readLatestPaper,
  readSerializedBundleFromStore,
  resolveStorePath,
  writeBundleToStore,
} from './store.js';

export interface PaperParserServeOptions {
  storePath?: string;
  cwd?: string;
}

function jsonResponse(status: number, value: unknown): Response {
  return new Response(JSON.stringify(value, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
  });
}

function errorResponse(status: number, message: string): Response {
  return jsonResponse(status, { error: message });
}

function decodePathSegment(value: string | undefined): string {
  return decodeURIComponent(value ?? '');
}

function buildRequestUrl(request: IncomingMessage): URL {
  return new URL(request.url ?? '/', `http://${request.headers.host ?? '127.0.0.1'}`);
}

function toHeaders(headers: IncomingMessage['headers']): Headers {
  const result = new Headers();

  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        result.append(key, item);
      }
      continue;
    }

    result.set(key, value);
  }

  return result;
}

async function readBody(request: IncomingMessage): Promise<Buffer | undefined> {
  if (request.method === 'GET' || request.method === 'HEAD') {
    return undefined;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks);
}

async function toWebRequest(request: IncomingMessage): Promise<Request> {
  const body = await readBody(request);
  const url = buildRequestUrl(request);
  const init: RequestInit = {
    method: request.method ?? 'GET',
    headers: toHeaders(request.headers),
  };

  if (body && body.byteLength > 0) {
    init.body = new Uint8Array(body);
  }

  return new Request(url, init);
}

async function writeWebResponse(response: Response, serverResponse: ServerResponse): Promise<void> {
  serverResponse.statusCode = response.status;
  for (const [key, value] of response.headers) {
    serverResponse.setHeader(key, value);
  }

  const body = Buffer.from(await response.arrayBuffer());
  serverResponse.end(body);
}

function resolveInputPath(inputPath: string, cwd: string): string {
  return isAbsolute(inputPath) ? inputPath : resolve(cwd, inputPath);
}

async function persistUploadedFile(file: File, storePath: string, paperId: string): Promise<string> {
  const uploadDir = join(resolveStorePath(storePath), '_uploads', paperId);
  mkdirSync(uploadDir, { recursive: true });
  const uploadPath = join(uploadDir, basename(file.name));
  writeFileSync(uploadPath, Buffer.from(await file.arrayBuffer()));
  return uploadPath;
}

async function analyzeAndStore(params: {
  inputPath: string;
  paperId?: string;
  storePath: string;
  cwd: string;
}): Promise<Response> {
  const resolvedInputPath = resolveInputPath(params.inputPath, params.cwd);
  const bundle = analyzeDocumentPath(resolvedInputPath);
  const paperId = derivePaperId(resolvedInputPath, params.paperId);
  writeBundleToStore(bundle, params.storePath, paperId);

  return jsonResponse(201, {
    paperId,
    sourceType: bundle.manifest.paper.sourceType,
    manifest: BundleSerializer.toJsonBundle(bundle).manifest,
  });
}

async function handleAnalyzeRequest(request: Request, options: Required<PaperParserServeOptions>): Promise<Response> {
  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.startsWith('application/json')) {
    const payload = (await request.json()) as { inputPath?: string; paperId?: string };
    if (!payload.inputPath) {
      return errorResponse(400, 'POST /api/papers requires "inputPath" in the JSON body.');
    }

    return analyzeAndStore({
      inputPath: payload.inputPath,
      ...(payload.paperId ? { paperId: payload.paperId } : {}),
      storePath: options.storePath,
      cwd: options.cwd,
    });
  }

  if (contentType.startsWith('multipart/form-data')) {
    const formData = await request.formData();
    const file = formData.get('file');
    const explicitPaperId = formData.get('paperId');

    if (!(file instanceof File)) {
      return errorResponse(400, 'POST /api/papers multipart requests require a "file" field.');
    }

    const paperId = derivePaperId(file.name, typeof explicitPaperId === 'string' ? explicitPaperId : undefined);
    const uploadPath = await persistUploadedFile(file, options.storePath, paperId);

    return analyzeAndStore({
      inputPath: uploadPath,
      paperId,
      storePath: options.storePath,
      cwd: options.cwd,
    });
  }

  return errorResponse(415, 'Unsupported content type for POST /api/papers.');
}

function handleListRequest(options: Required<PaperParserServeOptions>): Response {
  const papers = listStoredPapers(options.storePath);
  return jsonResponse(200, {
    storePath: options.storePath,
    latestPaperId: readLatestPaper(options.storePath)?.paper_id ?? null,
    papers: papers.map((paper) => ({
      paperId: paper.paperId,
      title: paper.manifest.paper.title,
      sourceType: paper.manifest.paper.sourceType,
      year: paper.manifest.paper.year,
      isLatest: paper.isLatest,
      warningCount: paper.warningCount,
      warningCodes: paper.warningCodes,
      hasEnrichment: paper.hasEnrichment,
    })),
  });
}

function handleBundlePartRequest(
  paperId: string,
  part: 'manifest' | 'graph' | 'index' | 'enrichment',
  options: Required<PaperParserServeOptions>,
): Response {
  const { serializedBundle, serializedEnrichment } = readSerializedBundleFromStore(options.storePath, paperId);
  if (part === 'enrichment') {
    if (!serializedEnrichment) {
      return errorResponse(404, `No enrichment sidecar found for paper ${paperId}.`);
    }
    return jsonResponse(200, serializedEnrichment);
  }
  return jsonResponse(200, serializedBundle[part]);
}

function handleQueryRequest(paperId: string, requestUrl: URL, options: Required<PaperParserServeOptions>): Response {
  const queryText = requestUrl.searchParams.get('q') ?? requestUrl.searchParams.get('text') ?? '';
  if (!queryText.trim()) {
    return errorResponse(400, 'GET /api/papers/:id/query requires a non-empty "q" query parameter.');
  }

  const { bundle } = readBundleFromStore(options.storePath, paperId);
  const service = new BundleQueryService(bundle);
  return jsonResponse(200, {
    paperId,
    query: queryText,
    results: service.search({ text: queryText, limit: 10 }),
  });
}

function handleContextRequest(paperId: string, nodeId: string, options: Required<PaperParserServeOptions>): Response {
  const { bundle } = readBundleFromStore(options.storePath, paperId);
  const service = new BundleQueryService(bundle);
  return jsonResponse(200, {
    paperId,
    ...service.getContext(nodeId),
  });
}

function handleImpactRequest(paperId: string, nodeId: string, options: Required<PaperParserServeOptions>): Response {
  const { bundle } = readBundleFromStore(options.storePath, paperId);
  const service = new BundleQueryService(bundle);
  return jsonResponse(200, {
    paperId,
    ...service.getImpact(nodeId),
  });
}

function handleRelatedRequest(
  paperId: string,
  nodeId: string,
  requestUrl: URL,
  options: Required<PaperParserServeOptions>,
): Response {
  const limitValue = requestUrl.searchParams.get('limit');
  const parsedLimit = limitValue ? Number.parseInt(limitValue, 10) : undefined;
  const service = new CorpusQueryService(
    listStoredPapers(options.storePath).map((paper) => ({
      paperId: paper.paperId,
      bundle: readBundleFromStore(options.storePath, paper.paperId).bundle,
    })),
  );

  const queryOptions = typeof parsedLimit === 'number' ? { limit: parsedLimit } : undefined;
  return jsonResponse(200, service.getRelatedNodes(paperId, nodeId, queryOptions));
}

function handleValidateRequest(paperId: string, options: Required<PaperParserServeOptions>): Response {
  const { serializedBundle, serializedEnrichment } = readSerializedBundleFromStore(options.storePath, paperId);
  new SchemaValidator().validateSerializedBundle(serializedBundle);
  ConsistencyChecker.checkSerializedBundle(serializedBundle);
  if (serializedEnrichment) {
    new SchemaValidator().validateSerializedEnrichment(serializedEnrichment);
    ConsistencyChecker.checkSerializedEnrichment(serializedBundle, serializedEnrichment);
  }

  return jsonResponse(200, {
    ok: true,
    paperId,
    sourceType: serializedBundle.manifest.paper.source_type,
    nodeCount: serializedBundle.graph.nodes.length,
    edgeCount: serializedBundle.graph.edges.length,
  });
}

export async function handlePaperParserRequest(
  request: Request,
  options: PaperParserServeOptions = {},
): Promise<Response> {
  const resolvedOptions: Required<PaperParserServeOptions> = {
    storePath: resolveStorePath(options.storePath, options.cwd ?? process.cwd()),
    cwd: options.cwd ?? process.cwd(),
  };
  const url = new URL(request.url);
  const parts = url.pathname.split('/').filter(Boolean);

  if (request.method === 'POST' && url.pathname === '/api/papers') {
    return handleAnalyzeRequest(request, resolvedOptions);
  }

  if (request.method === 'GET' && url.pathname === '/api/papers') {
    return handleListRequest(resolvedOptions);
  }

  if (parts[0] !== 'api' || parts[1] !== 'papers' || !parts[2]) {
    return errorResponse(404, `No route for ${request.method} ${url.pathname}.`);
  }

  const paperId = decodePathSegment(parts[2]);
  const action = parts[3];

  if (request.method === 'GET' && action === 'manifest') {
    return handleBundlePartRequest(paperId, 'manifest', resolvedOptions);
  }
  if (request.method === 'GET' && action === 'graph') {
    return handleBundlePartRequest(paperId, 'graph', resolvedOptions);
  }
  if (request.method === 'GET' && action === 'index') {
    return handleBundlePartRequest(paperId, 'index', resolvedOptions);
  }
  if (request.method === 'GET' && action === 'enrichment') {
    return handleBundlePartRequest(paperId, 'enrichment', resolvedOptions);
  }
  if (request.method === 'GET' && action === 'validate') {
    return handleValidateRequest(paperId, resolvedOptions);
  }
  if (request.method === 'GET' && action === 'query') {
    return handleQueryRequest(paperId, url, resolvedOptions);
  }
  if (request.method === 'GET' && action === 'related' && parts[4]) {
    return handleRelatedRequest(paperId, decodePathSegment(parts[4]), url, resolvedOptions);
  }
  if (request.method === 'GET' && action === 'context' && parts[4]) {
    return handleContextRequest(paperId, decodePathSegment(parts[4]), resolvedOptions);
  }
  if (request.method === 'GET' && action === 'impact' && parts[4]) {
    return handleImpactRequest(paperId, decodePathSegment(parts[4]), resolvedOptions);
  }

  return errorResponse(404, `No route for ${request.method} ${url.pathname}.`);
}

export function createPaperParserRequestHandler(options: PaperParserServeOptions = {}) {
  return async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
    try {
      const webRequest = await toWebRequest(request);
      const webResponse = await handlePaperParserRequest(webRequest, options);
      await writeWebResponse(webResponse, response);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await writeWebResponse(errorResponse(500, message), response);
    }
  };
}
