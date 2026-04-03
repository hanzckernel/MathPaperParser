import { useEffect, useRef, useState } from 'react';

import mathJaxBundleUrl from 'mathjax/tex-chtml-nofont.js?url';

type PreparedMathStatement =
  | {
      kind: 'typeset';
      normalizedText: string;
    }
  | {
      kind: 'fallback';
      normalizedText: string;
      rawText: string;
      reason: string;
    };

type BrowserMathJax = {
  startup?: {
    promise?: Promise<unknown>;
  };
  typesetPromise: (elements?: Element[]) => Promise<void>;
  typesetClear?: (elements?: Element[]) => void;
};

type BrowserMathJaxConfig = Partial<BrowserMathJax> & {
  startup?: {
    typeset?: boolean;
    promise?: Promise<unknown>;
  };
  tex?: {
    inlineMath?: Array<[string, string]>;
    displayMath?: Array<[string, string]>;
    packages?: Record<string, string[]>;
  };
  options?: {
    skipHtmlTags?: string[];
  };
};

declare global {
  interface Window {
    MathJax?: BrowserMathJax | BrowserMathJaxConfig;
  }
}

const THEOREM_WRAPPER_ENVIRONMENTS = [
  'theorem',
  'theorem*',
  'lemma',
  'lemma*',
  'proposition',
  'proposition*',
  'corollary',
  'corollary*',
  'definition',
  'definition*',
  'remark',
  'remark*',
  'example',
  'example*',
  'assumption',
  'assumption*',
  'conjecture',
  'conjecture*',
  'proof',
  'proof*',
] as const;

const DISPLAY_ENVIRONMENTS = ['equation', 'equation*', 'align', 'align*', 'aligned', 'gather', 'gather*', 'split', 'multline', 'multline*'] as const;
const LIST_ENVIRONMENTS = ['itemize', 'enumerate'] as const;
const READABLE_WRAPPER_COMMANDS = ['emph', 'text', 'textbf', 'textit', 'mathrm', 'mbox'] as const;

const REMAINING_UNSUPPORTED_COMMANDS = [/\\(?:ref|eqref|cite|label)\s*\{/u, /\\(?:require|newtheorem|tikz|tikzcd)\b/u];

let mathJaxPromise: Promise<BrowserMathJax> | null = null;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\r\n?/gu, '\n').replace(/[ \t]*\n[ \t]*/gu, ' ').replace(/\s+/gu, ' ').trim();
}

function stripReadableWrapperCommands(source: string): string {
  let current = source;
  let changed = true;

  const commandPattern = new RegExp(`\\\\(?:${READABLE_WRAPPER_COMMANDS.map(escapeRegExp).join('|')})\\{([^{}]*)\\}`, 'gu');
  while (changed) {
    changed = false;
    current = current.replace(commandPattern, (_, body: string) => {
      changed = true;
      return body;
    });
  }

  return current;
}

function rewriteEnvironments(source: string, environments: readonly string[], replacer: (body: string) => string): string {
  return environments.reduce((current, environment) => {
    const pattern = new RegExp(`\\\\begin\\{${escapeRegExp(environment)}\\}([\\s\\S]*?)\\\\end\\{${escapeRegExp(environment)}\\}`, 'gu');
    return current.replace(pattern, (_, body: string) => replacer(body));
  }, source);
}

function normalizeDisplayBody(body: string): string {
  return normalizeWhitespace(body.replace(/&/gu, ' ').replace(/\\\\/gu, ' \\qquad '));
}

function normalizeListBody(body: string, ordered: boolean): string {
  const items = body
    .split(/\\item\b/gu)
    .map((item) => normalizeWhitespace(item))
    .filter(Boolean);

  if (items.length === 0) {
    return normalizeWhitespace(body);
  }

  return items.map((item, index) => (ordered ? `${index + 1}. ${item}` : `- ${item}`)).join(' ');
}

