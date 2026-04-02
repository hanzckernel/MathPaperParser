import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

import { afterEach, describe, expect, it } from 'vitest';

import { ConsistencyChecker, SchemaValidator } from '@paperparser/core';

import { runCli } from '../src/index.js';

const tempDirs: string[] = [];

afterEach(() => {
  tempDirs.length = 0;
});

describe('paperparser cli', () => {
  it('analyzes a markdown file into the configured store and records latest paper state', () => {
    const storePath = mkdtempSync(join(tmpdir(), 'paperparser-cli-'));
    tempDirs.push(storePath);
    const stdout: string[] = [];
    const stderr: string[] = [];

    const exitCode = runCli(
      [
        'analyze',
        'packages/core/test/fixtures/markdown/paper.md',
        '--store',
        storePath,
        '--paper',
        'fixture-markdown',
      ],
      {
        stdout: (line) => stdout.push(line),
        stderr: (line) => stderr.push(line),
      },
    );

    expect(exitCode).toBe(0);
    expect(stderr).toEqual([]);
    expect(stdout.join('\n')).toContain('fixture-markdown');

    const bundleDir = join(storePath, 'fixture-markdown');
    const manifest = JSON.parse(readFileSync(join(bundleDir, 'manifest.json'), 'utf8'));
    const graph = JSON.parse(readFileSync(join(bundleDir, 'graph.json'), 'utf8'));
    const index = JSON.parse(readFileSync(join(bundleDir, 'index.json'), 'utf8'));

    expect(manifest.paper.source_type).toBe('markdown');
    expect(JSON.parse(readFileSync(join(storePath, 'latest.json'), 'utf8')).paper_id).toBe('fixture-markdown');

    expect(() =>
      new SchemaValidator().validateSerializedBundle({
        manifest,
        graph,
        index,
      }),
    ).not.toThrow();
    expect(() =>
      ConsistencyChecker.checkSerializedBundle({
        manifest,
        graph,
        index,
      }),
    ).not.toThrow();
  });

  it('reports latest paper status from the configured store', () => {
    const storePath = mkdtempSync(join(tmpdir(), 'paperparser-cli-'));
    tempDirs.push(storePath);
    const stdout: string[] = [];

    runCli(
      [
        'analyze',
        'packages/core/test/fixtures/latex/project/main.tex',
        '--store',
        storePath,
        '--paper',
        'fixture-latex',
      ],
      {
        stdout: () => {},
        stderr: () => {},
      },
    );

    const exitCode = runCli(
      ['status', '--store', storePath],
      {
        stdout: (line) => stdout.push(line),
        stderr: () => {},
      },
    );

    expect(exitCode).toBe(0);
    expect(stdout.join('\n')).toContain('fixture-latex');
  });

  it('persists diagnostics for the gold paper analyze path and reports them in stdout', () => {
    const storePath = mkdtempSync(join(tmpdir(), 'paperparser-cli-'));
    tempDirs.push(storePath);
    const stdout: string[] = [];
    const stderr: string[] = [];
    const fixturePath = resolve(process.cwd(), 'ref/papers/long_nalini/arXiv-2502.12268v2/main.tex');

    const exitCode = runCli(
      ['analyze', fixturePath, '--store', storePath, '--paper', 'long-nalini'],
      {
        stdout: (line) => stdout.push(line),
        stderr: (line) => stderr.push(line),
      },
    );

    expect(exitCode).toBe(0);
    expect(stderr).toEqual([]);
    expect(stdout.join('\n')).toContain('paper_id=long-nalini');
    expect(stdout.join('\n')).toMatch(/diagnostics/i);
    expect(stdout.join('\n')).toMatch(/warning/i);

    const bundleDir = join(storePath, 'long-nalini');
    const diagnosticsPath = join(bundleDir, 'diagnostics.json');

    expect(existsSync(diagnosticsPath)).toBe(true);

    const diagnostics = JSON.parse(readFileSync(diagnosticsPath, 'utf8'));
    expect(Array.isArray(diagnostics.warnings)).toBe(true);
  });
});
