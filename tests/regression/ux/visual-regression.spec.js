import { test, expect } from '@playwright/test';
import { compareScreenshots } from '../../ux/visual-diff.js';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'https://dev.platform.mediastre.am';
const BASELINE_DIR = './reports/baseline/screenshots';
const CURRENT_DIR = './test-results/screenshots-current';
const THRESHOLD = parseFloat(process.env.VISUAL_DIFF_THRESHOLD || '0.02');

// Critical views that must pass visual regression on every PR
const CRITICAL_VIEWS = [
  { name: 'media-list', path: '/media' },
  { name: 'ad-list', path: '/ad' },
  { name: 'live-list', path: '/live' },
  { name: 'dashboard', path: '/' },
];

test.describe('Visual Regression — Critical Views', {
  tag: ['@regression', '@visual'],
}, () => {
  test.beforeAll(async () => {
    fs.mkdirSync(CURRENT_DIR, { recursive: true });
  });

  for (const view of CRITICAL_VIEWS) {
    test(`${view.name} — no visual regression vs baseline`, async ({ browser }) => {
      const baselinePath = path.join(BASELINE_DIR, `${view.name}-desktop.png`);

      // Skip if no baseline exists yet
      if (!fs.existsSync(baselinePath)) {
        test.skip(true, `No baseline for ${view.name} — run npm run ux:audit first`);
        return;
      }

      const ctx = await browser.newContext({
        storageState: '.auth/user.json',
        viewport: { width: 1280, height: 800 },
        locale: 'es-CL',
      });
      const page = await ctx.newPage();

      await page.goto(`${BASE_URL}${view.path}`, { waitUntil: 'networkidle', timeout: 30_000 });
      await page.waitForTimeout(2000);

      const currentPath = path.join(CURRENT_DIR, `${view.name}-desktop.png`);
      await page.screenshot({ path: currentPath, fullPage: true });
      await ctx.close();

      const diffPath = path.join(CURRENT_DIR, `${view.name}-diff.png`);
      const result = await compareScreenshots(currentPath, baselinePath, diffPath);

      if (result.isRegression) {
        const diffPercent = (result.diffPercent * 100).toFixed(2);
        throw new Error(
          `Visual regression in ${view.name}: ${diffPercent}% pixels changed (threshold: ${(THRESHOLD * 100).toFixed(0)}%)\n` +
          `Diff saved to: ${diffPath}`
        );
      }
    });
  }
});
