// eslint-disable-next-line import/no-unresolved
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    restoreMocks: true,
    minWorkers: 1,
    maxWorkers: 1,
    setupFiles: ['./src/setupTests.ts'],
  },
});
