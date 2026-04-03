export function resolveMountElement(
  getElementById: (id: string) => Element | null,
): Element {
  const root = getElementById('root');
  if (root) {
    return root;
  }

  throw new Error('PaperParser dashboard could not find a #root mount element in index.html.');
}
