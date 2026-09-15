import { getItem, saveItem, removeItem } from '../utils/storage';
import type { RawStorage } from './types';

export const asyncStorageRaw: RawStorage = {
  getItem,
  setItem: saveItem,
  removeItem,
};
