import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

vi.mock('expo-clipboard', () => ({
  getStringAsync: vi.fn(async () => ''),
  setStringAsync: vi.fn(async () => true),
}));

afterEach(() => cleanup());

