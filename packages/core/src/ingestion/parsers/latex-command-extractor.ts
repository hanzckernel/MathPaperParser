export interface LatexCommandCall {
  command: string;
  optionalArg?: string;
  requiredArg: string;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function skipWhitespace(input: string, startIndex: number): number {
  let index = startIndex;

  while (index < input.length && /\s/u.test(input[index] ?? '')) {
    index += 1;
  }

  return index;
}

function readDelimitedContent(
  input: string,
  startIndex: number,
  openChar: string,
  closeChar: string,
): { content: string; nextIndex: number } | undefined {
  if (input[startIndex] !== openChar) {
    return undefined;
  }

  let depth = 0;
  let index = startIndex;
  let content = '';

  while (index < input.length) {
    const character = input[index];

    if (character === '\\') {
      if (depth > 0) {
        content += character;
      }
      index += 1;
      if (index < input.length && depth > 0) {
        content += input[index];
      }
      index += 1;
      continue;
    }

    if (character === openChar) {
      depth += 1;
      if (depth > 1) {
        content += character;
      }
      index += 1;
      continue;
    }

    if (character === closeChar) {
      depth -= 1;
      if (depth === 0) {
        return {
          content,
          nextIndex: index + 1,
        };
      }

      content += character;
      index += 1;
      continue;
    }

    if (depth > 0) {
      content += character;
    }
    index += 1;
  }

  return undefined;
}

export function extractFirstLatexCommand(input: string, command: string): LatexCommandCall | undefined {
  const pattern = new RegExp(`\\\\${escapeRegExp(command)}(?![A-Za-z])`, 'gu');

  for (const match of input.matchAll(pattern)) {
    const startIndex = match.index;
    if (startIndex === undefined) {
      continue;
    }

    let cursor = skipWhitespace(input, startIndex + match[0].length);
    let optionalArg: string | undefined;

    if (input[cursor] === '[') {
      const optional = readDelimitedContent(input, cursor, '[', ']');
      if (!optional) {
        continue;
      }
      optionalArg = optional.content;
      cursor = skipWhitespace(input, optional.nextIndex);
    }

    const required = readDelimitedContent(input, cursor, '{', '}');
    if (!required) {
      continue;
    }

    return {
      command,
      requiredArg: required.content,
      ...(optionalArg === undefined ? {} : { optionalArg }),
    };
  }

  return undefined;
}
