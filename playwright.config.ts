import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 35000,
  expect: { timeout: 10000 },
  fullyParallel: true,
  workers: 2,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5174',
    viewport: { width: 1440, height: 1000 },
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH || (process.env.PLAYWRIGHT_BUNDLED_BROWSER || process.platform === 'win32' ? undefined : '/usr/bin/chromium'),
      args: ['--no-sandbox'],
    },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm start',
    url: 'http://127.0.0.1:5174',
    env: { PORT: '5174', HOST: '127.0.0.1' },
    reuseExistingServer: false,
  },
});
