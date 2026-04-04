import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('cloud run deployment artifact', () => {
  it('ships a repo-defined dockerfile for the combined deployed service', () => {
    const dockerfile = readFileSync(resolve(process.cwd(), 'Dockerfile'), 'utf8');

    expect(dockerfile).toContain('FROM node:22-bookworm-slim AS build');
    expect(dockerfile).toContain('RUN npm ci');
    expect(dockerfile).toContain('RUN npm run build');
    expect(dockerfile).toContain('ENV PAPERPARSER_RUNTIME_MODE=deployed');
    expect(dockerfile).toContain('ENV PAPERPARSER_WEB_DIST=/app/packages/web/dist');
    expect(dockerfile).toContain('CMD ["node", "packages/cli/dist/index.js", "serve", "--deployed"]');
  });
});
