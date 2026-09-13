import { describe, expect, it } from 'vitest';
import {
  addItem,
  createItem,
  createItemId,
  removeItem,
  updateItem,
} from '../src/items/items-model';
import type { Item } from '../src/items/item-types';

const base = { name: 'llaves', color: '#22c55e', icon: 'keys' as const };

describe('items-model', () => {
  it('creates items with unique ids', () => {
    expect(createItemId()).not.toBe(createItemId());
    const a = createItem(base);
    const b = createItem(base);
    expect(a.id).not.toBe(b.id);
    expect(a).toMatchObject(base);
  });

  it('adds an item at the end', () => {
    const items = [createItem(base)];
    const next = addItem(items, { name: 'billetera', color: '#ef4444', icon: 'wallet' });
    expect(next).toHaveLength(2);
    expect(next[1].name).toBe('billetera');
  });

  it('updates an item by id without mutating the source array', () => {
    const items: Item[] = [createItem(base)];
    const next = updateItem(items, items[0].id, { name: 'llaves de casa' });
    expect(items[0].name).toBe('llaves');
    expect(next[0].name).toBe('llaves de casa');
  });

  it('returns the list untouched when updating an unknown id', () => {
    const items = [createItem(base)];
    expect(updateItem(items, 'nope', { name: 'x' })).toEqual(items);
  });

  it('removes an item by id', () => {
    const items = [createItem(base), createItem({ ...base, name: 'b' })];
    const next = removeItem(items, items[0].id);
    expect(next).toHaveLength(1);
    expect(next[0].name).toBe('b');
  });
});
