import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:4173/wallet-balance-checker/',
    headless: true,
  },
  webServer: {
    command: 'npm run preview',
    port: 4173,
    timeout: 30000,
    reuseExistingServer: !process.env.CI,
  },
});
