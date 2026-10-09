import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/ui',
  timeout: 30000,
  use: {
    baseURL: 'http://127.0.0.1:4181',
    browserName: 'chromium',
    ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}),
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4181 --strictPort',
    url: 'http://127.0.0.1:4181',
    reuseExistingServer: !process.env.CI,
  },
})
