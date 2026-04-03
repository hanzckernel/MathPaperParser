import { existsSync, mkdirSync, mkdtempSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';

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
  const outputParentPath = dirname(outputPath);
  mkdirSync(outputParentPath, { recursive: true });
  const tempOutputPath = mkdtempSync(join(outputParentPath, '.paperparser-export-'));

  const build = spawnSync(
    npmCommand(),
    ['run', 'build', '--workspace', '@paperparser/web', '--', '--outDir', tempOutputPath],
    {
      cwd,
      encoding: 'utf8',
    },
  );

  if (build.status !== 0) {
    rmSync(tempOutputPath, { recursive: true, force: true });
    throw new Error(build.stderr || build.stdout || 'Failed to build the React dashboard for export.');
  }

  const dataDir = join(tempOutputPath, 'data');
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(join(dataDir, 'manifest.json'), `${JSON.stringify(serializedBundle.manifest, null, 2)}\n`, 'utf8');
  writeFileSync(join(dataDir, 'graph.json'), `${JSON.stringify(serializedBundle.graph, null, 2)}\n`, 'utf8');
  writeFileSync(join(dataDir, 'index.json'), `${JSON.stringify(serializedBundle.index, null, 2)}\n`, 'utf8');
  writeFileSync(
    join(dataDir, 'enrichment.json'),
    serializedEnrichment ? `${JSON.stringify(serializedEnrichment, null, 2)}\n` : 'null\n',
    'utf8',
  );

  if (existsSync(outputPath)) {
    rmSync(outputPath, { recursive: true, force: true });
  }
  renameSync(tempOutputPath, outputPath);

  return {
    paperId,
    outputPath,
  };
}
