import { expect } from 'vitest';

const REGISTRY_KEY = '__alambreIconSharedValues__';

type Box = { value: number };

export const getBoxes = (): Box[] => {
  const g = globalThis as unknown as Record<string, Box[]>;
  if (!g[REGISTRY_KEY]) g[REGISTRY_KEY] = [];
  return g[REGISTRY_KEY];
};

export const clearBoxes = () => {
  getBoxes().length = 0;
};

export const strokePairs = (): Box[][] => {
  const boxes = getBoxes();
  const pairs: Box[][] = [];
  for (let i = 0; i < boxes.length; i += 2) {
    pairs.push([boxes[i], boxes[i + 1]]);
  }
  return pairs;
};

export const expectStrokeState = (
  pair: Box[],
  dasharray: number,
  strokeOffset: number,
  drawn: boolean,
) => {
  const [dashoffset, progress] = pair as [Box, Box];
  expect(dashoffset.value).toBeCloseTo(drawn ? dasharray * (strokeOffset / 100) : dasharray, 4);
  expect(progress.value).toBeCloseTo(drawn ? 1 : 0, 4);
};

type JsonProps = Record<string, unknown>;
type JsonNode = { type: string | null; props: JsonProps; children?: JsonNode[] };

export const findAllHost = (
  root: unknown,
  predicate: (props: JsonProps) => boolean,
): JsonProps[] => {
  const found: JsonProps[] = [];
  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return;
    const n = node as JsonNode;
    if (n.props && typeof n.type === 'string' && predicate(n.props)) found.push(n.props);
    const children = Array.isArray(n.children) ? n.children : [];
    children.forEach(walk);
  };
  walk(root);
  return found;
};

export const svgOf = (root: unknown): JsonProps[] => findAllHost(root, (p) => 'viewBox' in p);

export const linesOf = (root: unknown): JsonProps[] =>
  findAllHost(root, (p) => 'x1' in p && 'y1' in p && 'x2' in p && 'y2' in p);

export const circlesOf = (root: unknown): JsonProps[] =>
  findAllHost(root, (p) => 'cx' in p && 'cy' in p && 'r' in p);

export const flatten = (style: unknown): JsonProps[] => {
  if (!style) return [];
  if (Array.isArray(style)) return style.flatMap(flatten);
  return [style as JsonProps];
};

export const expectRotation = (style: unknown, deg: number) => {
  expect(
    flatten(style).some(
      (entry) =>
        Array.isArray(entry?.transform) &&
        (entry.transform as unknown[]).some(
          (t: unknown) =>
            typeof t === 'object' &&
            t !== null &&
            typeof (t as JsonProps).rotate === 'string' &&
            parseFloat(String((t as JsonProps).rotate)) === deg,
        ),
    ),
  ).toBe(true);
};
