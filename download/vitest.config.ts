import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@artifactory-helper/shared': resolve(
        __dirname,
        '../packages/shared/src/index.ts',
      ),
    },
  },
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
