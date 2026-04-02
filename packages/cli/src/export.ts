import { mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';

import { readSerializedBundleFromStore, resolveStorePath } from './store.js';

export interface ExportStaticDashboardOptions {
  cwd?: string;
  storePath?: string;
  paperId?: string;
  outputPath?: string;
}

export interface ExportStaticDashboardResult {
  paperId: string;
  outputPath: string;
}

function npmCommand(): string {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

export function exportStaticDashboard(options: ExportStaticDashboardOptions = {}): ExportStaticDashboardResult {
  const cwd = options.cwd ?? process.cwd();
  const resolvedStorePath = resolveStorePath(options.storePath, cwd);
  const { paperId, serializedBundle, serializedEnrichment } = readSerializedBundleFromStore(resolvedStorePath, options.paperId);
  const outputPath = resolve(cwd, options.outputPath ?? join('exports', paperId));

  const build = spawnSync(
    npmCommand(),
    ['run', 'build', '--workspace', '@paperparser/web', '--', '--outDir', outputPath],
    {
      cwd,
      encoding: 'utf8',
    },
  );

  if (build.status !== 0) {
    throw new Error(build.stderr || build.stdout || 'Failed to build the React dashboard for export.');
  }

  const dataDir = join(outputPath, 'data');
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(join(dataDir, 'manifest.json'), `${JSON.stringify(serializedBundle.manifest, null, 2)}\n`, 'utf8');
  writeFileSync(join(dataDir, 'graph.json'), `${JSON.stringify(serializedBundle.graph, null, 2)}\n`, 'utf8');
  writeFileSync(join(dataDir, 'index.json'), `${JSON.stringify(serializedBundle.index, null, 2)}\n`, 'utf8');
  if (serializedEnrichment) {
    writeFileSync(join(dataDir, 'enrichment.json'), `${JSON.stringify(serializedEnrichment, null, 2)}\n`, 'utf8');
  }

  return {
    paperId,
    outputPath,
  };
}
