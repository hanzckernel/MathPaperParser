import { existsSync, mkdtempSync, readFileSync, readdirSync } from 'node:fs';
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
    expect(readdirSync(join(outputPath, 'assets')).some((entry) => entry.endsWith('.js'))).toBe(true);

    const manifest = JSON.parse(readFileSync(join(outputPath, 'data', 'manifest.json'), 'utf8')) as {
      paper: { source_type: string; title: string };
    };
    expect(manifest.paper.source_type).toBe(sourceType);
    expect(manifest.paper.title).toBe(title);
  });
});
