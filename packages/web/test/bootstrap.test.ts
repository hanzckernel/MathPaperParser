import { describe, expect, it } from 'vitest';

import { resolveMountElement } from '../src/lib/bootstrap.js';

describe('resolveMountElement', () => {
  it('returns the root mount node when present', () => {
    const root = { id: 'root' };

    expect(resolveMountElement((id) => (id === 'root' ? (root as unknown as Element) : null))).toBe(root);
  });

  it('throws a clear error when the root mount node is missing', () => {
    expect(() => resolveMountElement(() => null)).toThrowError(
      'PaperParser dashboard could not find a #root mount element in index.html.',
    );
  });
});
