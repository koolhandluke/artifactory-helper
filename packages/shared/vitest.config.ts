import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    clearMocks: true,
    coverage: {
      reporter: ['text', 'lcov', 'json-summary'],
    },
    unstubEnvs: true,
    unstubGlobals: true,
    restoreMocks: true,
    include: ['src/**/*.test.{js,ts}'],
  },
});
