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

    const queryStdout: string[] = [];
    const queryExitCode = runCli(['query', 'hyperbolic', '--store', storePath, '--paper', 'long-nalini', '--json'], {
      stdout: (line) => queryStdout.push(line),
      stderr: () => {},
    });
    expect(queryExitCode).toBe(0);
    const query = JSON.parse(queryStdout.join('\n')) as {
      results: Array<{ nodeId: string }>;
    };
    expect(query.results.some((result) => result.nodeId === 'sec1::thm:t-dream')).toBe(true);

    const contextStdout: string[] = [];
    const contextExitCode = runCli(['context', 'sec1::thm:t-dream', '--store', storePath, '--paper', 'long-nalini', '--json'], {
      stdout: (line) => contextStdout.push(line),
      stderr: () => {},
    });
    expect(contextExitCode).toBe(0);
    const context = JSON.parse(contextStdout.join('\n')) as {
      node: { id: string; section: string };
    };
    expect(context.node.id).toBe('sec1::thm:t-dream');
    expect(context.node.section).toBe('1');

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
    expect(diagnostics.warnings.filter((warning) => warning.code === 'unresolved_reference')).toHaveLength(7);
    expect(diagnostics.warnings.filter((warning) => warning.code === 'unsupported_reference_command')).toHaveLength(0);

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

  it('runs the accepted multi-paper workflow across the full milestone corpus in one local store', () => {
    const storePath = mkdtempSync(join(tmpdir(), 'paperparser-multi-accept-store-'));
    const fixtures = [
      ['long-nalini', resolve(process.cwd(), 'ref/papers/long_nalini/arXiv-2502.12268v2/main.tex')],
      ['medium-mueller', resolve(process.cwd(), 'ref/papers/medium_Mueller.flat.tex')],
      ['short-petri', resolve(process.cwd(), 'ref/papers/short_Petri.tex')],
    ] as const;

    for (const [paperId, fixturePath] of fixtures) {
      const analyzeExitCode = runCli(['analyze', fixturePath, '--store', storePath, '--paper', paperId], {
        stdout: () => {},
        stderr: () => {},
      });
      expect(analyzeExitCode).toBe(0);
    }

    const listStdout: string[] = [];
    const listExitCode = runCli(['list', '--store', storePath, '--json'], {
      stdout: (line) => listStdout.push(line),
      stderr: () => {},
    });
    expect(listExitCode).toBe(0);
    const listing = JSON.parse(listStdout.join('\n')) as {
      papers: Array<{ paperId: string }>;
    };
    expect(listing.papers.map((paper) => paper.paperId)).toEqual(['long-nalini', 'medium-mueller', 'short-petri']);

    const longValidateStdout: string[] = [];
    expect(runCli(['validate', '--store', storePath, '--paper', 'long-nalini', '--json'], {
      stdout: (line) => longValidateStdout.push(line),
      stderr: () => {},
    })).toBe(0);
    expect(JSON.parse(longValidateStdout.join('\n')).ok).toBe(true);

    const mediumValidateStdout: string[] = [];
    expect(runCli(['validate', '--store', storePath, '--paper', 'medium-mueller', '--json'], {
      stdout: (line) => mediumValidateStdout.push(line),
      stderr: () => {},
    })).toBe(0);
    expect(JSON.parse(mediumValidateStdout.join('\n')).ok).toBe(true);

    const shortValidateStdout: string[] = [];
    expect(runCli(['validate', '--store', storePath, '--paper', 'short-petri', '--json'], {
      stdout: (line) => shortValidateStdout.push(line),
      stderr: () => {},
    })).toBe(0);
    expect(JSON.parse(shortValidateStdout.join('\n')).ok).toBe(true);

    const longQueryStdout: string[] = [];
    expect(runCli(['query', 'hyperbolic', '--store', storePath, '--paper', 'long-nalini', '--json'], {
      stdout: (line) => longQueryStdout.push(line),
      stderr: () => {},
    })).toBe(0);
    expect((JSON.parse(longQueryStdout.join('\n')) as { results: Array<{ nodeId: string }> }).results.some((result) => result.nodeId === 'sec1::thm:t-dream')).toBe(true);

    const mediumQueryStdout: string[] = [];
    expect(runCli(['query', 'torsion', '--store', storePath, '--paper', 'medium-mueller', '--json'], {
      stdout: (line) => mediumQueryStdout.push(line),
      stderr: () => {},
    })).toBe(0);
    expect((JSON.parse(mediumQueryStdout.join('\n')) as { results: Array<{ nodeId: string }> }).results.some((result) => result.nodeId === 'sec12::eq:l2-torsion')).toBe(true);

    const shortQueryStdout: string[] = [];
    expect(runCli(['query', 'Cheeger constant', '--store', storePath, '--paper', 'short-petri', '--json'], {
      stdout: (line) => shortQueryStdout.push(line),
      stderr: () => {},
    })).toBe(0);
    expect((JSON.parse(shortQueryStdout.join('\n')) as { results: Array<{ nodeId: string }> }).results.some((result) => result.nodeId === 'sec1::eq:eq-defcheeger')).toBe(true);

    const shortContextStdout: string[] = [];
    expect(runCli(['context', 'sec1::eq:eq-defcheeger', '--store', storePath, '--paper', 'short-petri', '--json'], {
      stdout: (line) => shortContextStdout.push(line),
      stderr: () => {},
    })).toBe(0);
    expect((JSON.parse(shortContextStdout.join('\n')) as { node: { id: string } }).node.id).toBe('sec1::eq:eq-defcheeger');

    const relatedStdout: string[] = [];
    expect(runCli(['related', 'sec1::thm:t-dream', '--store', storePath, '--paper', 'long-nalini', '--json'], {
      stdout: (line) => relatedStdout.push(line),
      stderr: () => {},
    })).toBe(0);
    const related = JSON.parse(relatedStdout.join('\n')) as {
      matches: Array<{ targetPaperId: string; targetNodeId: string; evidenceTerms: string[] }>;
    };
    expect(related.matches[0]?.targetPaperId).toBe('short-petri');
    expect(related.matches[0]?.targetNodeId).toBe('sec1::thm:thm-main');
    expect(related.matches[0]?.evidenceTerms).toEqual(expect.arrayContaining(['hyperbolic', 'surface']));
  });
});
