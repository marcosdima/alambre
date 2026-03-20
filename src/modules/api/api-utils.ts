import type { QueryParams } from './api-types';

export const buildUrl = (baseUrl: string, path: string, query?: QueryParams): string => {
  const normalizedBase = baseUrl.endsWith('/')
    ? baseUrl.slice(0, -1)
    : baseUrl;

  const normalizedPath = path.startsWith('/')
    ? path
    : `/${path}`;

  if (!query) return `${normalizedBase}${normalizedPath}`;

  const queryString = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');

  if (!queryString) return `${normalizedBase}${normalizedPath}`;

  return `${normalizedBase}${normalizedPath}?${queryString}`;
};

export const resolveValue = <T,>(value: T | (() => T)): T => {
  if (typeof value === 'function') {
    return (value as () => T)();
  }
  return value;
};
