import type { ReactNode } from 'react';

/**
 * Checks whether a ReactNode contains text or numeric content (or an array
 * containing string/number primitives) that must be wrapped inside a `<Text>`
 * component to avoid React Native's "Text strings must be rendered within a <Text> component" error.
 */
export function isTextContent(node: ReactNode): boolean {
  if (node === null || node === undefined || typeof node === 'boolean') {
    return false;
  }
  if (typeof node === 'string' || typeof node === 'number') {
    return true;
  }
  if (Array.isArray(node)) {
    return node.some((child) => isTextContent(child));
  }
  return false;
}
