import type { Item, ItemInput } from './item-types';

export const itemColors = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
] as const;

export const createItemId = (): string => (
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
);

export const createItem = (input: ItemInput): Item => ({
  ...input,
  id: createItemId(),
});

export const addItem = (items: Item[], input: ItemInput): Item[] => [
  ...items,
  createItem(input),
];

export const updateItem = (
  items: Item[],
  id: string,
  patch: Partial<ItemInput>,
): Item[] => items.map((item) => (item.id === id ? { ...item, ...patch } : item));

export const removeItem = (items: Item[], id: string): Item[] => (
  items.filter((item) => item.id !== id)
);
