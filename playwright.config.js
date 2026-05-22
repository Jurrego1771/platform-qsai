import 'dotenv/config';
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: process.env.CI ? 60_000 : 30_000,
  workers: process.env.CI ? 2 : 1,
  retries: process.env.CI ? 2 : 1,
  fullyParallel: false,

  use: {
    baseURL: process.env.BASE_URL || 'https://dev.platform.mediastre.am',
    storageState: '.auth/user.json',
    headless: true,
    viewport: { width: 1280, height: 800 },
    locale: 'es-CL',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  globalSetup: './ux/flows/global-setup.js',

  projects: [
    {
      name: 'e2e',
      testMatch: '**/tests/e2e/**/*.spec.js',
      timeout: 60_000,
    },
    {
      name: 'regression',
      testMatch: '**/tests/regression/**/*.spec.js',
    },
    {
      name: 'integration',
      testMatch: '**/tests/integration/**/*.spec.js',
      timeout: 90_000,
    },
  ],

  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    [
      'allure-playwright',
      {
        detail: true,
        outputFolder: 'allure-results',
        suiteTitle: true,
        environmentInfo: {
          node_version: process.version,
          base_url: process.env.BASE_URL || 'N/A',
          env: process.env.MS_ENV || 'dev',
          ci: process.env.CI ? 'true' : 'false',
        },
      },
    ],
  ],
});
