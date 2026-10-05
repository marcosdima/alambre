import { defineConfig } from 'vitest/config';
import { reactNative } from 'vitest-native';

export default defineConfig({
  plugins: [reactNative()],
  resolve: {
    mainFields: ['module', 'main'],
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/setup.ts'],
  },
});
