import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, expect, it } from 'vitest';

import { runCli } from '../src/index.js';

function analyzeFixture(storePath: string, input: string, paperId: string): void {
  const exitCode = runCli(['analyze', input, '--store', storePath, '--paper', paperId], {
    stdout: () => {},
    stderr: () => {},
  });

  expect(exitCode).toBe(0);
}

describe('paperparser cli read commands', () => {
  it('lists stored papers and validates a selected paper', () => {
    const storePath = mkdtempSync(join(tmpdir(), 'paperparser-cli-'));
    analyzeFixture(storePath, 'packages/core/test/fixtures/markdown/paper.md', 'fixture-markdown');
    analyzeFixture(storePath, 'packages/core/test/fixtures/latex/project/main.tex', 'fixture-latex');
    const enrichExitCode = runCli(['enrich', '--store', storePath, '--paper', 'fixture-latex'], {
      stdout: () => {},
      stderr: () => {},
    });
    expect(enrichExitCode).toBe(0);

    const listStdout: string[] = [];
    const listExitCode = runCli(['list', '--store', storePath, '--json'], {
      stdout: (line) => listStdout.push(line),
      stderr: () => {},
    });

    expect(listExitCode).toBe(0);
    const listResult = JSON.parse(listStdout.join('\n')) as {
      latestPaperId: string;
      papers: Array<{ paperId: string; sourceType: string; warningCount: number; hasEnrichment: boolean }>;
    };
    expect(listResult.latestPaperId).toBe('fixture-latex');
    expect(listResult.papers.map((paper) => paper.paperId).sort()).toEqual(['fixture-latex', 'fixture-markdown']);
    expect(listResult.papers.find((paper) => paper.paperId === 'fixture-markdown')?.sourceType).toBe('markdown');
    expect(listResult.papers.find((paper) => paper.paperId === 'fixture-markdown')?.warningCount).toBe(0);
    expect(listResult.papers.find((paper) => paper.paperId === 'fixture-latex')?.hasEnrichment).toBe(true);

    const validateStdout: string[] = [];
    const validateExitCode = runCli(['validate', '--store', storePath, '--paper', 'fixture-markdown', '--json'], {
      stdout: (line) => validateStdout.push(line),
      stderr: () => {},
    });

    expect(validateExitCode).toBe(0);
    const validateResult = JSON.parse(validateStdout.join('\n')) as {
      ok: boolean;
      paperId: string;
      sourceType: string;
    };
    expect(validateResult.ok).toBe(true);
    expect(validateResult.paperId).toBe('fixture-markdown');
    expect(validateResult.sourceType).toBe('markdown');
  });

  it('queries stored papers and reports context plus reverse impact in json mode', () => {
    const storePath = mkdtempSync(join(tmpdir(), 'paperparser-cli-'));
    analyzeFixture(storePath, 'packages/core/test/fixtures/markdown/paper.md', 'fixture-markdown');

    const queryStdout: string[] = [];
    const queryExitCode = runCli(['query', 'compact main result', '--store', storePath, '--paper', 'fixture-markdown', '--json'], {
      stdout: (line) => queryStdout.push(line),
      stderr: () => {},
    });

    expect(queryExitCode).toBe(0);
    const queryResult = JSON.parse(queryStdout.join('\n')) as {
      results: Array<{ nodeId: string; nodeKind: string; label: string; number: string }>;
    };
    expect(queryResult.results[0]?.nodeId).toBe('sec1::thm:thm-main');
    expect(queryResult.results[0]?.nodeKind).toBe('theorem');
    expect(queryResult.results[0]?.label).toContain('Theorem 2.1');
    expect(queryResult.results[0]?.number).toBe('2.1');

    const contextStdout: string[] = [];
    const contextExitCode = runCli(['context', 'sec2::lem:lem-bounded', '--store', storePath, '--paper', 'fixture-markdown', '--json'], {
      stdout: (line) => contextStdout.push(line),
      stderr: () => {},
    });

    expect(contextExitCode).toBe(0);
    const contextResult = JSON.parse(contextStdout.join('\n')) as {
      node: { id: string };
      outgoingEdges: Array<{ target: string }>;
    };
    expect(contextResult.node.id).toBe('sec2::lem:lem-bounded');
    expect(contextResult.outgoingEdges[0]?.target).toBe('sec1::thm:thm-main');

    const impactStdout: string[] = [];
    const impactExitCode = runCli(['impact', 'sec1::thm:thm-main', '--store', storePath, '--paper', 'fixture-markdown', '--json'], {
      stdout: (line) => impactStdout.push(line),
      stderr: () => {},
    });

    expect(impactExitCode).toBe(0);
    const impactResult = JSON.parse(impactStdout.join('\n')) as {
      dependentNodes: Array<{ id: string }>;
    };
    expect(impactResult.dependentNodes.map((node) => node.id)).toEqual(['sec2::lem:lem-bounded']);
  });

  it('reports explainable related nodes across the local corpus in json mode', () => {
    const storePath = mkdtempSync(join(tmpdir(), 'paperparser-cli-'));
    analyzeFixture(storePath, 'packages/core/test/fixtures/markdown/paper.md', 'fixture-markdown');
    analyzeFixture(storePath, 'packages/core/test/fixtures/latex/project/main.tex', 'fixture-latex');

    const relatedStdout: string[] = [];
    const relatedExitCode = runCli(['related', 'sec1::thm:thm-main', '--store', storePath, '--paper', 'fixture-markdown', '--json'], {
      stdout: (line) => relatedStdout.push(line),
      stderr: () => {},
    });

    expect(relatedExitCode).toBe(0);
    const relatedResult = JSON.parse(relatedStdout.join('\n')) as {
      sourcePaperId: string;
      sourceNodeId: string;
      matches: Array<{ targetPaperId: string; targetNodeId: string; evidenceTerms: string[] }>;
    };
    expect(relatedResult.sourcePaperId).toBe('fixture-markdown');
    expect(relatedResult.sourceNodeId).toBe('sec1::thm:thm-main');
    expect(relatedResult.matches[0]?.targetPaperId).toBe('fixture-latex');
    expect(relatedResult.matches[0]?.targetNodeId).toBe('sec1::thm:thm-fixture');
    expect(relatedResult.matches[0]?.evidenceTerms).toEqual(expect.arrayContaining(['compact', 'set']));
  });
});