function normalizeCasesBody(body: string): string {
  const rows = body
    .split(/\\\\/gu)
    .map((row) => normalizeWhitespace(row))
    .filter(Boolean);

  if (rows.length === 0) {
    return normalizeWhitespace(body);
  }

  return rows
    .map((row) => {
      const columns = row
        .split(/&/gu)
        .map((column) => normalizeWhitespace(column))
        .filter(Boolean);

      if (columns.length >= 2) {
        const [head, ...rest] = columns;
        return `$${head}$ ${rest.join(' ')}`;
      }

      return `$${columns[0] ?? row}$`;
    })
    .join('; ');
}

function hasUnsupportedEnvironment(value: string): string | null {
  const match = value.match(/\\begin\{([^}]+)\}|\\end\{([^}]+)\}/u);
  if (!match) {
    return null;
  }

  return match[1] ?? match[2] ?? null;
}

function ensureMathJaxWindow(): BrowserMathJax | BrowserMathJaxConfig {
  const current = window.MathJax as BrowserMathJax | BrowserMathJaxConfig | undefined;
  if (current?.typesetPromise) {
    return current;
  }

  const config: BrowserMathJaxConfig = {
    startup: {
      typeset: false,
    },
    tex: {
      inlineMath: [['$', '$'], ['\\(', '\\)']],
      displayMath: [['$$', '$$'], ['\\[', '\\]']],
      packages: {
        '[-]': ['ams', 'autoload', 'require', 'noundefined'],
      },
    },
    options: {
      skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
    },
  };
  window.MathJax = config;
  return config;
}

async function loadMathJax(): Promise<BrowserMathJax> {
  if (typeof window === 'undefined') {
    throw new Error('MathJax can only load in the browser runtime.');
  }

  const existing = window.MathJax as BrowserMathJax | undefined;
  if (existing?.typesetPromise) {
    await existing.startup?.promise;
    return existing;
  }

  if (!mathJaxPromise) {
    mathJaxPromise = new Promise<BrowserMathJax>((resolve, reject) => {
      ensureMathJaxWindow();

      const script = window.document.createElement('script');
      script.src = mathJaxBundleUrl;
      script.async = true;
      script.onload = async () => {
        const loaded = window.MathJax as BrowserMathJax | undefined;
        if (!loaded?.typesetPromise) {
          reject(new Error('MathJax loaded without browser typesetting hooks.'));
          return;
        }

        try {
          await loaded.startup?.promise;
          resolve(loaded);
        } catch (error) {
          reject(error);
        }
      };
      script.onerror = () => reject(new Error('Failed to load the bundled MathJax runtime.'));
      window.document.head.appendChild(script);
    });
  }

  return mathJaxPromise;
}

function fallback(rawText: string, reason: string, normalizedText = rawText): PreparedMathStatement {
  return {
    kind: 'fallback',
    rawText,
    reason,
    normalizedText,
  };
}

