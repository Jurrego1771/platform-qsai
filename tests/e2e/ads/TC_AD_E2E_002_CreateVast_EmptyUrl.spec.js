import { test, expect } from '../../../fixtures/authBrowser.fixture.js';
import { DataFactory } from '../../../utils/dataFactory.js';

/**
 * TC_AD_E2E_002 — Validación de URL vacía en formulario de ad
 *
 * Revenue critical: ads sin creative URL no generan impresiones.
 * Este test verifica que el formulario rechaza la URL vacía con un mensaje de error.
 *
 * Si este test FALLA → es un bug real (el formulario no valida).
 */
test.describe('TC_AD_E2E_002 — Formulario ad rechaza URL vacía', {
  tag: ['@ad', '@e2e', '@critical'],
}, () => {
  test('Enviar formulario con vast_url vacía debe mostrar error de validación', async ({ page }) => {
    await page.goto('/ad/create');
    await page.waitForLoadState('networkidle');

    const nameInput = page.locator('input[name="name"], input[name="title"]').first();
    await expect(nameInput).toBeVisible({ timeout: 10_000 });
    await nameInput.fill(DataFactory.adName());

    // Leave URL field empty intentionally
    const urlInput = page.locator('input[name="vast_url"], input[name="url"]').first();
    if (await urlInput.isVisible()) {
      await urlInput.clear();
    }

    const submitBtn = page.getByRole('button', { name: /guardar|save|crear|create/i }).first();
    await submitBtn.click();

    // Should NOT redirect away from create form
    await page.waitForTimeout(1500);
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/ad\/(create|new)/i);

    // Should show validation error
    const errorVisible = await page.locator(
      '.has-error, .alert-danger, .error, [class*="error"], .help-block:visible'
    ).count() > 0;

    expect(errorVisible).toBeTruthy();
  });
});
