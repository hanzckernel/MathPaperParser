import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { MathTextBlock, prepareMathStatementText, resolveTypesettingMathJax } from '../src/lib/math-render.js';

describe('prepareMathStatementText', () => {
  it('normalizes line-broken theorem fragments and simple package-dependent references', () => {
    const prepared = prepareMathStatementText(`
\\begin{theorem}
Assume $x \\\\
y$. Then \\eqref{eq:key} and Proposition \\ref{prop:key} imply the claim.
\\end{theorem}
`);

    expect(prepared.kind).toBe('typeset');
    if (prepared.kind !== 'typeset') {
      return;
    }

    expect(prepared.normalizedText).not.toContain('\\begin{theorem}');
    expect(prepared.normalizedText).not.toContain('\\end{theorem}');
    expect(prepared.normalizedText).not.toContain('\\eqref{');
    expect(prepared.normalizedText).not.toContain('\\ref{');
    expect(prepared.normalizedText).not.toContain('\n');
    expect(prepared.normalizedText).toContain('(eq:key)');
    expect(prepared.normalizedText).toContain('prop:key');
    expect(prepared.normalizedText).toContain('$x y$');
  });

  it('flattens accepted-corpus itemize fragments into readable prose instead of falling back', () => {
    const prepared = prepareMathStatementText(`
\\begin{definition}
We say $T$ is \\emph{admissible} when:
\\begin{itemize}
\\item $T$ is compact.
\\item $\\mathrm{m}$ is bounded.
\\end{itemize}
\\end{definition}
`);

    expect(prepared.kind).toBe('typeset');
    if (prepared.kind !== 'typeset') {
      return;
    }

    expect(prepared.normalizedText).not.toContain('\\begin{itemize}');
    expect(prepared.normalizedText).not.toContain('\\item');
    expect(prepared.normalizedText).not.toContain('\\emph{');
    expect(prepared.normalizedText).not.toContain('\\mathrm{');
    expect(prepared.normalizedText).toContain('admissible');
    expect(prepared.normalizedText).toContain('$T$ is compact.');
    expect(prepared.normalizedText).toContain('$m$ is bounded.');
  });

  it('strips bounded text wrappers and spacing commands from readable fragments', () => {
    const prepared = prepareMathStatementText(String.raw`
\quad Let $\textbf{A}$ and $\mbox{B}$ satisfy $\text{if } x > 0 \qquad \mathrm{m} = 1$.
`);

    expect(prepared.kind).toBe('typeset');
    if (prepared.kind !== 'typeset') {
      return;
    }

    expect(prepared.normalizedText).not.toContain('\\textbf{');
    expect(prepared.normalizedText).not.toContain('\\mbox{');
    expect(prepared.normalizedText).not.toContain('\\text{');
    expect(prepared.normalizedText).not.toContain('\\mathrm{');
    expect(prepared.normalizedText).not.toContain('\\quad');
    expect(prepared.normalizedText).not.toContain('\\qquad');
    expect(prepared.normalizedText).toContain('Let $A$ and $B$ satisfy $if x > 0 m = 1$.');
  });

  it('salvages bounded cases displays into typeset output instead of treating them as unsupported environments', () => {
    const prepared = prepareMathStatementText(String.raw`
For $x \in \mathbb{R}$ we set
\begin{cases}
1 & \text{if } x > 0 \\
0 & \text{otherwise.}
\end{cases}
`);

    expect(prepared.kind).toBe('typeset');
    if (prepared.kind !== 'typeset') {
      return;
    }

    expect(prepared.normalizedText).not.toContain('\\begin{cases}');
    expect(prepared.normalizedText).not.toContain('\\end{cases}');
    expect(prepared.normalizedText).toContain('if x > 0');
    expect(prepared.normalizedText).toContain('otherwise.');
  });

  it('falls back when unsupported LaTeX environments remain after normalization', () => {
    const source = '\\begin{tikzcd} A \\\\arrow[r] & B \\end{tikzcd}';
    const prepared = prepareMathStatementText(source);

    expect(prepared.kind).toBe('fallback');
    if (prepared.kind !== 'fallback') {
      return;
    }

    expect(prepared.rawText).toBe(source);
    expect(prepared.reason).toContain('Unsupported LaTeX environment');
  });

  it('keeps figure environments on the explicit fallback path', () => {
    const source = String.raw`\begin{figure} \caption{Still not a math fragment.} \end{figure}`;
    const prepared = prepareMathStatementText(source);

    expect(prepared.kind).toBe('fallback');
    if (prepared.kind !== 'fallback') {
      return;
    }

    expect(prepared.reason).toContain('Unsupported LaTeX environment: figure');
  });
});

describe('MathTextBlock', () => {
  it('renders a marked inline fallback block when normalization cannot make the fragment safe', () => {
    const html = renderToStaticMarkup(
      createElement(MathTextBlock, {
        source: '\\begin{tikzcd} A \\\\arrow[r] & B \\end{tikzcd}',
        surface: 'test-surface',
      }),
    );

    expect(html).toContain('data-math-render="fallback"');
    expect(html).toContain('data-math-surface="test-surface"');
    expect(html).toContain('Raw math source');
    expect(html).toContain('\\begin{tikzcd}');
  });
});

describe('resolveTypesettingMathJax', () => {
  it('waits for the MathJax startup promise before requiring browser typesetting hooks', async () => {
    const mathJax: {
      startup: {
        promise?: Promise<void>;
      };
      typesetPromise?: (elements?: Element[]) => Promise<void>;
    } = {
      startup: {},
    };

    mathJax.startup.promise = Promise.resolve().then(() => {
      mathJax.typesetPromise = async () => {};
    });

    await expect(resolveTypesettingMathJax(mathJax)).resolves.toMatchObject({
      typesetPromise: expect.any(Function),
    });
  });

  it('fails explicitly when startup settles without browser typesetting hooks', async () => {
    await expect(
      resolveTypesettingMathJax({
        startup: {
          promise: Promise.resolve(),
        },
      }),
    ).rejects.toThrow('MathJax loaded without browser typesetting hooks.');
  });
});
