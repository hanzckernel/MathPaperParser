import { describe, expect, it } from 'vitest';

import { shouldExitProcess } from '../src/index.js';

describe('cli entrypoint lifecycle', () => {
  it('keeps long-running commands alive instead of exiting the process immediately', () => {
    expect(shouldExitProcess('serve')).toBe(false);
    expect(shouldExitProcess('mcp')).toBe(false);
  });

  it('exits immediately for bounded commands', () => {
    expect(shouldExitProcess('analyze')).toBe(true);
    expect(shouldExitProcess('status')).toBe(true);
    expect(shouldExitProcess(undefined)).toBe(true);
  });
});
