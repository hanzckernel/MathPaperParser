import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

import { JsonStore, type PaperParserBundle, type SerializedPaperParserBundle } from '@paperparser/core';

export interface LatestPaperRecord {
  paper_id: string;
  updated_at: string;
}

export interface StoredPaperSummary {
  paperId: string;
  manifest: PaperParserBundle['manifest'];
  isLatest: boolean;
  warningCount: number;
  warningCodes: string[];
  hasEnrichment: boolean;
}

function readDiagnosticsSummary(bundleDir: string): { warningCount: number; warningCodes: string[] } {
  const diagnosticsPath = join(bundleDir, 'diagnostics.json');
  if (!existsSync(diagnosticsPath)) {
    return {
      warningCount: 0,
      warningCodes: [],
    };
  }

  try {
    const diagnostics = JSON.parse(readFileSync(diagnosticsPath, 'utf8')) as {
      warnings?: Array<{ code?: string }>;
    };
    const warnings = Array.isArray(diagnostics.warnings) ? diagnostics.warnings : [];
    const warningCodes = [...new Set(warnings.map((warning) => warning.code).filter((code): code is string => typeof code === 'string'))].sort();
    return {
      warningCount: warnings.length,
      warningCodes,
    };
  } catch {
    return {
      warningCount: 0,
      warningCodes: [],
    };
  }
}

export function resolveStorePath(storePath?: string, cwd = process.cwd()): string {
  return resolve(cwd, storePath ?? '.paperparser-data');
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
): {
  paperId: string;
  bundleDir: string;
  serializedBundle: SerializedPaperParserBundle;
  serializedEnrichment?: ReturnType<typeof JsonStore.readSerializedEnrichment>;
} {
  const resolvedStorePath = resolveStorePath(storePath);
  const paperId = resolveStoredPaperId(resolvedStorePath, explicitPaperId);
  const bundleDir = join(resolvedStorePath, paperId);
  const serializedEnrichment = JsonStore.readSerializedEnrichment(bundleDir);

  return {
    paperId,
    bundleDir,
    serializedBundle: JsonStore.readSerializedBundle(bundleDir),
    ...(serializedEnrichment ? { serializedEnrichment } : {}),
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
      const diagnostics = readDiagnosticsSummary(entryPath);
      return {
        paperId,
        manifest: JsonStore.readBundle(entryPath).manifest,
        isLatest: paperId === latestPaperId,
        warningCount: diagnostics.warningCount,
        warningCodes: diagnostics.warningCodes,
        hasEnrichment: existsSync(join(entryPath, 'enrichment.json')),
      };
    })
    .sort((left, right) => left.paperId.localeCompare(right.paperId));
}
