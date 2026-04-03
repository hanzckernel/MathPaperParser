import { createServer } from 'node:http';

import {
  BundleSerializer,
  BundleQueryService,
  ConsistencyChecker,
  CorpusQueryService,
  EnrichmentSerializer,
  SchemaValidator,
  analyzeDocumentPath,
  createHeuristicEnrichment,
} from '@paperparser/core';
import { PAPERPARSER_MCP_SERVER_NAME, runPaperParserMcpStdioServer } from '@paperparser/mcp';

import {
  derivePaperId,
  listStoredPapers,
  readBundleFromStore,
  readLatestPaper,
  readSerializedBundleFromStore,
  resolveStorePath,
  writeBundleToStore,
  writeEnrichmentToStore,
} from './store.js';
import { exportStaticDashboard } from './export.js';
import { createPaperParserRequestHandler } from './server.js';

export const PAPERPARSER_CLI_NAME = 'paperparser';

export interface CliIo {
  stdout: (line: string) => void;
  stderr: (line: string) => void;
  cwd?: string;
}

function defaultIo(): CliIo {
  return {
    stdout: (line) => console.log(line),
    stderr: (line) => console.error(line),
    cwd: process.cwd(),
  };
}

function readFlag(argv: string[], flag: string): string | undefined {
  const index = argv.indexOf(flag);
  if (index === -1) {
    return undefined;
  }

  return argv[index + 1];
}

function hasFlag(argv: string[], flag: string): boolean {
  return argv.includes(flag);
}

function writeJson(io: CliIo, value: unknown): void {
  io.stdout(JSON.stringify(value, null, 2));
}

function usage(): string {
  return [
    `Usage: ${PAPERPARSER_CLI_NAME} analyze <input> [--store <path>] [--paper <id>]`,
    `       ${PAPERPARSER_CLI_NAME} enrich [--store <path>] [--paper <id>]`,
    `       ${PAPERPARSER_CLI_NAME} validate [--store <path>] [--paper <id>]`,
    `       ${PAPERPARSER_CLI_NAME} export [--store <path>] [--paper <id>] [--output <path>]`,
    `       ${PAPERPARSER_CLI_NAME} list [--store <path>]`,
    `       ${PAPERPARSER_CLI_NAME} query <question> [--store <path>] [--paper <id>]`,
    `       ${PAPERPARSER_CLI_NAME} related <node-id> [--store <path>] [--paper <id>] [--limit <n>]`,
    `       ${PAPERPARSER_CLI_NAME} context <node-id> [--store <path>] [--paper <id>]`,
    `       ${PAPERPARSER_CLI_NAME} impact <node-id> [--store <path>] [--paper <id>]`,
    `       ${PAPERPARSER_CLI_NAME} mcp [--store <path>]`,
    `       ${PAPERPARSER_CLI_NAME} serve [--store <path>] [--host <host>] [--port <port>]`,
    `       ${PAPERPARSER_CLI_NAME} status [--store <path>]`,
  ].join('\n');
}

