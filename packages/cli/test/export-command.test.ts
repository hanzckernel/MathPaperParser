import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, expect, it } from 'vitest';

import { runCli } from '../src/index.js';

describe('paperparser cli export', () => {
  it.each([
    {
      label: 'markdown',
      inputPath: 'packages/core/test/fixtures/markdown/paper.md',
      paperId: 'fixture-markdown',
      sourceType: 'markdown',
      title: 'Academic Markdown Fixture',
    },
    {
      label: 'latex',
      inputPath: 'packages/core/test/fixtures/latex/project/main.tex',
      paperId: 'fixture-latex',
      sourceType: 'latex',
      title: 'Tracked LaTeX Fixture',
    },
  ])('exports a stored $label paper as a static dashboard bundle', ({ inputPath, paperId, sourceType, title }) => {
    const storePath = mkdtempSync(join(tmpdir(), 'paperparser-export-store-'));
    const outputPath = mkdtempSync(join(tmpdir(), 'paperparser-export-out-'));

    const analyzeExitCode = runCli(
      ['analyze', inputPath, '--store', storePath, '--paper', paperId],
      {
        stdout: () => {},
        stderr: () => {},
      },
    );
    expect(analyzeExitCode).toBe(0);

    const stdout: string[] = [];
    const stderr: string[] = [];
    const exportExitCode = runCli(
      ['export', '--store', storePath, '--paper', paperId, '--output', outputPath],
      {
        stdout: (line) => stdout.push(line),
        stderr: (line) => stderr.push(line),
      },
    );

    expect(exportExitCode).toBe(0);
    expect(stderr).toEqual([]);
    expect(stdout.join('\n')).toContain(outputPath);

    expect(existsSync(join(outputPath, 'index.html'))).toBe(true);
    expect(existsSync(join(outputPath, 'data', 'manifest.json'))).toBe(true);
    expect(existsSync(join(outputPath, 'data', 'graph.json'))).toBe(true);
    expect(existsSync(join(outputPath, 'data', 'index.json'))).toBe(true);
    expect(existsSync(join(outputPath, 'data', 'enrichment.json'))).toBe(true);
    expect(existsSync(join(outputPath, 'assets', 'sre', 'speech-worker.js'))).toBe(true);
    expect(readdirSync(join(outputPath, 'assets')).some((entry) => entry.endsWith('.js'))).toBe(true);

    const manifest = JSON.parse(readFileSync(join(outputPath, 'data', 'manifest.json'), 'utf8')) as {
      paper: { source_type: string; title: string };
    };
    expect(manifest.paper.source_type).toBe(sourceType);
    expect(manifest.paper.title).toBe(title);
    expect(JSON.parse(readFileSync(join(outputPath, 'data', 'enrichment.json'), 'utf8'))).toBeNull();
  });

  it('copies enrichment.json into the exported static dashboard when a sidecar exists', () => {
    const storePath = mkdtempSync(join(tmpdir(), 'paperparser-export-store-'));
    const outputPath = mkdtempSync(join(tmpdir(), 'paperparser-export-out-'));
    const analyzeExitCode = runCli(
      ['analyze', 'packages/core/test/fixtures/latex/canonical-objects/main.tex', '--store', storePath, '--paper', 'fixture-canonical'],
      {
        stdout: () => {},
        stderr: () => {},
      },
    );
    expect(analyzeExitCode).toBe(0);

    const enrichExitCode = runCli(
      ['enrich', '--store', storePath, '--paper', 'fixture-canonical'],
      {
        stdout: () => {},
        stderr: () => {},
      },
    );
    expect(enrichExitCode).toBe(0);

    const exportExitCode = runCli(
      ['export', '--store', storePath, '--paper', 'fixture-canonical', '--output', outputPath],
      {
        stdout: () => {},
        stderr: () => {},
      },
    );

    expect(exportExitCode).toBe(0);
    expect(existsSync(join(outputPath, 'data', 'enrichment.json'))).toBe(true);
    const enrichment = JSON.parse(readFileSync(join(outputPath, 'data', 'enrichment.json'), 'utf8')) as {
      paper_id: string;
      edges: Array<{ provenance: string }>;
    };
    expect(enrichment.paper_id).toBe('fixture-canonical');
    expect(enrichment.edges.every((edge) => edge.provenance === 'agent_inferred')).toBe(true);
  });

  it('exports the latest stored paper when --paper latest is used', () => {
    const storePath = mkdtempSync(join(tmpdir(), 'paperparser-export-store-'));
    const outputPath = mkdtempSync(join(tmpdir(), 'paperparser-export-out-'));

    expect(
      runCli(['analyze', 'packages/core/test/fixtures/markdown/paper.md', '--store', storePath, '--paper', 'fixture-markdown'], {
        stdout: () => {},
        stderr: () => {},
      }),
    ).toBe(0);
    expect(
      runCli(['analyze', 'packages/core/test/fixtures/latex/project/main.tex', '--store', storePath, '--paper', 'fixture-latex'], {
        stdout: () => {},
        stderr: () => {},
      }),
    ).toBe(0);

    const stdout: string[] = [];
    const stderr: string[] = [];
    const exportExitCode = runCli(
      ['export', '--store', storePath, '--paper', 'latest', '--output', outputPath],
      {
        stdout: (line) => stdout.push(line),
        stderr: (line) => stderr.push(line),
      },
    );

    expect(exportExitCode).toBe(0);
    expect(stderr).toEqual([]);
    expect(stdout.join('\n')).toContain(outputPath);

    const manifest = JSON.parse(readFileSync(join(outputPath, 'data', 'manifest.json'), 'utf8')) as {
      paper: { title: string };
    };
    expect(manifest.paper.title).toBe('Tracked LaTeX Fixture');
  });

  it('replaces stale files when exporting into an existing output directory', () => {
    const storePath = mkdtempSync(join(tmpdir(), 'paperparser-export-store-'));
    const outputPath = mkdtempSync(join(tmpdir(), 'paperparser-export-out-'));
    const stalePath = join(outputPath, 'stale.txt');

    expect(
      runCli(['analyze', 'packages/core/test/fixtures/markdown/paper.md', '--store', storePath, '--paper', 'fixture-markdown'], {
        stdout: () => {},
        stderr: () => {},
      }),
    ).toBe(0);

    writeFileSync(stalePath, 'stale\n', 'utf8');
    expect(existsSync(stalePath)).toBe(true);

    const exportExitCode = runCli(
      ['export', '--store', storePath, '--paper', 'fixture-markdown', '--output', outputPath],
      {
        stdout: () => {},
        stderr: () => {},
      },
    );

    expect(exportExitCode).toBe(0);
    expect(existsSync(stalePath)).toBe(false);
    expect(existsSync(join(outputPath, 'index.html'))).toBe(true);
    expect(existsSync(join(outputPath, 'data', 'manifest.json'))).toBe(true);
  });
});
