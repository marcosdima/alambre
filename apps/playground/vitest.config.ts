import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    alias: {
      alambre: resolve(import.meta.dirname, '../../packages/alambre/src/storage/index.ts'),
    },
  },
});
