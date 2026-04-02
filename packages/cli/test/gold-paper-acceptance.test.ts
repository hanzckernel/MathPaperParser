import { existsSync, mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, expect, it } from 'vitest';

import { runCli } from '../src/index.js';

describe('gold paper acceptance workflow', () => {
  it('runs analyze, enrich, validate, and export end to end on long_nalini without manual intervention', () => {
    const storePath = mkdtempSync(join(tmpdir(), 'paperparser-gold-accept-store-'));
    const outputPath = mkdtempSync(join(tmpdir(), 'paperparser-gold-accept-out-'));
    const fixturePath = resolve(process.cwd(), 'ref/papers/long_nalini/arXiv-2502.12268v2/main.tex');

    const analyzeStdout: string[] = [];
    const analyzeExitCode = runCli(['analyze', fixturePath, '--store', storePath, '--paper', 'long-nalini'], {
      stdout: (line) => analyzeStdout.push(line),
      stderr: () => {},
    });
    expect(analyzeExitCode).toBe(0);
    expect(analyzeStdout.join('\n')).toContain('paper_id=long-nalini');
    expect(analyzeStdout.join('\n')).toMatch(/warning_count=/);

    const enrichStdout: string[] = [];
    const enrichExitCode = runCli(['enrich', '--store', storePath, '--paper', 'long-nalini'], {
      stdout: (line) => enrichStdout.push(line),
      stderr: () => {},
    });
    expect(enrichExitCode).toBe(0);
    expect(enrichStdout.join('\n')).toContain('paper_id=long-nalini');
    expect(enrichStdout.join('\n')).toMatch(/candidate_count=/);

    const validateStdout: string[] = [];
    const validateExitCode = runCli(['validate', '--store', storePath, '--paper', 'long-nalini', '--json'], {
      stdout: (line) => validateStdout.push(line),
      stderr: () => {},
    });
    expect(validateExitCode).toBe(0);
    const validation = JSON.parse(validateStdout.join('\n')) as {
      ok: boolean;
      nodeCount: number;
      edgeCount: number;
    };
    expect(validation.ok).toBe(true);
    expect(validation.nodeCount).toBeGreaterThan(300);
    expect(validation.edgeCount).toBeGreaterThan(500);

    const exportStdout: string[] = [];
    const exportExitCode = runCli(['export', '--store', storePath, '--paper', 'long-nalini', '--output', outputPath], {
      stdout: (line) => exportStdout.push(line),
      stderr: () => {},
    });
    expect(exportExitCode).toBe(0);
    expect(exportStdout.join('\n')).toContain(outputPath);

    const bundleDir = join(storePath, 'long-nalini');
    expect(existsSync(join(bundleDir, 'diagnostics.json'))).toBe(true);
    expect(existsSync(join(bundleDir, 'manifest.json'))).toBe(true);
    expect(existsSync(join(bundleDir, 'graph.json'))).toBe(true);
    expect(existsSync(join(bundleDir, 'index.json'))).toBe(true);
    expect(existsSync(join(bundleDir, 'enrichment.json'))).toBe(true);

    const diagnostics = JSON.parse(readFileSync(join(bundleDir, 'diagnostics.json'), 'utf8')) as {
      warnings: Array<{ code: string }>;
    };
    expect(diagnostics.warnings.filter((warning) => warning.code === 'unresolved_reference')).toHaveLength(22);
    expect(diagnostics.warnings.filter((warning) => warning.code === 'unsupported_reference_command')).toHaveLength(2);

    const enrichment = JSON.parse(readFileSync(join(bundleDir, 'enrichment.json'), 'utf8')) as {
      edges: Array<{ provenance: string }>;
    };
    expect(enrichment.edges.length).toBeGreaterThan(0);
    expect(enrichment.edges.every((edge) => edge.provenance === 'agent_inferred')).toBe(true);

    expect(existsSync(join(outputPath, 'index.html'))).toBe(true);
    expect(existsSync(join(outputPath, 'data', 'manifest.json'))).toBe(true);
    expect(existsSync(join(outputPath, 'data', 'graph.json'))).toBe(true);
    expect(existsSync(join(outputPath, 'data', 'index.json'))).toBe(true);
    expect(existsSync(join(outputPath, 'data', 'enrichment.json'))).toBe(true);
    expect(readdirSync(join(outputPath, 'assets')).some((entry) => entry.endsWith('.js'))).toBe(true);
  });
});
