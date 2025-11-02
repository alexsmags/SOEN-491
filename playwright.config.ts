import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  retries: process.env.CI ? 2 : 0,
  timeout: 60_000,
  expect: { timeout: 5_000 },
  reporter: [
    ['list'],
    [
      'html',
      { outputFolder: 'ai-image-captioner/playwright-report', open: 'never' },
    ],
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on',              // ✅ always collect trace
    video: 'on',              // ✅ record video for all tests
    screenshot: 'on',         // ✅ take screenshots for all tests
    actionTimeout: 15_000,    // extra safety for slow UI
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm run dev',
      cwd: 'ai-image-captioner/server',
      port: 5000, // ✅ match your .env PORT
      reuseExistingServer: !process.env.CI,
      env: {
        NODE_ENV: 'e2e',
        PORT: '5000',
      },
    },
    {
      command:
        'npm run preview -- --port 5173 --strictPort --mode e2e',
      cwd: 'ai-image-captioner/client',
      port: 5173,
      reuseExistingServer: !process.env.CI,
      env: {
        NODE_ENV: 'e2e',
        VITE_API_URL: 'http://localhost:5000',
      },
    },
  ],
});
