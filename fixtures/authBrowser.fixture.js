import { test as base, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import path from 'path';

function extractTestId(title) {
  const match = title.match(/TC_([A-Z]+)_([A-Z]+)_(\d+)/);
  return match ? match[0] : null;
}

function extractModule(title) {
  const match = title.match(/TC_([A-Z]+)_/);
  return match ? match[1].toLowerCase() : 'unknown';
}

export const test = base.extend({
  page: async ({ browser }, use, testInfo) => {
    const testId = extractTestId(testInfo.title);
    const module = extractModule(testInfo.title);

    const ctx = await browser.newContext({
      storageState: '.auth/user.json',
      baseURL: process.env.BASE_URL || 'https://dev.platform.mediastre.am',
      locale: 'es-CL',
    });

    const page = await ctx.newPage();

    // Allure auto-labeling from TC naming convention
    if (testId) {
      await allure.label('testId', testId);
      await allure.label('module', module);
    }
    await allure.label('environment', process.env.MS_ENV || 'dev');

    // Intercept non-2xx responses and attach evidence to Allure
    page.on('response', async (response) => {
      const url = response.url();
      const status = response.status();
      if (status >= 400 && !url.includes('axe-core') && !url.includes('unpkg.com')) {
        const body = await response.text().catch(() => '(empty)');
        await allure.attachment(
          `HTTP ${status} — ${new URL(url).pathname}`,
          `Status: ${status}\nURL: ${url}\nBody: ${body.slice(0, 500)}`,
          { contentType: 'text/plain' }
        );
      }
    });

    await use(page);

    // On test failure: take screenshot and attach to Allure
    if (testInfo.status !== testInfo.expectedStatus) {
      const screenshotPath = path.join(
        testInfo.outputDir,
        `${testInfo.title.replace(/[^a-z0-9]/gi, '-')}-failure.png`
      );
      await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => null);
      await testInfo.attach('screenshot', { path: screenshotPath, contentType: 'image/png' }).catch(() => null);
    }

    await ctx.close();
  },
});

export { expect };
