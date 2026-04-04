import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('project wiki docs contract', () => {
  it('links the root README to the wiki-style project entry page and routes the page to the main docs', async () => {
    const readme = await readFile(resolve(process.cwd(), 'README.md'), 'utf8');
    const projectWiki = await readFile(resolve(process.cwd(), 'docs/project_wiki.md'), 'utf8');

    expect(readme).toContain('docs/project_wiki.md');
    expect(projectWiki).toContain('docs/user_guide.md');
    expect(projectWiki).toContain('docs/architecture.md');
    expect(projectWiki).toContain('docs/deployment_readiness.md');
    expect(projectWiki).toContain('deploy/cloudrun/RUNBOOK.md');
  });
});
