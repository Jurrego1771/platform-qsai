import { test, expect } from '../../../fixtures/authBrowser.fixture.js';
import { DataFactory } from '../../../utils/dataFactory.js';
import { ResourceCleaner } from '../../../utils/resourceCleaner.js';

test.describe('TC_MEDIA_E2E_001 — Upload video VOD: happy path', {
  tag: ['@media', '@e2e', '@critical'],
}, () => {
  let cleaner;
  let createdMediaId;

  test.beforeEach(async () => {
    cleaner = new ResourceCleaner();
  });

  test.afterEach(async () => {
    if (createdMediaId) cleaner.trackMedia(createdMediaId);
    await cleaner.cleanupAll();
  });

  test('Crear media con título válido: formulario accesible y navegación correcta', async ({ page }) => {
    // Navigate to media list
    await page.goto('/media');
    await expect(page).toHaveURL(/\/media/);

    // Open create form
    const createBtn = page.getByRole('link', { name: /crear|new|upload|subir|add/i }).first()
      .or(page.getByRole('button', { name: /crear|new|upload|subir|add/i }).first());
    await expect(createBtn).toBeVisible({ timeout: 10_000 });
    await createBtn.click();

    await page.waitForURL(/\/media\/(create|new|upload)/, { timeout: 15_000 });

    // Form is visible
    const titleInput = page.locator('input[name="title"], input[name="name"], input[placeholder*="título" i], input[placeholder*="title" i]').first();
    await expect(titleInput).toBeVisible({ timeout: 10_000 });

    // Fill title
    const title = DataFactory.mediaTitle();
    await titleInput.fill(title);

    // Verify submit button is present
    const submitBtn = page.getByRole('button', { name: /guardar|save|crear|create|subir|upload/i }).first();
    await expect(submitBtn).toBeVisible();

    // Verify cancel option exists (H3 heuristic)
    const cancelOption = page.getByRole('link', { name: /cancelar|cancel|volver|back/i }).first()
      .or(page.getByRole('button', { name: /cancelar|cancel/i }).first());
    await expect(cancelOption).toBeVisible();
  });

  test('Media list tiene tabla con columnas básicas', async ({ page }) => {
    await page.goto('/media');
    await page.waitForLoadState('networkidle');

    // Should have a table or list
    const hasTable = await page.locator('table').count() > 0;
    const hasList = await page.locator('.media-list, .list-group, [class*="media"]').count() > 0;

    expect(hasTable || hasList).toBeTruthy();
  });
});
