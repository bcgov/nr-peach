// Configure Vitest (https://vitest.dev/config/)
import { coverageConfigDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    clearMocks: true,
    coverage: {
      enabled: true, // Set true to always emit coverage on success
      exclude: ['*.ts', '**/migrations/**', ...coverageConfigDefaults.exclude],
      reporter: ['clover', 'html', 'json', 'lcov', 'text', 'text-summary'],
      reportOnFailure: true
    },
    globals: true, // Globally imports (describe, test, expect)
    mockReset: true, // Reset mocks before each test
    setupFiles: ['tests/vitest.setup.ts']
  }
});
