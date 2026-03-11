import {
  BundleQueryService,
  ConsistencyChecker,
  SchemaValidator,
  type ImpactAnalysis,
  type NodeContext,
  type SearchResult,
} from '@paperparser/core';

import {
  listStoredPapers,
  readBundleFromStore,
  readLatestPaper,
  readSerializedBundleFromStore,
  resolveStorePath,
} from './store.js';
import { PAPERPARSER_MCP_SERVER_NAME } from './index.js';

export interface PaperParserMcpServerOptions {
  storePath?: string;
  cwd?: string;
}

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface McpResourceDefinition {
  uri: string;
  name: string;
  mimeType: string;
}

type ToolName =
  | 'query_math_objects'
  | 'get_context'
  | 'impact_analysis'
  | 'trace_proof_chain'
  | 'search_concepts'
  | 'validate_bundle';

type JsonRpcId = string | number | null;

interface JsonRpcRequest {
  jsonrpc?: '2.0';
  id?: JsonRpcId;
  method: string;
  params?: unknown;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: JsonRpcId;
  result?: unknown;
  error?: {
    code: number;
    message: string;
  };
}

const TOOL_DEFINITIONS: McpToolDefinition[] = [
  {
    name: 'query_math_objects',
    description: 'Search for theorem-like mathematical objects within a stored paper bundle.',
    inputSchema: {
      type: 'object',
      properties: {
        paperId: { type: 'string' },
        query: { type: 'string' },
        limit: { type: 'number' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_context',
    description: 'Return local graph context for a node, including dependencies and section summary.',
    inputSchema: {
      type: 'object',
      properties: {
        paperId: { type: 'string' },
        nodeId: { type: 'string' },
      },
      required: ['nodeId'],
    },
  },
  {
    name: 'impact_analysis',
    description: 'Return reverse dependency impact for a node within a stored paper.',
    inputSchema: {
      type: 'object',
      properties: {
        paperId: { type: 'string' },
        nodeId: { type: 'string' },
      },
      required: ['nodeId'],
    },
  },
  {
    name: 'trace_proof_chain',
    description: 'Trace the proof/dependency chain rooted at a selected node.',
    inputSchema: {
      type: 'object',
      properties: {
        paperId: { type: 'string' },
        nodeId: { type: 'string' },
      },
      required: ['nodeId'],
    },
  },
  {
    name: 'search_concepts',
    description: 'Alias for paper concept search, optimized for terminology lookups.',
    inputSchema: {
      type: 'object',
      properties: {
        paperId: { type: 'string' },
        query: { type: 'string' },
        limit: { type: 'number' },
      },
      required: ['query'],
    },
  },
  {
    name: 'validate_bundle',
    description: 'Run schema and consistency validation on a stored paper bundle.',
    inputSchema: {
      type: 'object',
      properties: {
        paperId: { type: 'string' },
      },
    },
  },
];

function asString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Expected "${field}" to be a non-empty string.`);
  }

  return value;
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

function asOptionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function asObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function resourceUri(paperId: string, suffix: 'graph' | 'manifest' | 'enrichment'): string {
  return `paperparser://papers/${paperId}/${suffix}`;
}

export class PaperParserMcpServer {
  private readonly storePath: string;

  constructor(options: PaperParserMcpServerOptions = {}) {
    this.storePath = resolveStorePath(options.storePath, options.cwd ?? process.cwd());
  }

  async listTools(): Promise<McpToolDefinition[]> {
    return TOOL_DEFINITIONS;
  }

  async listResources(): Promise<McpResourceDefinition[]> {
    const papers = listStoredPapers(this.storePath);
    const resources: McpResourceDefinition[] = [
      {
        uri: 'paperparser://papers',
        name: 'Stored papers',
        mimeType: 'application/json',
      },
    ];

    for (const paper of papers) {
      resources.push(
        {
          uri: resourceUri(paper.paperId, 'graph'),
          name: `${paper.paperId} graph`,
          mimeType: 'application/json',
        },
        {
          uri: resourceUri(paper.paperId, 'manifest'),
          name: `${paper.paperId} manifest`,
          mimeType: 'application/json',
        },
        {
          uri: resourceUri(paper.paperId, 'enrichment'),
          name: `${paper.paperId} enrichment`,
          mimeType: 'application/json',
        },
      );
    }

    return resources;
  }

  async callTool(name: ToolName, rawArguments: Record<string, unknown> = {}): Promise<unknown> {
    const args = asObject(rawArguments);
    const paperId = asOptionalString(args.paperId);

    switch (name) {
      case 'query_math_objects':
      case 'search_concepts':
        return this.queryMathObjects(paperId, asString(args.query, 'query'), asOptionalNumber(args.limit));
      case 'get_context':
        return this.getContext(paperId, asString(args.nodeId, 'nodeId'));
      case 'impact_analysis':
        return this.getImpact(paperId, asString(args.nodeId, 'nodeId'));
      case 'trace_proof_chain':
        return this.traceProofChain(paperId, asString(args.nodeId, 'nodeId'));
      case 'validate_bundle':
        return this.validateBundle(paperId);
      default:
        throw new Error(`Unknown MCP tool: ${name}`);
    }
  }

  async readResource(uri: string): Promise<unknown> {
    if (uri === 'paperparser://papers') {
      const papers = listStoredPapers(this.storePath);
      return {
        latestPaperId: readLatestPaper(this.storePath)?.paper_id ?? null,
        papers: papers.map((paper) => ({
          paperId: paper.paperId,
          title: paper.manifest.paper.title,
          sourceType: paper.manifest.paper.sourceType,
          year: paper.manifest.paper.year,
          isLatest: paper.isLatest,
        })),
      };
    }

    const parsed = new URL(uri);
    if (parsed.protocol !== 'paperparser:' || parsed.hostname !== 'papers') {
      throw new Error(`Unsupported MCP resource URI: ${uri}`);
    }

    const segments = parsed.pathname.split('/').filter(Boolean);
    if (segments.length !== 2) {
      throw new Error(`Unsupported MCP resource URI: ${uri}`);
    }

    const [paperId, kind] = segments;
    const { serializedBundle } = readSerializedBundleFromStore(this.storePath, paperId);

    if (kind === 'graph') {
      return serializedBundle.graph;
    }
    if (kind === 'manifest') {
      return serializedBundle.manifest;
    }
    if (kind === 'enrichment') {
      return serializedBundle.index;
    }

    throw new Error(`Unsupported MCP resource URI: ${uri}`);
  }

  async handleRequest(request: JsonRpcRequest): Promise<JsonRpcResponse | null> {
    if (request.method === 'notifications/initialized') {
      return null;
    }

    try {
      switch (request.method) {
        case 'initialize':
          return {
            jsonrpc: '2.0',
            id: request.id ?? null,
            result: {
              protocolVersion:
                typeof asObject(request.params).protocolVersion === 'string'
                  ? asObject(request.params).protocolVersion
                  : '2025-03-26',
              capabilities: {
                tools: {
                  listChanged: false,
                },
                resources: {
                  listChanged: false,
                },
              },
              serverInfo: {
                name: PAPERPARSER_MCP_SERVER_NAME,
                version: '0.2.0-alpha.1',
              },
            },
          };
        case 'tools/list':
          return {
            jsonrpc: '2.0',
            id: request.id ?? null,
            result: {
              tools: await this.listTools(),
            },
          };
        case 'tools/call': {
          const params = asObject(request.params);
          const name = asString(params.name, 'name') as ToolName;
          const result = await this.callTool(name, asObject(params.arguments));
          return {
            jsonrpc: '2.0',
            id: request.id ?? null,
            result: {
              structuredContent: result,
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
              isError: false,
            },
          };
        }
        case 'resources/list':
          return {
            jsonrpc: '2.0',
            id: request.id ?? null,
            result: {
              resources: await this.listResources(),
            },
          };
        case 'resources/read': {
          const params = asObject(request.params);
          const uri = asString(params.uri, 'uri');
          const result = await this.readResource(uri);
          return {
            jsonrpc: '2.0',
            id: request.id ?? null,
            result: {
              contents: [
                {
                  uri,
                  mimeType: 'application/json',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            },
          };
        }
        case 'ping':
          return {
            jsonrpc: '2.0',
            id: request.id ?? null,
            result: {},
          };
        default:
          throw new Error(`Unsupported MCP method: ${request.method}`);
      }
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id: request.id ?? null,
        error: {
          code: -32000,
          message: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  private queryMathObjects(paperId: string | undefined, query: string, limit?: number): { paperId: string; results: SearchResult[] } {
    const { paperId: resolvedPaperId, bundle } = readBundleFromStore(this.storePath, paperId);
    const service = new BundleQueryService(bundle);
    return {
      paperId: resolvedPaperId,
      results: service.search({
        text: query,
        ...(typeof limit === 'number' ? { limit } : {}),
      }),
    };
  }

  private getContext(paperId: string | undefined, nodeId: string): { paperId: string } & NodeContext {
    const { paperId: resolvedPaperId, bundle } = readBundleFromStore(this.storePath, paperId);
    const service = new BundleQueryService(bundle);
    return {
      paperId: resolvedPaperId,
      ...service.getContext(nodeId),
    };
  }

  private getImpact(paperId: string | undefined, nodeId: string): { paperId: string } & ImpactAnalysis {
    const { paperId: resolvedPaperId, bundle } = readBundleFromStore(this.storePath, paperId);
    const service = new BundleQueryService(bundle);
    return {
      paperId: resolvedPaperId,
      ...service.getImpact(nodeId),
    };
  }

  private traceProofChain(
    paperId: string | undefined,
    nodeId: string,
  ): { paperId: string; nodeId: string; dependencyChain: NodeContext['dependencyChain']; proofFlow: NodeContext['proofFlow'] } {
    const context = this.getContext(paperId, nodeId);
    return {
      paperId: context.paperId,
      nodeId: context.node.id,
      dependencyChain: context.dependencyChain,
      proofFlow: context.proofFlow,
    };
  }

  private validateBundle(
    paperId: string | undefined,
  ): { ok: true; paperId: string; sourceType: string; nodeCount: number; edgeCount: number } {
    const { paperId: resolvedPaperId, serializedBundle } = readSerializedBundleFromStore(this.storePath, paperId);
    new SchemaValidator().validateSerializedBundle(serializedBundle);
    ConsistencyChecker.checkSerializedBundle(serializedBundle);

    return {
      ok: true,
      paperId: resolvedPaperId,
      sourceType: serializedBundle.manifest.paper.source_type,
      nodeCount: serializedBundle.graph.nodes.length,
      edgeCount: serializedBundle.graph.edges.length,
    };
  }
}

export function createPaperParserMcpServer(options: PaperParserMcpServerOptions = {}): PaperParserMcpServer {
  return new PaperParserMcpServer(options);
}

function writeFrame(output: NodeJS.WritableStream, payload: JsonRpcResponse): void {
  const body = JSON.stringify(payload);
  output.write(`Content-Length: ${Buffer.byteLength(body, 'utf8')}\r\n\r\n${body}`);
}

export function runPaperParserMcpStdioServer(options: PaperParserMcpServerOptions = {}): void {
  const server = createPaperParserMcpServer(options);
  const stdin = process.stdin;
  const stdout = process.stdout;

  stdin.setEncoding('utf8');
  let buffer = '';

  stdin.on('data', (chunk: string) => {
    buffer += chunk;

    while (true) {
      const headerEnd = buffer.indexOf('\r\n\r\n');
      if (headerEnd === -1) {
        return;
      }

      const headerBlock = buffer.slice(0, headerEnd);
      const contentLengthLine = headerBlock
        .split('\r\n')
        .find((line) => line.toLowerCase().startsWith('content-length:'));
      if (!contentLengthLine) {
        buffer = '';
        return;
      }

      const contentLength = Number.parseInt(contentLengthLine.split(':')[1]?.trim() ?? '', 10);
      if (!Number.isFinite(contentLength)) {
        buffer = '';
        return;
      }

      const bodyStart = headerEnd + 4;
      if (buffer.length < bodyStart + contentLength) {
        return;
      }

      const body = buffer.slice(bodyStart, bodyStart + contentLength);
      buffer = buffer.slice(bodyStart + contentLength);

      let request: JsonRpcRequest | undefined;
      try {
        request = JSON.parse(body) as JsonRpcRequest;
      } catch {
        continue;
      }

      void server.handleRequest(request).then((response) => {
        if (response && request?.id !== undefined) {
          writeFrame(stdout, response);
        }
      });
    }
  });

  stdin.resume();
}
