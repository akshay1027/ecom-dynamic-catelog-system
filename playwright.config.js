// @ts-check
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e/tests',
  timeout: 30_000,
  retries: 1,
  reporter: [
    ['json', { outputFile: '/tmp/e2e-results.json' }],
    ['html', { open: 'never' }],
  ],
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  webServer: [
    {
      command: 'cd backend && node src/server.js',
      url: 'http://localhost:3001/api/v1/products',
      reuseExistingServer: false,
      timeout: 15_000,
    },
    {
      command: 'cd frontend && npm run dev -- --port 5173',
      url: 'http://localhost:5173',
      reuseExistingServer: false,
      timeout: 30_000,
    },
  ],
});
