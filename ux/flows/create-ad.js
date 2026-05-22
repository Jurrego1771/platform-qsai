export const createAdFlow = {
  name: 'create-ad',
  description: 'Crear nuevo ad VAST: desde lista hasta formulario con datos básicos, sin persistir',
  steps: [
    {
      name: 'ads-list',
      path: '/ad',
      screenshot: true,
      axe: true,
      description: 'Lista de ads — revisar organización, CTAs y empty state',
    },
    {
      name: 'click-create',
      description: 'Click en botón de crear nuevo ad',
      action: async (page) => {
        const btn = page.getByRole('button', { name: /crear|new|create|agregar|add/i }).first();
        await btn.waitFor({ timeout: 5_000 });
        await btn.click();
        await page.waitForTimeout(800);
      },
    },
    {
      name: 'create-form-empty',
      screenshot: true,
      axe: true,
      description: 'Formulario de ad vacío — evaluar campos VAST (URL, tipo, targeting)',
    },
    {
      name: 'fill-name',
      description: 'Llenar nombre del ad',
      action: async (page) => {
        const nameInput = page.getByRole('textbox', { name: /nombre|name|título|title/i }).first();
        await nameInput.waitFor({ timeout: 5_000 }).catch(() => null);
        await nameInput.fill('[QA-E2E] Test Ad UX Audit');
        await page.waitForTimeout(400);
      },
    },
    {
      name: 'create-form-filled',
      screenshot: true,
      description: 'Formulario con nombre — evaluar densidad de campos y claridad de terminología VAST',
    },
    {
      name: 'cancel',
      description: 'Cancelar sin crear — no persistir datos de prueba (revenue critical)',
      action: async (page) => {
        const cancel = page.getByRole('button', { name: /cancelar|cancel|cerrar|close|volver|back/i }).first();
        const exists = await cancel.isVisible().catch(() => false);
        if (exists) {
          await cancel.click();
        } else {
          await page.keyboard.press('Escape');
        }
        await page.waitForTimeout(500);
      },
    },
  ],
};
