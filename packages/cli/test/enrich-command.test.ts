import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, expect, it } from 'vitest';

import { runCli } from '../src/index.js';

describe('paperparser cli enrich', () => {
  it('creates a separate enrichment sidecar without mutating the canonical bundle files', () => {
    const storePath = mkdtempSync(join(tmpdir(), 'paperparser-enrich-store-'));
    const analyzeExitCode = runCli(
      ['analyze', 'packages/core/test/fixtures/latex/canonical-objects/main.tex', '--store', storePath, '--paper', 'fixture-canonical'],
      {
        stdout: () => {},
        stderr: () => {},
      },
    );
    expect(analyzeExitCode).toBe(0);

    const bundleDir = join(storePath, 'fixture-canonical');
    const manifestBefore = readFileSync(join(bundleDir, 'manifest.json'), 'utf8');
    const graphBefore = readFileSync(join(bundleDir, 'graph.json'), 'utf8');
    const indexBefore = readFileSync(join(bundleDir, 'index.json'), 'utf8');

    const stdout: string[] = [];
    const stderr: string[] = [];
    const enrichExitCode = runCli(
      ['enrich', '--store', storePath, '--paper', 'fixture-canonical'],
      {
        stdout: (line) => stdout.push(line),
        stderr: (line) => stderr.push(line),
      },
    );

    expect(enrichExitCode).toBe(0);
    expect(stderr).toEqual([]);
    expect(stdout.join('\n')).toContain('paper_id=fixture-canonical');
    expect(stdout.join('\n')).toMatch(/candidate_count=/);

    const enrichmentPath = join(bundleDir, 'enrichment.json');
    expect(existsSync(enrichmentPath)).toBe(true);
    expect(readFileSync(join(bundleDir, 'manifest.json'), 'utf8')).toBe(manifestBefore);
    expect(readFileSync(join(bundleDir, 'graph.json'), 'utf8')).toBe(graphBefore);
    expect(readFileSync(join(bundleDir, 'index.json'), 'utf8')).toBe(indexBefore);

    const enrichment = JSON.parse(readFileSync(enrichmentPath, 'utf8')) as {
      provider: { agent: string };
      edges: Array<{ confidence: number; review_status: string }>;
    };
    expect(enrichment.provider.agent).toBe('paperparser-v2/heuristic-reviewer');
    expect(enrichment.edges.length).toBeGreaterThan(0);
    expect(enrichment.edges.every((edge) => edge.confidence > 0 && edge.review_status === 'pending')).toBe(true);
  });
});
