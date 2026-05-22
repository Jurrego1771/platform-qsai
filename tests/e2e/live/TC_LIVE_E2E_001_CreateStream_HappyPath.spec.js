import { test, expect } from '../../../fixtures/authBrowser.fixture.js';
import { DataFactory } from '../../../utils/dataFactory.js';
import { ResourceCleaner } from '../../../utils/resourceCleaner.js';

test.describe('TC_LIVE_E2E_001 — Crear live stream: happy path', {
  tag: ['@live', '@e2e', '@critical'],
}, () => {
  let cleaner;
  let createdLiveId;

  test.beforeEach(async () => {
    cleaner = new ResourceCleaner();
  });

  test.afterEach(async () => {
    if (createdLiveId) cleaner.trackLiveStream(createdLiveId);
    await cleaner.cleanupAll();
  });

  test('Live list carga correctamente con estados de streams', async ({ page }) => {
    await page.goto('/live');
    await page.waitForLoadState('networkidle');

    // Should have table or list
    const hasContent = await page.locator('table, .list-group, [class*="live"]').count() > 0;
    expect(hasContent).toBeTruthy();
  });

  test('Formulario de creación de live stream es accesible', async ({ page }) => {
    await page.goto('/live/create');
    await page.waitForLoadState('networkidle');

    // Name/title field
    const nameInput = page.locator('input[name="name"], input[name="title"]').first();
    await expect(nameInput).toBeVisible({ timeout: 10_000 });

    // Submit button
    const submitBtn = page.getByRole('button', { name: /guardar|save|crear|create/i }).first();
    await expect(submitBtn).toBeVisible();

    // Cancel option (H3 heuristic — user control)
    const cancelOption = page.getByRole('link', { name: /cancelar|cancel|volver|back/i }).first()
      .or(page.getByRole('button', { name: /cancelar|cancel/i }).first());
    await expect(cancelOption).toBeVisible();
  });

  test('Crear live stream con nombre válido genera credenciales RTMP', async ({ page }) => {
    const streamData = DataFactory.generateLiveStreamPayload();

    await page.goto('/live/create');
    await page.waitForLoadState('networkidle');

    const nameInput = page.locator('input[name="name"], input[name="title"]').first();
    await expect(nameInput).toBeVisible({ timeout: 10_000 });
    await nameInput.fill(streamData.name);

    const submitBtn = page.getByRole('button', { name: /guardar|save|crear|create/i }).first();
    await submitBtn.click();

    // Should redirect to detail page after creation
    await page.waitForURL(/\/live\/([a-f0-9]{24}|[a-z0-9-]+)$/, { timeout: 20_000 });

    // Extract ID from URL
    const idMatch = page.url().match(/\/live\/([a-f0-9]{24}|[a-z0-9-]+)$/i);
    if (idMatch) createdLiveId = idMatch[1];

    // Verify RTMP credentials are visible on detail page
    await page.waitForLoadState('networkidle');
    const hasRtmpInfo = await page.locator(
      'text=/rtmp/i, [class*="rtmp"], [class*="credential"], input[readonly]'
    ).count() > 0;

    // RTMP credentials should be present on stream detail page
    expect(hasRtmpInfo).toBeTruthy();
  });
});