export function prepareMathStatementText(source: string): PreparedMathStatement {
  const rawText = source;
  let normalizedText = source.replace(/\r\n?/gu, '\n').trim();

  normalizedText = rewriteEnvironments(normalizedText, THEOREM_WRAPPER_ENVIRONMENTS, (body) => body);
  normalizedText = rewriteEnvironments(normalizedText, DISPLAY_ENVIRONMENTS, (body) => `$$ ${normalizeDisplayBody(body)} $$`);
  normalizedText = rewriteEnvironments(normalizedText, ['itemize'], (body) => normalizeListBody(body, false));
  normalizedText = rewriteEnvironments(normalizedText, ['enumerate'], (body) => normalizeListBody(body, true));
  normalizedText = rewriteEnvironments(normalizedText, ['cases'], (body) => normalizeCasesBody(body));
  normalizedText = stripReadableWrapperCommands(normalizedText);
  normalizedText = normalizedText
    .replace(/\\protect\b/gu, '')
    .replace(/\\label\{[^{}]*\}/gu, '')
    .replace(/\\eqref\{([^{}]+)\}/gu, '($1)')
    .replace(/\\ref\{([^{}]+)\}/gu, '$1')
    .replace(/\\cite\{([^{}]+)\}/gu, (_, citeKeys: string) => `[${citeKeys.split(',').map((key) => key.trim()).filter(Boolean).join(', ')}]`)
    .replace(/\\(?:quad|qquad)\b/gu, ' ')
    .replace(/\\\\/gu, ' ')
    .replace(/[ \t]*\n[ \t]*/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();

  const unsupportedEnvironment = hasUnsupportedEnvironment(normalizedText);
  if (unsupportedEnvironment) {
    return fallback(rawText, `Unsupported LaTeX environment: ${unsupportedEnvironment}`, normalizedText);
  }

  for (const commandPattern of REMAINING_UNSUPPORTED_COMMANDS) {
    if (commandPattern.test(normalizedText)) {
      return fallback(rawText, 'Unsupported LaTeX command remained after normalization.', normalizedText);
    }
  }

  return {
    kind: 'typeset',
    normalizedText,
  };
}

export function MathTextBlock({
  source,
  surface,
}: {
  source: string;
  surface: string;
}) {
  const prepared = prepareMathStatementText(source);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [runtimeFailure, setRuntimeFailure] = useState<string | null>(null);
  const fallbackReason = prepared.kind === 'fallback' ? prepared.reason : runtimeFailure;

  useEffect(() => {
    if (prepared.kind !== 'typeset') {
      setRuntimeFailure(null);
      return;
    }

    let active = true;
    const element = containerRef.current;
    if (!element) {
      return;
    }

    element.textContent = prepared.normalizedText;
    setRuntimeFailure(null);

    void loadMathJax()
      .then(async (mathJax) => {
        if (!active) {
          return;
        }

        mathJax.typesetClear?.([element]);
        element.textContent = prepared.normalizedText;
        await mathJax.typesetPromise([element]);
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        setRuntimeFailure(error instanceof Error ? error.message : 'MathJax failed to render the statement.');
      });

    return () => {
      active = false;
      const current = containerRef.current;
      if (current && typeof window !== 'undefined') {
        const mathJax = window.MathJax as BrowserMathJax | undefined;
        mathJax?.typesetClear?.([current]);
      }
    };
  }, [prepared.kind, prepared.kind === 'typeset' ? prepared.normalizedText : null]);

  if (prepared.kind === 'fallback' || runtimeFailure) {
    return (
      <div
        data-math-render="fallback"
        data-math-surface={surface}
        style={{
          display: 'grid',
          gap: '0.5rem',
          overflowX: 'auto',
          maxWidth: '100%',
          whiteSpace: 'normal',
          lineHeight: 1.6,
          borderRadius: '14px',
          padding: '0.9rem',
          background: 'rgba(15, 23, 42, 0.45)',
          border: '1px solid rgba(248, 113, 113, 0.28)',
        }}
      >
        <div style={{ color: '#fca5a5', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Raw math source
        </div>
        <div style={{ color: '#fecaca', fontSize: '0.9rem' }}>{fallbackReason}</div>
        <pre
          style={{
            margin: 0,
            whiteSpace: 'pre-wrap',
            overflowX: 'auto',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.9rem',
            color: '#e2e8f0',
          }}
        >
          {source}
        </pre>
      </div>
    );
  }

  return (
    <div
      data-math-render="typeset"
      data-math-surface={surface}
      style={{
        overflowX: 'auto',
        maxWidth: '100%',
        whiteSpace: 'normal',
        lineHeight: 1.6,
        borderRadius: '14px',
        padding: '0.9rem',
        background: 'rgba(15, 23, 42, 0.45)',
      }}
    >
      <div
        ref={containerRef}
        suppressHydrationWarning
        style={{
          minHeight: '1.4rem',
        }}
      >
        {prepared.normalizedText}
      </div>
    </div>
  );
}
