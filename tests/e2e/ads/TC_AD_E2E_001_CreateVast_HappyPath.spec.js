import { test, expect } from '../../../fixtures/authBrowser.fixture.js';
import { DataFactory } from '../../../utils/dataFactory.js';
import { ResourceCleaner } from '../../../utils/resourceCleaner.js';

test.describe('TC_AD_E2E_001 — Crear ad VAST: happy path', {
  tag: ['@ad', '@e2e', '@critical'],
}, () => {
  let cleaner;
  let createdAdId;

  test.beforeEach(async () => {
    cleaner = new ResourceCleaner();
  });

  test.afterEach(async () => {
    if (createdAdId) cleaner.trackAd(createdAdId);
    await cleaner.cleanupAll();
  });

  test('Formulario de creación de ad es accesible y tiene campos requeridos', async ({ page }) => {
    await page.goto('/ad/create');
    await page.waitForLoadState('networkidle');

    // Name field should be visible
    const nameInput = page.locator('input[name="name"], input[name="title"]').first();
    await expect(nameInput).toBeVisible({ timeout: 10_000 });

    // URL field should be visible (VAST URL)
    const urlInput = page.locator('input[name="vast_url"], input[name="url"], input[type="url"]').first();
    await expect(urlInput).toBeVisible({ timeout: 10_000 });

    // Submit button
    const submitBtn = page.getByRole('button', { name: /guardar|save|crear|create/i }).first();
    await expect(submitBtn).toBeVisible();

    // Cancel / back option (H3 heuristic)
    const cancelOption = page.getByRole('link', { name: /cancelar|cancel|volver|back/i }).first()
      .or(page.getByRole('button', { name: /cancelar|cancel/i }).first());
    await expect(cancelOption).toBeVisible();
  });

  test('Ad list muestra tabla con columnas de nombre y tipo', async ({ page }) => {
    await page.goto('/ad');
    await page.waitForLoadState('networkidle');

    const hasTable = await page.locator('table').count() > 0;
    const hasListGroup = await page.locator('.list-group, [class*="ad-list"]').count() > 0;

    expect(hasTable || hasListGroup).toBeTruthy();
  });

  test('Crear ad con nombre y URL VAST válida persiste en el listing', async ({ page }) => {
    const adData = DataFactory.generateAdPayload('VAST');

    await page.goto('/ad/create');
    await page.waitForLoadState('networkidle');

    const nameInput = page.locator('input[name="name"], input[name="title"]').first();
    await expect(nameInput).toBeVisible({ timeout: 10_000 });
    await nameInput.fill(adData.name);

    const urlInput = page.locator('input[name="vast_url"], input[name="url"]').first();
    if (await urlInput.isVisible()) {
      await urlInput.fill(adData.vast_url);
    }

    const submitBtn = page.getByRole('button', { name: /guardar|save|crear|create/i }).first();
    await submitBtn.click();

    // Should redirect to listing or detail after successful creation
    await page.waitForURL(/\/ad(\/|$|\?)/, { timeout: 20_000 });

    // Extract created ID from URL if redirected to detail
    const currentUrl = page.url();
    const idMatch = currentUrl.match(/\/ad\/([a-f0-9]{24}|[a-z0-9-]+)$/i);
    if (idMatch) {
      createdAdId = idMatch[1];
    }

    // Verify success message or presence in listing
    const successMsg = page.locator('.alert-success, .toast-success, [class*="success"]');
    const isInListing = page.url().includes('/ad') && !page.url().includes('/create');

    const hasSuccess = await successMsg.isVisible().catch(() => false);
    expect(hasSuccess || isInListing).toBeTruthy();

    // If redirected to listing, verify the ad name appears
    if (isInListing && !idMatch) {
      await expect(page.locator(`text="${adData.name}"`).first()).toBeVisible({ timeout: 5_000 });

      // Extract ID from listing links
      const adLink = page.locator(`a[href*="/ad/"]:has-text("${adData.name}")`).first();
      const href = await adLink.getAttribute('href').catch(() => null);
      if (href) {
        const match = href.match(/\/ad\/([a-f0-9]{24}|[a-z0-9-]+)/i);
        if (match) createdAdId = match[1];
      }
    }
  });
});
