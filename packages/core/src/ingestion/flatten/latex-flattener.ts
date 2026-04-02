import { existsSync, lstatSync, readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { relative, resolve, sep } from 'node:path';

const INPUT_COMMAND_RE = /\\(input|include)(?![A-Za-z])\s*(?:\{([^}]+)\}|([^\s%]+))/g;
const BIB_COMMAND_RE = /\\(bibliography|addbibresource)\s*\{([^}]+)\}/g;
const GRAPHICS_COMMAND_RE = /\\includegraphics(?:\[[^\]]*\])?\s*\{([^}]+)\}/g;

export interface FlattenLatexResult {
  flatTex: string;
  lineMap: FlattenLatexLine[];
  missingInputs: string[];
  missingBibs: string[];
  missingGraphics: string[];
}

export interface FlattenLatexLine {
  sourcePath: string;
  sourceLine: number;
}

interface InlineTextResult {
  flatTex: string;
  lineMap: FlattenLatexLine[];
}

function normalizeDisplayPath(path: string): string {
  return path.split(sep).join('/');
}

function readUtf8(path: string): string {
  return readFileSync(path, 'utf8');
}

function stripLineComment(line: string): string {
  let output = '';

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '%') {
      if (index > 0 && line[index - 1] === '\\') {
        output += char;
        continue;
      }

      break;
    }

    output += char;
  }

  return output;
}

function resolveTexPath(rootDir: string, reference: string): string | undefined {
  const trimmedReference = reference.trim();
  if (!trimmedReference) {
    return undefined;
  }

  const candidate = resolve(rootDir, trimmedReference);
  if (existsSync(candidate) && lstatSync(candidate).isFile()) {
    return candidate;
  }

  if (!candidate.endsWith('.tex')) {
    const texCandidate = `${candidate}.tex`;
    if (existsSync(texCandidate) && lstatSync(texCandidate).isFile()) {
      return texCandidate;
    }
  }

  return undefined;
}

function loadEntry(path: string): { entryPath: string; entryText: string } {
  if (path.endsWith('.gz')) {
    const virtualEntryPath = resolve(path.slice(0, -3).replace(/\.tex$/u, '') + '.tex');
    const entryText = gunzipSync(readFileSync(path)).toString('utf8');

    return {
      entryPath: virtualEntryPath,
      entryText,
    };
  }

  if (existsSync(path) && lstatSync(path).isDirectory()) {
    const mainTexPath = resolve(path, 'main.tex');
    if (!existsSync(mainTexPath) || !lstatSync(mainTexPath).isFile()) {
      throw new Error(`Directory does not contain main.tex: ${path}`);
    }

    return {
      entryPath: mainTexPath,
      entryText: readUtf8(mainTexPath),
    };
  }

  return {
    entryPath: path,
    entryText: readUtf8(path),
  };
}

function scanAssets(
  rootDir: string,
  entryPath: string,
  line: string,
  missingBibs: Set<string>,
  missingGraphics: Set<string>,
): void {
  BIB_COMMAND_RE.lastIndex = 0;
  for (const match of line.matchAll(BIB_COMMAND_RE)) {
    const references = (match[2] ?? '')
      .split(',')
      .map((reference) => reference.trim())
      .filter(Boolean);

    for (const reference of references) {
      const resolvedReference = resolve(rootDir, reference);
      const bibliographyPath = resolvedReference.endsWith('.bib') ? resolvedReference : `${resolvedReference}.bib`;
      const compiledBibliographyPath = entryPath.replace(/\.tex$/u, '.bbl');

      if ((!existsSync(bibliographyPath) || !lstatSync(bibliographyPath).isFile()) && !existsSync(compiledBibliographyPath)) {
        missingBibs.add(bibliographyPath.split(sep).at(-1) ?? bibliographyPath);
      }
    }
  }

  GRAPHICS_COMMAND_RE.lastIndex = 0;
  for (const match of line.matchAll(GRAPHICS_COMMAND_RE)) {
    const reference = (match[1] ?? '').trim();
    if (!reference) {
      continue;
    }

    const graphicPath = resolve(rootDir, reference);
    if (/\.[A-Za-z0-9]+$/u.test(reference)) {
      if (!existsSync(graphicPath) || !lstatSync(graphicPath).isFile()) {
        missingGraphics.add(reference);
      }

      continue;
    }

    const extensions = ['.pdf', '.png', '.jpg', '.jpeg', '.eps'];
    const found = extensions.some((extension) => {
      const candidate = `${graphicPath}${extension}`;
      return existsSync(candidate) && lstatSync(candidate).isFile();
    });

    if (!found) {
      missingGraphics.add(reference);
    }
  }
}

export function flattenLatex(inputPath: string): FlattenLatexResult {
  const resolvedInputPath = resolve(inputPath);
  const { entryPath, entryText } = loadEntry(resolvedInputPath);
  const rootDir = resolve(relative(entryPath, entryPath) === '' ? resolve(entryPath, '..') : resolve(entryPath, '..'));
  const workspaceDir = process.cwd();
  const visited = new Set<string>();
  const missingInputs = new Set<string>();
  const missingBibs = new Set<string>();
  const missingGraphics = new Set<string>();

  const inlineText = (path: string, text: string): InlineTextResult => {
    if (visited.has(path)) {
      return {
        flatTex: `% [latex-flattener] Skipping already-inlined file: ${path.split(sep).at(-1) ?? path}\n`,
        lineMap: [
          {
            sourcePath: normalizeDisplayPath(relative(workspaceDir, path)),
            sourceLine: 0,
          },
        ],
      };
    }

    visited.add(path);

    const relativePath = normalizeDisplayPath(relative(rootDir, path));
    const sourcePath = normalizeDisplayPath(relative(workspaceDir, path));
    const output: string[] = [`% >>> BEGIN FILE: ${relativePath}\n`];
    const lineMap: FlattenLatexLine[] = [{ sourcePath, sourceLine: 0 }];

    for (const [index, rawLine] of text.split(/(?<=\n)/u).entries()) {
      const sourceLine = index + 1;
      const strippedLine = stripLineComment(rawLine);
      scanAssets(rootDir, entryPath, strippedLine, missingBibs, missingGraphics);

      INPUT_COMMAND_RE.lastIndex = 0;
      const match = INPUT_COMMAND_RE.exec(strippedLine);
      if (!match) {
        output.push(rawLine);
        lineMap.push({
          sourcePath,
          sourceLine,
        });
        continue;
      }

      const reference = (match[2] ?? match[3] ?? '').trim();
      const resolvedReference = resolveTexPath(rootDir, reference);

      if (!resolvedReference) {
        missingInputs.add(reference);
        output.push(rawLine);
        lineMap.push({
          sourcePath,
          sourceLine,
        });
        continue;
      }

      const inlined = inlineText(resolvedReference, readUtf8(resolvedReference));
      output.push(inlined.flatTex);
      lineMap.push(...inlined.lineMap);
    }

    output.push(`% <<< END FILE: ${relativePath}\n`);
    lineMap.push({
      sourcePath,
      sourceLine: 0,
    });

    return {
      flatTex: output.join(''),
      lineMap,
    };
  };

  const flattened = inlineText(entryPath, entryText);

  return {
    flatTex: flattened.flatTex,
    lineMap: flattened.lineMap,
    missingInputs: [...missingInputs].sort(),
    missingBibs: [...missingBibs].sort(),
    missingGraphics: [...missingGraphics].sort(),
  };
}
