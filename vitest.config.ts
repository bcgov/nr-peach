// Configure Vitest (https://vitest.dev/config/)
import { coverageConfigDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    clearMocks: true,
    coverage: {
      exclude: ['*.ts', '**/migrations/**', ...coverageConfigDefaults.exclude],
      reporter: ['clover', 'html', 'json', 'lcov', 'text', 'text-summary']
    },
    globals: true, // Globally imports (describe, test, expect)
    setupFiles: ['tests/vitest.setup.ts']
  }
});
