import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    restoreMocks: true,
    setupFiles: ['./src/testUtils/setupTests.ts'],
    typecheck: {
      enabled: true,
    },
  },
});
