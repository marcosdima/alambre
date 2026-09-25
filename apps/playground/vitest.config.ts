import { defineConfig } from 'vitest/config';
import { reactNative } from 'vitest-native';

import path from 'node:path';

export default defineConfig({
  plugins: [reactNative()],
  resolve: {
    mainFields: ['module', 'main'],
    alias: {
      alambre: path.resolve(import.meta.dirname, '../../packages/alambre/src/index.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/setup.ts'],
    server: {
      deps: {
        inline: ['alambre', 'react-native-reanimated', 'react-native-worklets'],
      },
    },
    env: {
      JEST_WORKER_ID: '1',
    },
  },
});