function runAnalyze(argv: string[], io: CliIo): number {
  const input = argv[1];
  if (!input) {
    io.stderr(usage());
    return 1;
  }

  const storeFlag = readFlag(argv, '--store');
  const paperFlag = readFlag(argv, '--paper');
  const cwd = io.cwd ?? process.cwd();

  try {
    const bundle = analyzeDocumentPath(input);
    const paperId = derivePaperId(input, paperFlag);
    const stored = writeBundleToStore(bundle, resolveStorePath(storeFlag, cwd), paperId);
    const warningCount = bundle.diagnostics.warnings.length;
    const warningCodes = [...new Set(bundle.diagnostics.warnings.map((warning) => warning.code))].sort();

    io.stdout(`Analyzed ${input}`);
    io.stdout(`paper_id=${stored.paperId}`);
    io.stdout(`bundle_dir=${stored.bundleDir}`);
    if (stored.diagnosticsPath) {
      io.stdout(`diagnostics=${stored.diagnosticsPath}`);
    }
    io.stdout(`warning_count=${warningCount}`);
    if (warningCodes.length > 0) {
      io.stdout(`warning_codes=${warningCodes.join(',')}`);
    }
    return 0;
  } catch (error) {
    io.stderr(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

function runEnrich(argv: string[], io: CliIo): number {
  const storeFlag = readFlag(argv, '--store');
  const paperFlag = readFlag(argv, '--paper');
  const cwd = io.cwd ?? process.cwd();
  const storePath = resolveStorePath(storeFlag, cwd);

  try {
    const { paperId, bundle } = readBundleFromStore(storePath, paperFlag);
    const enrichment = createHeuristicEnrichment(bundle, { paperId });
    const serializedEnrichment = EnrichmentSerializer.toJsonArtifact(enrichment);
    const stored = writeEnrichmentToStore(serializedEnrichment, storePath, paperId);

    new SchemaValidator().validateSerializedEnrichment(serializedEnrichment);
    ConsistencyChecker.checkSerializedEnrichment(BundleSerializer.toJsonBundle(bundle), serializedEnrichment);

    io.stdout(`paper_id=${stored.paperId}`);
    io.stdout(`enrichment=${stored.enrichmentPath}`);
    io.stdout(`candidate_count=${serializedEnrichment.edges.length}`);
    io.stdout(`provider=${serializedEnrichment.provider.agent}`);
    return 0;
  } catch (error) {
    io.stderr(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

function runStatus(argv: string[], io: CliIo): number {
  const storeFlag = readFlag(argv, '--store');
  const cwd = io.cwd ?? process.cwd();
  const storePath = resolveStorePath(storeFlag, cwd);
  const latest = readLatestPaper(storePath);

  if (!latest) {
    io.stdout(`store=${storePath}`);
    io.stdout('latest=none');
    return 0;
  }

  io.stdout(`store=${storePath}`);
  io.stdout(`latest=${latest.paper_id}`);
  io.stdout(`updated_at=${latest.updated_at}`);
  return 0;
}

function runValidate(argv: string[], io: CliIo): number {
  const storeFlag = readFlag(argv, '--store');
  const paperFlag = readFlag(argv, '--paper');
  const jsonMode = hasFlag(argv, '--json');
  const cwd = io.cwd ?? process.cwd();
  const storePath = resolveStorePath(storeFlag, cwd);

  try {
    const { paperId, serializedBundle } = readSerializedBundleFromStore(storePath, paperFlag);
    new SchemaValidator().validateSerializedBundle(serializedBundle);
    ConsistencyChecker.checkSerializedBundle(serializedBundle);

    if (jsonMode) {
      writeJson(io, {
        ok: true,
        paperId,
        sourceType: serializedBundle.manifest.paper.source_type,
        nodeCount: serializedBundle.graph.nodes.length,
        edgeCount: serializedBundle.graph.edges.length,
      });
      return 0;
    }

    io.stdout(`paper_id=${paperId}`);
    io.stdout('validation=ok');
    return 0;
  } catch (error) {
    io.stderr(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

function runList(argv: string[], io: CliIo): number {
  const storeFlag = readFlag(argv, '--store');
  const jsonMode = hasFlag(argv, '--json');
  const cwd = io.cwd ?? process.cwd();
  const storePath = resolveStorePath(storeFlag, cwd);
  const papers = listStoredPapers(storePath);
  const latestPaperId = readLatestPaper(storePath)?.paper_id;

  if (jsonMode) {
    writeJson(io, {
      storePath,
      latestPaperId: latestPaperId ?? null,
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
    return 0;
  }

  io.stdout(`store=${storePath}`);
  io.stdout(`papers=${papers.length}`);
  for (const paper of papers) {
    io.stdout(`${paper.paperId}\t${paper.manifest.paper.sourceType}\t${paper.manifest.paper.title}`);
  }
  return 0;
}

function runRelated(argv: string[], io: CliIo): number {
  const nodeId = argv[1];
  if (!nodeId) {
    io.stderr(usage());
    return 1;
  }

  const storeFlag = readFlag(argv, '--store');
  const paperFlag = readFlag(argv, '--paper');
  const limitFlag = readFlag(argv, '--limit');
  const jsonMode = hasFlag(argv, '--json');
  const cwd = io.cwd ?? process.cwd();
  const storePath = resolveStorePath(storeFlag, cwd);
  const limit = limitFlag ? Number.parseInt(limitFlag, 10) : undefined;

  try {
    const { paperId } = readBundleFromStore(storePath, paperFlag);
    const corpus = listStoredPapers(storePath).map((paper) => ({
      paperId: paper.paperId,
      bundle: readBundleFromStore(storePath, paper.paperId).bundle,
    }));
    const service = new CorpusQueryService(corpus);
    const options = typeof limit === 'number' ? { limit } : undefined;
    const related = service.getRelatedNodes(paperId, nodeId, options);

    if (jsonMode) {
      writeJson(io, related);
      return 0;
    }

    io.stdout(`paper_id=${related.sourcePaperId}`);
    io.stdout(`node_id=${related.sourceNodeId}`);
    for (const match of related.matches) {
      io.stdout(`${match.targetPaperId}\t${match.targetNodeId}\t${match.evidenceTerms.join(',')}`);
    }
    return 0;
  } catch (error) {
    io.stderr(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

function runExport(argv: string[], io: CliIo): number {
  const storeFlag = readFlag(argv, '--store');
  const paperFlag = readFlag(argv, '--paper');
  const outputFlag = readFlag(argv, '--output');
  const cwd = io.cwd ?? process.cwd();

  try {
    const exported = exportStaticDashboard({
      cwd,
      ...(storeFlag ? { storePath: storeFlag } : {}),
      ...(paperFlag ? { paperId: paperFlag } : {}),
      ...(outputFlag ? { outputPath: outputFlag } : {}),
    });

    io.stdout(`paper_id=${exported.paperId}`);
    io.stdout(`output=${exported.outputPath}`);
    return 0;
  } catch (error) {
    io.stderr(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

function runQuery(argv: string[], io: CliIo): number {
  const queryText = argv[1];
  if (!queryText) {
    io.stderr(usage());
    return 1;
  }

  const storeFlag = readFlag(argv, '--store');
  const paperFlag = readFlag(argv, '--paper');
  const jsonMode = hasFlag(argv, '--json');
  const cwd = io.cwd ?? process.cwd();
  const storePath = resolveStorePath(storeFlag, cwd);

  try {
    const { paperId, bundle } = readBundleFromStore(storePath, paperFlag);
    const service = new BundleQueryService(bundle);
    const results = service.search({ text: queryText, limit: 10 });

    if (jsonMode) {
      writeJson(io, { paperId, query: queryText, results });
      return 0;
    }

    io.stdout(`paper_id=${paperId}`);
    for (const result of results) {
      io.stdout(`${result.nodeId}\t${result.score}\t${result.matchedText}`);
    }
    return 0;
  } catch (error) {
    io.stderr(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

function runContext(argv: string[], io: CliIo): number {
  const nodeId = argv[1];
  if (!nodeId) {
    io.stderr(usage());
    return 1;
  }

  const storeFlag = readFlag(argv, '--store');
  const paperFlag = readFlag(argv, '--paper');
  const jsonMode = hasFlag(argv, '--json');
  const cwd = io.cwd ?? process.cwd();
  const storePath = resolveStorePath(storeFlag, cwd);

  try {
    const { paperId, bundle } = readBundleFromStore(storePath, paperFlag);
    const service = new BundleQueryService(bundle);
    const context = service.getContext(nodeId);

    if (jsonMode) {
      writeJson(io, { paperId, ...context });
      return 0;
    }

    io.stdout(`paper_id=${paperId}`);
    io.stdout(`node_id=${context.node.id}`);
    io.stdout(`outgoing_edges=${context.outgoingEdges.length}`);
    io.stdout(`incoming_edges=${context.incomingEdges.length}`);
    return 0;
  } catch (error) {
    io.stderr(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

function runImpact(argv: string[], io: CliIo): number {
  const nodeId = argv[1];
  if (!nodeId) {
    io.stderr(usage());
    return 1;
  }

  const storeFlag = readFlag(argv, '--store');
  const paperFlag = readFlag(argv, '--paper');
  const jsonMode = hasFlag(argv, '--json');
  const cwd = io.cwd ?? process.cwd();
  const storePath = resolveStorePath(storeFlag, cwd);

  try {
    const { paperId, bundle } = readBundleFromStore(storePath, paperFlag);
    const service = new BundleQueryService(bundle);
    const impact = service.getImpact(nodeId);

    if (jsonMode) {
      writeJson(io, { paperId, ...impact });
      return 0;
    }

    io.stdout(`paper_id=${paperId}`);
    io.stdout(`node_id=${impact.node.id}`);
    io.stdout(`dependent_nodes=${impact.dependentNodes.length}`);
    return 0;
  } catch (error) {
    io.stderr(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

function runServe(argv: string[], io: CliIo): number {
  const storeFlag = readFlag(argv, '--store');
  const host = readFlag(argv, '--host') ?? '127.0.0.1';
  const portValue = readFlag(argv, '--port') ?? '3000';
  const port = Number.parseInt(portValue, 10);
  const cwd = io.cwd ?? process.cwd();

  if (!Number.isInteger(port) || port < 0) {
    io.stderr(`Invalid port: ${portValue}`);
    return 1;
  }

  try {
    const storePath = resolveStorePath(storeFlag, cwd);
    const server = createServer(createPaperParserRequestHandler({ storePath, cwd }));
    server.listen(port, host, () => {
      io.stdout(`serve=http://${host}:${port}`);
      io.stdout(`store=${storePath}`);
    });
    server.on('error', (error) => {
      io.stderr(error instanceof Error ? error.message : String(error));
    });
    return 0;
  } catch (error) {
    io.stderr(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

function runMcp(argv: string[], io: CliIo): number {
  const storeFlag = readFlag(argv, '--store');
  const cwd = io.cwd ?? process.cwd();

  try {
    const storePath = resolveStorePath(storeFlag, cwd);
    io.stderr(`Starting ${PAPERPARSER_MCP_SERVER_NAME} on stdio with store ${storePath}`);
    runPaperParserMcpStdioServer({ storePath, cwd });
    return 0;
  } catch (error) {
    io.stderr(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

export function runCli(argv: string[], io: CliIo = defaultIo()): number {
  const [command] = argv;

  switch (command) {
    case 'analyze':
      return runAnalyze(argv, io);
    case 'enrich':
      return runEnrich(argv, io);
    case 'validate':
      return runValidate(argv, io);
    case 'export':
      return runExport(argv, io);
    case 'list':
      return runList(argv, io);
    case 'query':
      return runQuery(argv, io);
    case 'related':
      return runRelated(argv, io);
    case 'context':
      return runContext(argv, io);
    case 'impact':
      return runImpact(argv, io);
    case 'mcp':
      return runMcp(argv, io);
    case 'serve':
      return runServe(argv, io);
    case 'status':
      return runStatus(argv, io);
    default:
      io.stderr(usage());
      return 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(runCli(process.argv.slice(2)));
}
