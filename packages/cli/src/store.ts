import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

import { BundleSerializer, JsonStore, type BundleManifest, type PaperParserBundle, type PipelineDiagnostics } from '@paperparser/core';

export interface StoredPaperState {
  paperId: string;
  storePath: string;
  bundleDir: string;
  diagnosticsPath?: string;
}

export interface LatestPaperRecord {
  paper_id: string;
  updated_at: string;
}

export interface StoredPaperSummary {
  paperId: string;
  manifest: BundleManifest;
  isLatest: boolean;
}

function nowIsoUtc(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

export function resolveStorePath(storePath?: string, cwd = process.cwd()): string {
  return resolve(cwd, storePath ?? '.paperparser-data');
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/\.[^.]+$/u, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'paper';
}

export function derivePaperId(inputPath: string, explicitPaperId?: string): string {
  return explicitPaperId ? slugify(explicitPaperId) : slugify(basename(inputPath));
}

function hasDiagnostics(bundle: PaperParserBundle): bundle is PaperParserBundle & { diagnostics: PipelineDiagnostics } {
  const diagnostics = 'diagnostics' in bundle ? bundle.diagnostics : undefined;
  return (
    typeof diagnostics === 'object' &&
    diagnostics !== null &&
    'warnings' in diagnostics &&
    Array.isArray(diagnostics.warnings)
  );
}

export function writeBundleToStore(bundle: PaperParserBundle, storePath: string, paperId: string): StoredPaperState {
  const resolvedStorePath = resolveStorePath(storePath);
  const bundleDir = join(resolvedStorePath, paperId);
  const serialized = BundleSerializer.toJsonBundle(bundle);
  const diagnosticsPath = join(bundleDir, 'diagnostics.json');

  mkdirSync(bundleDir, { recursive: true });
  writeFileSync(join(bundleDir, 'manifest.json'), JSON.stringify(serialized.manifest, null, 2) + '\n', 'utf8');
  writeFileSync(join(bundleDir, 'graph.json'), JSON.stringify(serialized.graph, null, 2) + '\n', 'utf8');
  writeFileSync(join(bundleDir, 'index.json'), JSON.stringify(serialized.index, null, 2) + '\n', 'utf8');
  if (hasDiagnostics(bundle)) {
    writeFileSync(diagnosticsPath, JSON.stringify(bundle.diagnostics, null, 2) + '\n', 'utf8');
  }
  writeFileSync(
    join(resolvedStorePath, 'latest.json'),
    JSON.stringify(
      {
        paper_id: paperId,
        updated_at: nowIsoUtc(),
      } satisfies LatestPaperRecord,
      null,
      2,
    ) + '\n',
    'utf8',
  );

  return {
    paperId,
    storePath: resolvedStorePath,
    bundleDir,
    ...(hasDiagnostics(bundle) ? { diagnosticsPath } : {}),
  };
}

export function readLatestPaper(storePath: string): LatestPaperRecord | undefined {
  try {
    return JSON.parse(readFileSync(join(resolveStorePath(storePath), 'latest.json'), 'utf8')) as LatestPaperRecord;
  } catch {
    return undefined;
  }
}

export function resolveStoredPaperId(storePath: string, explicitPaperId?: string): string {
  if (explicitPaperId) {
    return explicitPaperId;
  }

  const latest = readLatestPaper(storePath);
  if (!latest) {
    throw new Error(`No stored paper found in ${resolveStorePath(storePath)}.`);
  }

  return latest.paper_id;
}

export function readBundleFromStore(storePath: string, explicitPaperId?: string): { paperId: string; bundle: PaperParserBundle } {
  const resolvedStorePath = resolveStorePath(storePath);
  const paperId = resolveStoredPaperId(resolvedStorePath, explicitPaperId);

  return {
    paperId,
    bundle: JsonStore.readBundle(join(resolvedStorePath, paperId)),
  };
}

export function readSerializedBundleFromStore(
  storePath: string,
  explicitPaperId?: string,
): { paperId: string; bundleDir: string; serializedBundle: ReturnType<typeof JsonStore.readSerializedBundle> } {
  const resolvedStorePath = resolveStorePath(storePath);
  const paperId = resolveStoredPaperId(resolvedStorePath, explicitPaperId);
  const bundleDir = join(resolvedStorePath, paperId);

  return {
    paperId,
    bundleDir,
    serializedBundle: JsonStore.readSerializedBundle(bundleDir),
  };
}

export function listStoredPapers(storePath: string): StoredPaperSummary[] {
  const resolvedStorePath = resolveStorePath(storePath);
  if (!existsSync(resolvedStorePath)) {
    return [];
  }

  const latestPaperId = readLatestPaper(resolvedStorePath)?.paper_id;

  return readdirSync(resolvedStorePath)
    .map((entry) => join(resolvedStorePath, entry))
    .filter((entryPath) => statSync(entryPath).isDirectory())
    .filter((entryPath) => existsSync(join(entryPath, 'manifest.json')))
    .map((entryPath) => {
      const paperId = basename(entryPath);
      return {
        paperId,
        manifest: JsonStore.readBundle(entryPath).manifest,
        isLatest: paperId === latestPaperId,
      };
    })
    .sort((left, right) => left.paperId.localeCompare(right.paperId));
}
