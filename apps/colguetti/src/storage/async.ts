import { getItem, saveItem, removeItem } from '../utils/storage';
import { createJsonStorage } from './json-storage';
import type { JsonStorage, RawStorage } from './types';

export const asyncStorageRaw: RawStorage = {
  getItem,
  setItem: saveItem,
  removeItem,
};

export const asyncJsonStorage: JsonStorage = createJsonStorage(asyncStorageRaw);
