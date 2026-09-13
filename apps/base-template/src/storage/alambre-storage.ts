import type { Storage } from 'alambre';
import type { RawStorage } from './types';

export const toAlambreStorage = (raw: RawStorage): Storage => ({
  get: (key) => raw.getItem(key),
  set: (key, value) => raw.setItem(key, value),
  remove: (key) => raw.removeItem(key),
});
